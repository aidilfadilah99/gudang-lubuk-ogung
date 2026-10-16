import { DataTidakValidError } from '@/shared/lib/errors';

export type IssueDestinationType = 'ANGGOTA' | 'UMUM' | 'INTERNAL';

export interface IssueItemLine {
  id: string;
  itemId: string;
  itemName?: string;
  sku?: string;
  quantity: number;
  unitSellingPrice: number;
  subtotal: number;
}

export interface StockIssueDocument {
  id: string;
  warehouseId: string;
  issueNumber: string;
  destinationType: IssueDestinationType;
  recipientName: string;
  issueDate: Date;
  status: 'POSTED' | 'VOIDED';
  notes: string | null;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  lines: IssueItemLine[];
}

export interface IssueRepositoryPort {
  saveIssue(doc: StockIssueDocument): Promise<void>;
  findById(
    warehouseId: string,
    issueId: string
  ): Promise<StockIssueDocument | null>;
  markVoided(params: {
    warehouseId: string;
    issueId: string;
    voidReason: string;
    voidedBy: string;
    voidedAt: Date;
  }): Promise<void>;
  listIssues(params: {
    warehouseId: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
    offset: number;
  }): Promise<{ items: StockIssueDocument[]; total: number }>;
}

export function calculateIssueLineSubtotal(
  quantity: number,
  unitSellingPrice: number
): number {
  if (quantity <= 0) {
    throw new DataTidakValidError(
      'Jumlah barang keluar harus lebih besar dari 0.'
    );
  }
  if (unitSellingPrice < 0) {
    throw new DataTidakValidError('Harga keluar tidak boleh negatif.');
  }
  return Math.round(quantity * unitSellingPrice * 100) / 100;
}

export function generateIssueNumber(now: Date, suffix: string): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `BK-${y}${m}-${suffix.toUpperCase()}`;
}
