'use server';

import { revalidatePath } from 'next/cache';
import {
  claimIdempotencyKey,
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { createStockRepository } from '@/features/stock';
import { DbExecutor, withUnitOfWork } from '@/shared/db/client';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin, requireStaffOrAdmin } from '@/shared/security/guard';
import { assertValidIdempotencyKey } from '@/shared/security/idempotency';
import { SessionUser } from '@/shared/security/session';
import { createReceiptUseCase } from '../application/create-receipt';
import { voidReceiptUseCase } from '../application/void-receipt';
import { createReceiptRepository } from '../infrastructure/receipt-repository';
import {
  CreateReceiptInput,
  createReceiptSchema,
  VoidReceiptInput,
  voidReceiptSchema,
} from '../schemas';

async function executeCreateReceiptTx(
  tx: DbExecutor,
  session: SessionUser,
  parsed: CreateReceiptInput
) {
  await claimIdempotencyKey(tx, {
    key: parsed.idempotencyKey,
    warehouseId: session.warehouseId,
    actorId: session.id,
    operation: 'RECEIPT_CREATE',
  });
  const doc = await createReceiptUseCase(
    {
      warehouseId: session.warehouseId,
      actorId: session.id,
      supplierId: parsed.supplierId,
      invoiceNumber: parsed.invoiceNumber,
      notes: parsed.notes,
      lines: parsed.lines,
    },
    {
      receiptRepo: createReceiptRepository(tx),
      stockRepo: createStockRepository(tx),
    }
  );
  await recordAuditLogUseCase(
    {
      warehouseId: session.warehouseId,
      actorId: session.id,
      actorUsername: session.username,
      action: 'RECEIPT_CREATE',
      entityType: 'STOCK_RECEIPT',
      entityId: doc.id,
      afterData: { receiptNumber: doc.receiptNumber, linesCount: doc.lines.length },
    },
    { auditRepo: createAuditRepository(tx) }
  );
  return doc;
}

export async function submitCreateReceiptAction(rawInput: unknown) {
  try {
    const session = await requireStaffOrAdmin();
    const parsed = createReceiptSchema.parse(rawInput);
    assertValidIdempotencyKey(parsed.idempotencyKey);
    const doc = await withUnitOfWork((tx) =>
      executeCreateReceiptTx(tx, session, parsed)
    );
    revalidatePath('/receipts');
    revalidatePath('/stock');
    revalidatePath('/dashboard');
    return { ok: true as const, data: doc };
  } catch (error) {
    return translateDomainError(error);
  }
}

async function executeVoidReceiptTx(
  tx: DbExecutor,
  session: SessionUser,
  parsed: VoidReceiptInput
) {
  await claimIdempotencyKey(tx, {
    key: parsed.idempotencyKey,
    warehouseId: session.warehouseId,
    actorId: session.id,
    operation: 'RECEIPT_VOID',
  });
  const doc = await voidReceiptUseCase(
    {
      warehouseId: session.warehouseId,
      receiptId: parsed.receiptId,
      voidReason: parsed.voidReason,
      actorId: session.id,
      actorRole: session.role,
    },
    {
      receiptRepo: createReceiptRepository(tx),
      stockRepo: createStockRepository(tx),
    }
  );
  await recordAuditLogUseCase(
    {
      warehouseId: session.warehouseId,
      actorId: session.id,
      actorUsername: session.username,
      action: 'RECEIPT_VOID',
      entityType: 'STOCK_RECEIPT',
      entityId: doc.id,
      beforeData: { status: 'POSTED' },
      afterData: { status: 'VOIDED', voidReason: parsed.voidReason },
    },
    { auditRepo: createAuditRepository(tx) }
  );
  return doc;
}

export async function submitVoidReceiptAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = voidReceiptSchema.parse(rawInput);
    assertValidIdempotencyKey(parsed.idempotencyKey);
    const doc = await withUnitOfWork((tx) =>
      executeVoidReceiptTx(tx, session, parsed)
    );
    revalidatePath('/receipts');
    revalidatePath('/stock');
    revalidatePath('/dashboard');
    return { ok: true as const, data: doc };
  } catch (error) {
    return translateDomainError(error);
  }
}
