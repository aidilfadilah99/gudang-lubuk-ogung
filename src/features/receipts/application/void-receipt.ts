import {
  recordStockMovementUseCase,
  StockRepositoryPort,
  validateVoidEligibility,
} from '@/features/stock';
import { USER_ROLES, UserRole } from '@/shared/config/constants';
import {
  DataTidakDitemukanError,
  TidakBerhakError,
} from '@/shared/lib/errors';
import {
  ReceiptRepositoryPort,
  StockReceiptDocument,
} from '../domain/receipt';

export interface VoidReceiptUseCaseInput {
  warehouseId: string;
  receiptId: string;
  voidReason: string;
  actorId: string;
  actorRole: UserRole;
}

async function reverseReceiptLines(
  doc: StockReceiptDocument,
  cleanReason: string,
  actorId: string,
  stockRepo: StockRepositoryPort,
  now: Date
): Promise<void> {
  for (const line of doc.lines) {
    await recordStockMovementUseCase(
      {
        warehouseId: doc.warehouseId,
        itemId: line.itemId,
        movementType: 'REVERSAL_RECEIPT',
        referenceType: 'RECEIPT',
        referenceId: doc.id,
        referenceNumber: `${doc.receiptNumber}-VOID`,
        quantityChange: -line.quantity,
        unitCost: line.unitPurchasePrice,
        notes: `VOID: ${cleanReason}`,
        actorId,
      },
      { stockRepo, now: () => now }
    );
  }
}

export async function voidReceiptUseCase(
  input: VoidReceiptUseCaseInput,
  deps: { receiptRepo: ReceiptRepositoryPort; stockRepo: StockRepositoryPort; now?: () => Date }
): Promise<StockReceiptDocument> {
  if (input.actorRole !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError('Hanya Admin yang diizinkan melakukan Void transaksi Barang Masuk.');
  }
  const existing = await deps.receiptRepo.findById(input.warehouseId, input.receiptId);
  if (!existing) throw new DataTidakDitemukanError('Dokumen Barang Masuk');

  const cleanReason = validateVoidEligibility(existing.status, input.voidReason);
  const now = deps.now ? deps.now() : new Date();

  await deps.receiptRepo.markVoided({
    warehouseId: input.warehouseId, receiptId: existing.id,
    voidReason: cleanReason, voidedBy: input.actorId, voidedAt: now,
  });
  await reverseReceiptLines(existing, cleanReason, input.actorId, deps.stockRepo, now);

  return {
    ...existing, status: 'VOIDED', voidReason: cleanReason,
    voidedBy: input.actorId, voidedAt: now,
  };
}
