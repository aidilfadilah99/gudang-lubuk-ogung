import React from 'react';
import {
  CatalogView,
  createCatalogRepository,
  listCatalogOverviewUseCase,
} from '@/features/catalog';
import { USER_ROLES } from '@/shared/config/constants';
import { requireStaffOrAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function CatalogPage(): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const overview = await listCatalogOverviewUseCase(
    { warehouseId: session.warehouseId, page: 1, pageSize: 100 },
    { catalogRepo: createCatalogRepository() }
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Master Data Katalog Barang ({overview.total} SKU)
        </h2>
        <p className="text-xs text-slate-600">
          Daftar barang sembako, pupuk, alat pertanian, dan hasil tani KDKMP
          Lubuk Ogung
        </p>
      </div>
      <CatalogView
        items={overview.items}
        categories={overview.categories}
        units={overview.units}
        isAdmin={session.role === USER_ROLES.ADMIN}
      />
    </div>
  );
}
