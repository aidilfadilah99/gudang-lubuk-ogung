import { DataTidakValidError } from '@/shared/lib/errors';

export interface ReceiptItemLine {
  id: string;
  itemId: string;
  itemName?: string;
  sku?: string;
  quantity: number;
  unitPurchasePrice: number;
  subtotal: number;
}

export interface StockReceiptDocument {
  id: string;
  warehouseId: string;
  receiptNumber: string;
  supplierId: string;
  supplierName?: string;
  invoiceNumber: string;
  receiptDate: Date;
  status: 'POSTED' | 'VOIDED';
  notes: string | null;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  lines: ReceiptItemLine[];
}

export interface ReceiptRepositoryPort {
  saveReceipt(doc: StockReceiptDocument): Promise<void>;
  findById(
    warehouseId: string,
    receiptId: string
  ): Promise<StockReceiptDocument | null>;
  markVoided(params: {
    warehouseId: string;
    receiptId: string;
    voidReason: string;
    voidedBy: string;
    voidedAt: Date;
  }): Promise<void>;
  listReceipts(params: {
    warehouseId: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
    offset: number;
  }): Promise<{ items: StockReceiptDocument[]; total: number }>;
}

export function calculateReceiptLineSubtotal(
  quantity: number,
  unitPurchasePrice: number
): number {
  if (quantity <= 0) {
    throw new DataTidakValidError(
      'Jumlah barang masuk harus lebih besar dari 0.'
    );
  }
  if (unitPurchasePrice < 0) {
    throw new DataTidakValidError('Harga beli tidak boleh negatif.');
  }
  return Math.round(quantity * unitPurchasePrice * 100) / 100;
}

export function generateReceiptNumber(now: Date, suffix: string): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `BM-${y}${m}-${suffix.toUpperCase()}`;
}
