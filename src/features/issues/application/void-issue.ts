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
import { IssueRepositoryPort, StockIssueDocument } from '../domain/issue';

export interface VoidIssueUseCaseInput {
  warehouseId: string;
  issueId: string;
  voidReason: string;
  actorId: string;
  actorRole: UserRole;
}

async function reverseIssueLines(
  doc: StockIssueDocument,
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
        movementType: 'REVERSAL_ISSUE',
        referenceType: 'ISSUE',
        referenceId: doc.id,
        referenceNumber: `${doc.issueNumber}-VOID`,
        quantityChange: line.quantity,
        unitCost: line.unitSellingPrice,
        notes: `VOID: ${cleanReason}`,
        actorId,
      },
      { stockRepo, now: () => now }
    );
  }
}

export async function voidIssueUseCase(
  input: VoidIssueUseCaseInput,
  deps: { issueRepo: IssueRepositoryPort; stockRepo: StockRepositoryPort; now?: () => Date }
): Promise<StockIssueDocument> {
  if (input.actorRole !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError('Hanya Admin yang diizinkan melakukan Void transaksi Barang Keluar.');
  }
  const existing = await deps.issueRepo.findById(input.warehouseId, input.issueId);
  if (!existing) throw new DataTidakDitemukanError('Dokumen Barang Keluar');

  const cleanReason = validateVoidEligibility(existing.status, input.voidReason);
  const now = deps.now ? deps.now() : new Date();

  await deps.issueRepo.markVoided({
    warehouseId: input.warehouseId, issueId: existing.id,
    voidReason: cleanReason, voidedBy: input.actorId, voidedAt: now,
  });
  await reverseIssueLines(existing, cleanReason, input.actorId, deps.stockRepo, now);

  return {
    ...existing, status: 'VOIDED', voidReason: cleanReason,
    voidedBy: input.actorId, voidedAt: now,
  };
}
