import React from 'react';
import {
  createCatalogRepository,
  listCatalogOverviewUseCase,
} from '@/features/catalog';
import { ReportsView } from '@/features/reports';
import { requireAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function ReportsPage(): Promise<React.ReactElement> {
  const session = await requireAdmin();
  const catalog = await listCatalogOverviewUseCase(
    { warehouseId: session.warehouseId, page: 1, pageSize: 100 },
    { catalogRepo: createCatalogRepository() }
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Laporan Resmi PDF & Excel (Khusus Admin)
        </h2>
        <p className="text-xs text-slate-600">
          Cetak laporan stok, barang masuk, barang keluar, kartu stok, dan stok
          menipis
        </p>
      </div>
      <ReportsView
        items={catalog.items.map((i) => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
        }))}
      />
    </div>
  );
}
