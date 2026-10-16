import React from 'react';
import {
  createDashboardRepository,
  DashboardView,
  getDashboardStatsUseCase,
} from '@/features/dashboard';
import { requireStaffOrAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const snapshot = await getDashboardStatsUseCase(session.warehouseId, {
    dashboardRepo: createDashboardRepository(),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Dashboard Operasional Gudang
        </h2>
        <p className="text-xs text-slate-600">
          Ringkasan real-time stok dan aktivitas mutasi gudang utama
        </p>
      </div>
      <DashboardView snapshot={snapshot} />
    </div>
  );
}
