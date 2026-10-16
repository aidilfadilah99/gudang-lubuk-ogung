import { APP_CONSTANTS, USER_ROLES, UserRole } from '@/shared/config/constants';
import {
  formatDateTimeWib,
  formatDateWib,
  formatQuantity,
  formatRupiah,
} from '@/shared/lib/format';
import { TidakBerhakError } from '@/shared/lib/errors';

export type ReportKind =
  | 'STOCK_AS_OF'
  | 'RECEIPTS_PERIOD'
  | 'ISSUES_PERIOD'
  | 'STOCK_CARD'
  | 'LOW_STOCK';

export interface ReportTablePayload {
  title: string;
  cooperativeName: string;
  periodLabel: string;
  printedAtWib: string;
  preparedBy: string;
  chairmanTitle: string;
  headers: string[];
  rows: string[][];
}

export interface ReportDataPort {
  fetchStockAsOf(
    warehouseId: string,
    asOfDate: Date
  ): Promise<
    Array<{
      sku: string;
      name: string;
      categoryName: string;
      unitCode: string;
      balance: number;
      minStock: number;
      sellingPrice: number;
    }>
  >;
  fetchReceiptsByPeriod(
    warehouseId: string,
    from: Date,
    to: Date
  ): Promise<
    Array<{
      receiptNumber: string;
      receiptDate: Date;
      supplierName: string;
      invoiceNumber: string;
      sku: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      status: string;
    }>
  >;
  fetchIssuesByPeriod(
    warehouseId: string,
    from: Date,
    to: Date
  ): Promise<
    Array<{
      issueNumber: string;
      issueDate: Date;
      destinationType: string;
      recipientName: string;
      sku: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      status: string;
    }>
  >;
  fetchStockCard(
    warehouseId: string,
    itemId: string
  ): Promise<
    Array<{
      createdAt: Date;
      movementType: string;
      referenceNumber: string;
      quantityChange: number;
      balanceAfter: number;
      notes: string | null;
    }>
  >;
}

export function assertCanGenerateReport(role: UserRole): void {
  if (role !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError('Hanya Admin yang dapat mengunduh Laporan Resmi.');
  }
}

export function buildReportMeta(params: {
  title: string;
  fromDate?: Date;
  toDate?: Date;
  preparedBy: string;
  now: Date;
}): Omit<ReportTablePayload, 'headers' | 'rows'> {
  const periodLabel =
    params.fromDate && params.toDate
      ? `${formatDateWib(params.fromDate)} s/d ${formatDateWib(params.toDate)}`
      : `Per Tanggal ${formatDateWib(params.toDate ?? params.now)}`;

  return {
    title: params.title,
    cooperativeName: APP_CONSTANTS.COOPERATIVE_NAME,
    periodLabel,
    printedAtWib: formatDateTimeWib(params.now),
    preparedBy: params.preparedBy,
    chairmanTitle: 'Ketua KDKMP Lubuk Ogung',
  };
}

export function mapStockRowsToStrings(
  rows: Array<{
    sku: string;
    name: string;
    categoryName: string;
    unitCode: string;
    balance: number;
    minStock: number;
    sellingPrice: number;
  }>
): string[][] {
  return rows.map((r, idx) => [
    String(idx + 1),
    r.sku,
    r.name,
    r.categoryName,
    `${formatQuantity(r.balance)} ${r.unitCode}`,
    `${formatQuantity(r.minStock)} ${r.unitCode}`,
    formatRupiah(r.sellingPrice),
  ]);
}
