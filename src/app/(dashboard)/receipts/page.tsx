import React from 'react';
import {
  createReceiptRepository,
  listReceiptsUseCase,
  ReceiptForm,
  ReceiptListView,
} from '@/features/receipts';
import { createStockRepository, getStockSummaryUseCase } from '@/features/stock';
import {
  createSupplierRepository,
  listSuppliersUseCase,
} from '@/features/suppliers';
import { USER_ROLES } from '@/shared/config/constants';
import { requireStaffOrAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function ReceiptsPage(): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const [stockSummary, suppliers, receipts] = await Promise.all([
    getStockSummaryUseCase(
      session.warehouseId,
      { onlyLowStock: false, page: 1, pageSize: 100 },
      { stockRepo: createStockRepository() }
    ),
    listSuppliersUseCase(session.warehouseId, { supplierRepo: createSupplierRepository() }),
    listReceiptsUseCase(
      { warehouseId: session.warehouseId, page: 1, pageSize: 30 },
      { receiptRepo: createReceiptRepository() }
    ),
  ]);
  const itemOpts = stockSummary.items.map((i) => ({
    id: i.itemId, sku: i.sku, barcode: i.barcode, name: i.name,
    purchasePrice: i.purchasePrice, unitCode: i.unitCode,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Barang Masuk (Penerimaan dari Supplier)</h2>
        <p className="text-xs text-slate-600">Catat surat jalan / faktur masuk dan perbarui saldo ledger secara atomik</p>
      </div>
      <ReceiptForm
        items={itemOpts}
        suppliers={suppliers.map((s) => ({ id: s.id, code: s.code, name: s.name }))}
      />
      <h3 className="font-bold text-slate-900 pt-2">Riwayat Dokumen Barang Masuk ({receipts.total})</h3>
      <ReceiptListView receipts={receipts.items} isAdmin={session.role === USER_ROLES.ADMIN} />
    </div>
  );
}
