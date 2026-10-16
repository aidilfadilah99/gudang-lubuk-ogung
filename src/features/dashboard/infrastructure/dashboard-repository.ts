import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import {
  buildLastNDaysBuckets,
  DashboardRepositoryPort,
  DashboardSnapshot,
  RecentActivityItem,
} from '../domain/dashboard';
import { items, stockMovements } from './schema';

async function fetchSkuAndLowStockCounts(
  executor: DbExecutor,
  warehouseId: string
): Promise<{ totalSku: number; lowStockCount: number }> {
  const rows = await executor
    .select({
      id: items.id,
      minStock: items.minStock,
      balance: sql<string>`COALESCE(SUM(${stockMovements.quantityChange}), 0)`,
    })
    .from(items)
    .leftJoin(stockMovements, eq(items.id, stockMovements.itemId))
    .where(and(eq(items.warehouseId, warehouseId), eq(items.isActive, true)))
    .groupBy(items.id);

  let lowStockCount = 0;
  for (const r of rows) {
    if (Number(r.balance) <= Number(r.minStock)) lowStockCount += 1;
  }
  return { totalSku: rows.length, lowStockCount };
}

async function fetchRecentMovements(
  executor: DbExecutor,
  warehouseId: string
): Promise<RecentActivityItem[]> {
  const rows = await executor
    .select({
      id: stockMovements.id,
      itemName: items.name,
      sku: items.sku,
      movementType: stockMovements.movementType,
      referenceNumber: stockMovements.referenceNumber,
      quantityChange: stockMovements.quantityChange,
      balanceAfter: stockMovements.balanceAfter,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(items, eq(stockMovements.itemId, items.id))
    .where(eq(stockMovements.warehouseId, warehouseId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(10);

  return rows.map((r) => ({
    ...r,
    quantityChange: Number(r.quantityChange),
    balanceAfter: Number(r.balanceAfter),
  }));
}

async function fetch30DaysFlow(
  executor: DbExecutor,
  warehouseId: string,
  now: Date
): Promise<{
  todayCount: number;
  points: Array<{ dayKey: string; totalIn: number; totalOut: number }>;
}> {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const rows = await executor
    .select({
      quantityChange: stockMovements.quantityChange,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.warehouseId, warehouseId),
        gte(stockMovements.createdAt, since)
      )
    );

  const todayKey = now.toISOString().slice(0, 10);
  let todayCount = 0;
  const agg = new Map<string, { totalIn: number; totalOut: number }>();

  for (const r of rows) {
    const dayKey = r.createdAt.toISOString().slice(0, 10);
    if (dayKey === todayKey) todayCount += 1;
    const cur = agg.get(dayKey) ?? { totalIn: 0, totalOut: 0 };
    const qty = Number(r.quantityChange);
    if (qty > 0) cur.totalIn += qty;
    else cur.totalOut += Math.abs(qty);
    agg.set(dayKey, cur);
  }

  return {
    todayCount,
    points: Array.from(agg.entries()).map(([dayKey, v]) => ({ dayKey, ...v })),
  };
}

export function createDashboardRepository(
  executor: DbExecutor = getDb()
): DashboardRepositoryPort {
  return {
    async fetchSnapshot(
      warehouseId: string,
      now: Date
    ): Promise<DashboardSnapshot> {
      const [counts, recentMovements, flow] = await Promise.all([
        fetchSkuAndLowStockCounts(executor, warehouseId),
        fetchRecentMovements(executor, warehouseId),
        fetch30DaysFlow(executor, warehouseId, now),
      ]);

      return {
        totalSku: counts.totalSku,
        lowStockCount: counts.lowStockCount,
        todayTransactionsCount: flow.todayCount,
        recentMovements,
        chart30Days: buildLastNDaysBuckets(now, 30, flow.points),
      };
    },
  };
}
