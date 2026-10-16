import {
  DataTidakValidError,
  StokTidakCukupError,
} from '@/shared/lib/errors';

export type MovementType =
  | 'RECEIPT_IN'
  | 'ISSUE_OUT'
  | 'REVERSAL_RECEIPT'
  | 'REVERSAL_ISSUE'
  | 'ADJUSTMENT';

export type ReferenceType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT';

export type StockAlertStatus = 'HABIS' | 'MENIPIS' | 'AMAN';

export interface StockMovementRecord {
  id: string;
  warehouseId: string;
  itemId: string;
  movementType: MovementType;
  referenceType: ReferenceType;
  referenceId: string;
  referenceNumber: string;
  quantityChange: number;
  balanceAfter: number;
  unitCost: number;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface StockSummaryItem {
  itemId: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryId: string;
  categoryName: string;
  unitCode: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  currentBalance: number;
  alertStatus: StockAlertStatus;
}

export interface RecordMovementInput {
  warehouseId: string;
  itemId: string;
  itemName?: string;
  movementType: MovementType;
  referenceType: ReferenceType;
  referenceId: string;
  referenceNumber: string;
  quantityChange: number;
  unitCost?: number;
  notes?: string | null;
  actorId: string;
}

export interface StockRepositoryPort {
  lockItemAndGetBalance(
    warehouseId: string,
    itemId: string
  ): Promise<{ itemName: string; currentBalance: number }>;
  insertMovement(movement: StockMovementRecord): Promise<void>;
  insertAdjustment(params: {
    id: string;
    warehouseId: string;
    adjustmentNumber: string;
    itemId: string;
    quantityDelta: number;
    reasonCategory: string;
    reasonDetail: string;
    createdBy: string;
    createdAt: Date;
  }): Promise<void>;
  listCurrentStock(params: {
    warehouseId: string;
    search?: string;
    categoryId?: string;
    onlyLowStock?: boolean;
    limit: number;
    offset: number;
  }): Promise<{ items: StockSummaryItem[]; total: number }>;
  getItemMovements(params: {
    warehouseId: string;
    itemId: string;
    limit: number;
    offset: number;
  }): Promise<{ movements: StockMovementRecord[]; total: number }>;
}

export function roundQuantity(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function calculateNextBalance(
  currentBalance: number,
  quantityChange: number,
  itemName: string
): number {
  if (Number.isNaN(quantityChange) || quantityChange === 0) {
    throw new DataTidakValidError(
      `Perubahan kuantitas untuk "${itemName}" tidak boleh nol.`
    );
  }
  const nextBalance = roundQuantity(currentBalance + quantityChange);
  if (nextBalance < 0) {
    throw new StokTidakCukupError(
      itemName,
      currentBalance,
      Math.abs(quantityChange)
    );
  }
  return nextBalance;
}

export function convertToBaseQuantity(
  quantity: number,
  conversionFactor = 1
): number {
  if (quantity <= 0 || conversionFactor <= 0) {
    throw new DataTidakValidError(
      'Kuantitas dan faktor konversi satuan harus lebih besar dari 0.'
    );
  }
  return roundQuantity(quantity * conversionFactor);
}

export function validateVoidEligibility(
  status: string,
  voidReason: string
): string {
  if (status === 'VOIDED') {
    throw new DataTidakValidError(
      'Transaksi ini sudah pernah di-void sebelumnya.'
    );
  }
  const trimmed = voidReason.trim();
  if (trimmed.length < 5) {
    throw new DataTidakValidError(
      'Alasan void wajib diisi minimal 5 karakter yang jelas.'
    );
  }
  return trimmed;
}

export function evaluateStockAlertStatus(
  currentBalance: number,
  minStock: number
): StockAlertStatus {
  if (currentBalance <= 0) return 'HABIS';
  if (currentBalance <= minStock) return 'MENIPIS';
  return 'AMAN';
}
