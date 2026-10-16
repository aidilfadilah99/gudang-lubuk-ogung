import crypto from 'node:crypto';
import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { DataTidakValidError, TidakBerhakError } from '@/shared/lib/errors';
import { StockMovementRecord, StockRepositoryPort } from '../domain/ledger';
import { recordStockMovementUseCase } from './record-movement';

export interface CreateAdjustmentUseCaseInput {
  warehouseId: string;
  actorId: string;
  actorUsername: string;
  actorRole: UserRole;
  itemId: string;
  quantityDelta: number;
  reasonCategory: string;
  reasonDetail: string;
}

export interface CreateAdjustmentDeps {
  stockRepo: StockRepositoryPort;
  onAudit?: (payload: {
    entityId: string;
    afterData: unknown;
  }) => Promise<void>;
  now?: () => Date;
  generateId?: () => string;
}

function validateAdjustmentAccessAndInput(
  input: CreateAdjustmentUseCaseInput
): string {
  if (input.actorRole !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError(
      'Hanya Admin yang berhak melakukan penyesuaian stok manual.'
    );
  }
  const detail = input.reasonDetail.trim();
  if (detail.length < 5) {
    throw new DataTidakValidError(
      'Alasan penyesuaian wajib diisi minimal 5 karakter.'
    );
  }
  return detail;
}

export async function createStockAdjustmentUseCase(
  input: CreateAdjustmentUseCaseInput,
  deps: CreateAdjustmentDeps
): Promise<{ adjustmentNumber: string; movement: StockMovementRecord }> {
  const detail = validateAdjustmentAccessAndInput(input);
  const now = deps.now ? deps.now() : new Date();
  const id = deps.generateId ? deps.generateId() : `adj_${crypto.randomUUID()}`;
  const adjustmentNumber = `ADJ-${now.getTime().toString().slice(-8)}`;

  await deps.stockRepo.insertAdjustment({
    id, warehouseId: input.warehouseId, adjustmentNumber, itemId: input.itemId,
    quantityDelta: input.quantityDelta, reasonCategory: input.reasonCategory,
    reasonDetail: detail, createdBy: input.actorId, createdAt: now,
  });

  const movement = await recordStockMovementUseCase(
    {
      warehouseId: input.warehouseId, itemId: input.itemId,
      movementType: 'ADJUSTMENT', referenceType: 'ADJUSTMENT',
      referenceId: id, referenceNumber: adjustmentNumber,
      quantityChange: input.quantityDelta,
      notes: `[${input.reasonCategory}] ${detail}`, actorId: input.actorId,
    },
    { stockRepo: deps.stockRepo, now: () => now }
  );

  if (deps.onAudit) {
    await deps.onAudit({
      entityId: id,
      afterData: { adjustmentNumber, itemId: input.itemId, balanceAfter: movement.balanceAfter },
    });
  }
  return { adjustmentNumber, movement };
}
