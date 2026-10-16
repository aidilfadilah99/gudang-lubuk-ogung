import { getLocalStore } from '@/shared/db/local-store';
import {
  buildLastNDaysBuckets,
  DashboardRepositoryPort,
  DashboardSnapshot,
} from '../domain/dashboard';

function computeLocalCountsAndRecent(warehouseId: string) {
  const s = getLocalStore();
  const activeItems = s.items.filter(
    (i) => i.warehouseId === warehouseId && i.isActive
  );
  let lowStockCount = 0;
  for (const item of activeItems) {
    const bal = s.movements
      .filter((m) => m.warehouseId === warehouseId && m.itemId === item.id)
      .reduce((acc, m) => acc + m.quantityChange, 0);
    if (bal <= item.minStock) lowStockCount += 1;
  }

  const whMovs = s.movements
    .filter((m) => m.warehouseId === warehouseId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const recentMovements = whMovs.slice(0, 10).map((m) => {
    const item = s.items.find((i) => i.id === m.itemId);
    return {
      id: m.id,
      itemName: item?.name ?? '-',
      sku: item?.sku ?? '-',
      movementType: m.movementType,
      referenceNumber: m.referenceNumber,
      quantityChange: m.quantityChange,
      balanceAfter: m.balanceAfter,
      createdAt: m.createdAt,
    };
  });

  return { totalSku: activeItems.length, lowStockCount, whMovs, recentMovements };
}

export function createLocalDashboardRepository(): DashboardRepositoryPort {
  return {
    async fetchSnapshot(
      warehouseId: string,
      now: Date
    ): Promise<DashboardSnapshot> {
      const { totalSku, lowStockCount, whMovs, recentMovements } =
        computeLocalCountsAndRecent(warehouseId);
      const todayKey = now.toISOString().slice(0, 10);
      let todayTransactionsCount = 0;
      const agg = new Map<string, { totalIn: number; totalOut: number }>();
      for (const m of whMovs) {
        const dayKey = m.createdAt.toISOString().slice(0, 10);
        if (dayKey === todayKey) todayTransactionsCount += 1;
        const cur = agg.get(dayKey) ?? { totalIn: 0, totalOut: 0 };
        if (m.quantityChange > 0) cur.totalIn += m.quantityChange;
        else cur.totalOut += Math.abs(m.quantityChange);
        agg.set(dayKey, cur);
      }
      const points = Array.from(agg.entries()).map(([dayKey, v]) => ({
        dayKey,
        ...v,
      }));
      return {
        totalSku,
        lowStockCount,
        todayTransactionsCount,
        recentMovements,
        chart30Days: buildLastNDaysBuckets(now, 30, points),
      };
    },
  };
}
