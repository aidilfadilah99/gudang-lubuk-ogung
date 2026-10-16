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

function StockSearchInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="relative sm:col-span-5">
      <input
        type="text"
        name="search"
        defaultValue={defaultValue ?? ''}
        placeholder="Cari nama, SKU, atau barcode..."
        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
      />
      <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

function StockFilterBar(props: {
  search?: string;
  categoryId?: string;
  onlyLowStock: boolean;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <Card className="p-3.5 bg-white shadow-sm border border-slate-200/80">
      <form method="GET" className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
        <StockSearchInput defaultValue={props.search} />
        <div className="sm:col-span-3">
          <select
            name="categoryId"
            defaultValue={props.categoryId ?? ''}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
          >
            <option value="">Semua Kategori</option>
            {props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <label className="sm:col-span-2 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700 px-1 cursor-pointer">
          <input
            type="checkbox"
            name="onlyLowStock"
            value="true"
            defaultChecked={props.onlyLowStock}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span>Hanya Menipis</span>
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:shadow active:scale-[0.98] transition-all"
        >
          Filter
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
