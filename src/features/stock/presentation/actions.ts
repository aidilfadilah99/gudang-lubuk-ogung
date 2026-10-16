'use server';

import { revalidatePath } from 'next/cache';
import {
  claimIdempotencyKey,
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { DbExecutor, withUnitOfWork } from '@/shared/db/client';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin } from '@/shared/security/guard';
import { assertValidIdempotencyKey } from '@/shared/security/idempotency';
import { SessionUser } from '@/shared/security/session';
import { createStockAdjustmentUseCase } from '../application/create-adjustment';
import { createStockRepository } from '../infrastructure/stock-repository';
import { StockAdjustmentInput, stockAdjustmentSchema } from '../schemas';

async function executeAdjustmentTx(
  tx: DbExecutor,
  session: SessionUser,
  parsed: StockAdjustmentInput
) {
  await claimIdempotencyKey(tx, {
    key: parsed.idempotencyKey, warehouseId: session.warehouseId,
    actorId: session.id, operation: 'STOCK_ADJUSTMENT',
  });
  const stockRepo = createStockRepository(tx);
  const auditRepo = createAuditRepository(tx);

  return createStockAdjustmentUseCase(
    {
      warehouseId: session.warehouseId, actorId: session.id,
      actorUsername: session.username, actorRole: session.role,
      itemId: parsed.itemId, quantityDelta: parsed.quantityDelta,
      reasonCategory: parsed.reasonCategory, reasonDetail: parsed.reasonDetail,
    },
    {
      stockRepo,
      onAudit: async ({ entityId, afterData }) => {
        await recordAuditLogUseCase(
          {
            warehouseId: session.warehouseId, actorId: session.id,
            actorUsername: session.username, action: 'STOCK_ADJUSTMENT',
            entityType: 'STOCK_ADJUSTMENT', entityId, afterData,
          },
          { auditRepo }
        );
      },
    }
  );
}

export async function submitStockAdjustmentAction(formData: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = stockAdjustmentSchema.parse(formData);
    assertValidIdempotencyKey(parsed.idempotencyKey);
    const result = await withUnitOfWork((tx) =>
      executeAdjustmentTx(tx, session, parsed)
    );
    revalidatePath('/stock');
    revalidatePath('/dashboard');
    return { ok: true as const, data: result };
  } catch (error) {
    return translateDomainError(error);
  }
}
