export interface DailyFlowPoint {
  dateLabel: string;
  totalIn: number;
  totalOut: number;
}

export interface RecentActivityItem {
  id: string;
  itemName: string;
  sku: string;
  movementType: string;
  referenceNumber: string;
  quantityChange: number;
  balanceAfter: number;
  createdAt: Date;
}

export interface DashboardSnapshot {
  totalSku: number;
  lowStockCount: number;
  todayTransactionsCount: number;
  recentMovements: RecentActivityItem[];
  chart30Days: DailyFlowPoint[];
}

export interface DashboardRepositoryPort {
  fetchSnapshot(warehouseId: string, now: Date): Promise<DashboardSnapshot>;
}

export function buildLastNDaysBuckets(
  now: Date,
  daysCount: number,
  rawPoints: Array<{ dayKey: string; totalIn: number; totalOut: number }>
): DailyFlowPoint[] {
  const map = new Map(rawPoints.map((p) => [p.dayKey, p]));
  const result: DailyFlowPoint[] = [];
  for (let i = daysCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    const entry = map.get(key);
    result.push({
      dateLabel: `${dd}/${mm}`,
      totalIn: entry?.totalIn ?? 0,
      totalOut: entry?.totalOut ?? 0,
    });
  }
  return result;
}
