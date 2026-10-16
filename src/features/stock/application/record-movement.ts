import crypto from 'node:crypto';
import {
  calculateNextBalance,
  RecordMovementInput,
  StockMovementRecord,
  StockRepositoryPort,
} from '../domain/ledger';

export interface RecordMovementDependencies {
  stockRepo: StockRepositoryPort;
  now?: () => Date;
  generateId?: () => string;
}

export async function recordStockMovementUseCase(
  input: RecordMovementInput,
  deps: RecordMovementDependencies
): Promise<StockMovementRecord> {
  const locked = await deps.stockRepo.lockItemAndGetBalance(
    input.warehouseId,
    input.itemId
  );

  const itemName = input.itemName ?? locked.itemName;
  const balanceAfter = calculateNextBalance(
    locked.currentBalance,
    input.quantityChange,
    itemName
  );

  const record: StockMovementRecord = {
    id: deps.generateId ? deps.generateId() : `mov_${crypto.randomUUID()}`,
    warehouseId: input.warehouseId,
    itemId: input.itemId,
    movementType: input.movementType,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    referenceNumber: input.referenceNumber,
    quantityChange: input.quantityChange,
    balanceAfter,
    unitCost: input.unitCost ?? 0,
    notes: input.notes ?? null,
    createdBy: input.actorId,
    createdAt: deps.now ? deps.now() : new Date(),
  };

  await deps.stockRepo.insertMovement(record);
  return record;
}
