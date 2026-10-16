import { UserRole } from '@/shared/config/constants';
import {
  formatDateTimeWib,
  formatQuantity,
  formatRupiah,
} from '@/shared/lib/format';
import {
  assertCanGenerateReport,
  buildReportMeta,
  mapStockRowsToStrings,
  ReportDataPort,
  ReportKind,
  ReportTablePayload,
} from '../domain/report';

export interface BuildReportUseCaseInput {
  warehouseId: string;
  actorRole: UserRole;
  actorFullName: string;
  kind: ReportKind;
  fromDate?: Date;
  toDate?: Date;
  itemId?: string;
}

async function buildReceiptsTable(
  repo: ReportDataPort,
  warehouseId: string,
  from: Date,
  to: Date
) {
  const rows = await repo.fetchReceiptsByPeriod(warehouseId, from, to);
  return {
    headers: ['No', 'No. Dokumen', 'Tanggal', 'Supplier', 'Faktur', 'Barang', 'Qty', 'Subtotal', 'Status'],
    rows: rows.map((r, i) => [
      String(i + 1),
      r.receiptNumber,
      formatDateTimeWib(r.receiptDate),
      r.supplierName,
      r.invoiceNumber,
      `${r.sku} - ${r.itemName}`,
      formatQuantity(r.quantity),
      formatRupiah(r.subtotal),
      r.status,
    ]),
  };
}

async function buildIssuesTable(
  repo: ReportDataPort,
  warehouseId: string,
  from: Date,
  to: Date
) {
  const rows = await repo.fetchIssuesByPeriod(warehouseId, from, to);
  return {
    headers: ['No', 'No. Dokumen', 'Tanggal', 'Tujuan', 'Penerima', 'Barang', 'Qty', 'Subtotal', 'Status'],
    rows: rows.map((r, i) => [
      String(i + 1),
      r.issueNumber,
      formatDateTimeWib(r.issueDate),
      r.destinationType,
      r.recipientName,
      `${r.sku} - ${r.itemName}`,
      formatQuantity(r.quantity),
      formatRupiah(r.subtotal),
      r.status,
    ]),
  };
}

async function buildStockCardTable(
  repo: ReportDataPort,
  warehouseId: string,
  itemId: string
) {
  const rows = await repo.fetchStockCard(warehouseId, itemId);
  return {
    headers: ['No', 'Waktu WIB', 'Tipe Mutasi', 'No. Referensi', 'Mutasi', 'Saldo', 'Catatan'],
    rows: rows.map((r, i) => [
      String(i + 1),
      formatDateTimeWib(r.createdAt),
      r.movementType,
      r.referenceNumber,
      (r.quantityChange > 0 ? '+' : '') + formatQuantity(r.quantityChange),
      formatQuantity(r.balanceAfter),
      r.notes ?? '-',
    ]),
  };
}

async function buildStockSnapshotTable(
  repo: ReportDataPort,
  input: BuildReportUseCaseInput,
  to: Date,
  now: Date
): Promise<ReportTablePayload> {
  const allStock = await repo.fetchStockAsOf(input.warehouseId, to);
  const filtered =
    input.kind === 'LOW_STOCK'
      ? allStock.filter((x) => x.balance <= x.minStock)
      : allStock;
  const title =
    input.kind === 'LOW_STOCK'
      ? 'Laporan Barang Stok Menipis / Habis'
      : 'Laporan Saldo Stok Barang Per Tanggal';
  return {
    ...buildReportMeta({ title, toDate: to, preparedBy: input.actorFullName, now }),
    headers: ['No', 'SKU', 'Nama Barang', 'Kategori', 'Saldo', 'Min Stok', 'Harga Jual'],
    rows: mapStockRowsToStrings(filtered),
  };
}

export async function buildReportTableUseCase(
  input: BuildReportUseCaseInput,
  deps: { reportRepo: ReportDataPort; now?: () => Date }
): Promise<ReportTablePayload> {
  assertCanGenerateReport(input.actorRole);
  const now = deps.now ? deps.now() : new Date();
  const from = input.fromDate ?? new Date(now.getTime() - 30 * 86400000);
  const to = input.toDate ?? now;

  if (input.kind === 'RECEIPTS_PERIOD') {
    const tbl = await buildReceiptsTable(deps.reportRepo, input.warehouseId, from, to);
    return {
      ...buildReportMeta({ title: 'Laporan Barang Masuk Per Periode', fromDate: from, toDate: to, preparedBy: input.actorFullName, now }),
      ...tbl,
    };
  }
  if (input.kind === 'ISSUES_PERIOD') {
    const tbl = await buildIssuesTable(deps.reportRepo, input.warehouseId, from, to);
    return {
      ...buildReportMeta({ title: 'Laporan Barang Keluar Per Periode', fromDate: from, toDate: to, preparedBy: input.actorFullName, now }),
      ...tbl,
    };
  }
  if (input.kind === 'STOCK_CARD') {
    const tbl = await buildStockCardTable(deps.reportRepo, input.warehouseId, input.itemId ?? '');
    return {
      ...buildReportMeta({ title: 'Laporan Kartu Stok Barang', preparedBy: input.actorFullName, now }),
      ...tbl,
    };
  }
  return buildStockSnapshotTable(deps.reportRepo, input, to, now);
}
