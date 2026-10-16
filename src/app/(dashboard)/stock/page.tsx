import React from 'react';
import { createCatalogRepository } from '@/features/catalog';
import {
  createStockRepository,
  getStockSummaryUseCase,
  StockAdjustmentForm,
  stockFilterSchema,
  StockListView,
} from '@/features/stock';
import { USER_ROLES } from '@/shared/config/constants';
import { requireStaffOrAdmin } from '@/shared/security/guard';
import { Card } from '@/shared/ui/card';

export const dynamic = 'force-dynamic';

function StockFilterBar(props: {
  search?: string;
  categoryId?: string;
  onlyLowStock: boolean;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <Card>
      <form method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input
          type="text" name="search" defaultValue={props.search ?? ''}
          placeholder="Cari nama, SKU, atau barcode..."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          name="categoryId" defaultValue={props.categoryId ?? ''}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Semua Kategori</option>
          {props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 px-2">
          <input type="checkbox" name="onlyLowStock" value="true" defaultChecked={props.onlyLowStock} />
          Hanya Stok Menipis / Habis
        </label>
        <button type="submit" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">
          Terapkan Filter
        </button>
      </form>
    </Card>
  );
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const raw = await searchParams;
  const filter = stockFilterSchema.parse({
    search: typeof raw.search === 'string' ? raw.search : undefined,
    categoryId: typeof raw.categoryId === 'string' ? raw.categoryId : undefined,
    onlyLowStock: raw.onlyLowStock === 'true',
    page: raw.page ?? 1,
    pageSize: 50,
  });
  const [{ items }, categories] = await Promise.all([
    getStockSummaryUseCase(session.warehouseId, filter, { stockRepo: createStockRepository() }),
    createCatalogRepository().listCategories(session.warehouseId),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Saldo Stok Saat Ini & Penanda Stok Menipis</h2>
        <p className="text-xs text-slate-600">Saldo dihitung langsung dari akumulasi ledger mutasi</p>
      </div>
      <StockFilterBar search={filter.search} categoryId={filter.categoryId} onlyLowStock={filter.onlyLowStock} categories={categories} />
      {session.role === USER_ROLES.ADMIN && items.length > 0 && (
        <StockAdjustmentForm
          items={items.map((i) => ({ id: i.itemId, sku: i.sku, name: i.name, currentBalance: i.currentBalance, unitCode: i.unitCode }))}
        />
      )}
      <StockListView items={items} />
    </div>
  );
}
