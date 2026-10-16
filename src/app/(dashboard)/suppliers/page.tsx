import React from 'react';
import {
  createSupplierRepository,
  listSuppliersUseCase,
  SuppliersView,
} from '@/features/suppliers';
import { USER_ROLES } from '@/shared/config/constants';
import { requireStaffOrAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage(): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const suppliers = await listSuppliersUseCase(session.warehouseId, {
    supplierRepo: createSupplierRepository(),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Master Data Supplier ({suppliers.length})
        </h2>
        <p className="text-xs text-slate-600">
          Daftar pemasok resmi dan gabungan kelompok tani KDKMP Lubuk Ogung
        </p>
      </div>
      <SuppliersView
        suppliers={suppliers}
        isAdmin={session.role === USER_ROLES.ADMIN}
      />
    </div>
  );
}
