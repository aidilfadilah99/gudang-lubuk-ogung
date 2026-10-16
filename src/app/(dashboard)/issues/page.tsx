import React from 'react';
import {
  createIssueRepository,
  IssueForm,
  IssueListView,
  listIssuesUseCase,
} from '@/features/issues';
import { createStockRepository, getStockSummaryUseCase } from '@/features/stock';
import { USER_ROLES } from '@/shared/config/constants';
import { requireStaffOrAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function IssuesPage(): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const [stockSummary, issues] = await Promise.all([
    getStockSummaryUseCase(
      session.warehouseId,
      { onlyLowStock: false, page: 1, pageSize: 100 },
      { stockRepo: createStockRepository() }
    ),
    listIssuesUseCase(
      { warehouseId: session.warehouseId, page: 1, pageSize: 30 },
      { issueRepo: createIssueRepository() }
    ),
  ]);
  const itemOptions = stockSummary.items.map((i) => ({
    id: i.itemId, sku: i.sku, barcode: i.barcode, name: i.name,
    sellingPrice: i.sellingPrice, currentBalance: i.currentBalance, unitCode: i.unitCode,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Barang Keluar (Pengeluaran Gudang)</h2>
        <p className="text-xs text-slate-600">
          Catat pengeluaran untuk Anggota, Umum, atau Internal (Stok dijamin tidak pernah minus)
        </p>
      </div>
      <IssueForm items={itemOptions} />
      <h3 className="font-bold text-slate-900 pt-2">Riwayat Dokumen Barang Keluar ({issues.total})</h3>
      <IssueListView issues={issues.items} isAdmin={session.role === USER_ROLES.ADMIN} />
    </div>
  );
}
