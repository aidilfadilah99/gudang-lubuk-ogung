import crypto from 'node:crypto';
import {
  recordStockMovementUseCase,
  StockRepositoryPort,
} from '@/features/stock';
import {
  calculateReceiptLineSubtotal,
  generateReceiptNumber,
  ReceiptItemLine,
  ReceiptRepositoryPort,
  StockReceiptDocument,
} from '../domain/receipt';

export interface CreateReceiptUseCaseInput {
  warehouseId: string;
  actorId: string;
  supplierId: string;
  invoiceNumber: string;
  notes?: string;
  lines: Array<{
    itemId: string;
    quantity: number;
    unitPurchasePrice: number;
  }>;
}

export interface CreateReceiptDeps {
  receiptRepo: ReceiptRepositoryPort;
  stockRepo: StockRepositoryPort;
  now?: () => Date;
}

function buildReceiptDocument(
  input: CreateReceiptUseCaseInput,
  now: Date
): StockReceiptDocument {
  const receiptId = `rcp_${crypto.randomUUID()}`;
  const receiptNumber = generateReceiptNumber(now, receiptId.slice(-6));
  const builtLines: ReceiptItemLine[] = input.lines.map((l) => ({
    id: `rcpi_${crypto.randomUUID()}`,
    itemId: l.itemId,
    quantity: l.quantity,
    unitPurchasePrice: l.unitPurchasePrice,
    subtotal: calculateReceiptLineSubtotal(l.quantity, l.unitPurchasePrice),
  }));

  return {
    id: receiptId,
    warehouseId: input.warehouseId,
    receiptNumber,
    supplierId: input.supplierId,
    invoiceNumber: input.invoiceNumber.trim(),
    receiptDate: now,
    status: 'POSTED',
    notes: input.notes?.trim() || null,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    createdBy: input.actorId,
    createdAt: now,
    lines: builtLines,
  };
}

export async function createReceiptUseCase(
  input: CreateReceiptUseCaseInput,
  deps: CreateReceiptDeps
): Promise<StockReceiptDocument> {
  const now = deps.now ? deps.now() : new Date();
  const doc = buildReceiptDocument(input, now);
  await deps.receiptRepo.saveReceipt(doc);

  for (const line of doc.lines) {
    await recordStockMovementUseCase(
      {
        warehouseId: input.warehouseId,
        itemId: line.itemId,
        movementType: 'RECEIPT_IN',
        referenceType: 'RECEIPT',
        referenceId: doc.id,
        referenceNumber: doc.receiptNumber,
        quantityChange: line.quantity,
        unitCost: line.unitPurchasePrice,
        notes: `Penerimaan Faktur ${doc.invoiceNumber}`,
        actorId: input.actorId,
      },
      { stockRepo: deps.stockRepo, now: () => now }
    );
  }
  return doc;
}
