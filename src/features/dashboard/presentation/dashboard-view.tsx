import React from 'react';
import Link from 'next/link';
import { formatDateTimeWib, formatQuantity } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import {
  DailyFlowPoint,
  DashboardSnapshot,
  RecentActivityItem,
} from '../domain/dashboard';

function KpiRow({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="bg-emerald-50/70 border-emerald-200">
        <p className="text-xs font-semibold text-emerald-800">Total SKU Aktif</p>
        <p className="text-2xl font-extrabold text-emerald-950 mt-1">
          {snapshot.totalSku} Barang
        </p>
      </Card>
      <Card className="bg-amber-50/70 border-amber-200">
        <p className="text-xs font-semibold text-amber-800">Barang Menipis / Habis</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-2xl font-extrabold text-amber-950">
            {snapshot.lowStockCount} SKU
          </p>
          <Link href="/stock?onlyLowStock=true" className="text-xs font-bold text-amber-900 underline">
            Lihat →
          </Link>
        </div>
      </Card>
      <Card className="bg-slate-50 border-slate-200">
        <p className="text-xs font-semibold text-slate-700">Mutasi Stok Hari Ini</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">
          {snapshot.todayTransactionsCount} Transaksi
        </p>
      </Card>
    </div>
  );
}

function FlowBar({ pt, maxVal }: { pt: DailyFlowPoint; maxVal: number }) {
  const inPct = Math.round((pt.totalIn / maxVal) * 100);
  const outPct = Math.round((pt.totalOut / maxVal) * 100);
  return (
    <div
      className="flex flex-col items-center min-w-[22px] flex-1"
      title={`${pt.dateLabel}: Masuk ${pt.totalIn}, Keluar ${pt.totalOut}`}
    >
      <div className="flex items-end gap-0.5 h-24 w-full justify-center">
        <div style={{ height: `${Math.max(inPct, 4)}%` }} className="w-2 rounded-t bg-emerald-600" />
        <div style={{ height: `${Math.max(outPct, 4)}%` }} className="w-2 rounded-t bg-rose-500" />
      </div>
      <span className="text-[9px] text-slate-500 mt-1">{pt.dateLabel}</span>
    </div>
  );
}

function FlowChart30Days({ points }: { points: DailyFlowPoint[] }) {
  const maxVal = Math.max(1, ...points.map((p) => Math.max(p.totalIn, p.totalOut)));
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-slate-900">
          Grafik Barang Masuk vs Keluar (30 Hari Terakhir)
        </h3>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Masuk
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Keluar
          </span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-36 overflow-x-auto pb-2 pt-4">
        {points.map((pt) => (
          <FlowBar key={pt.dateLabel} pt={pt} maxVal={maxVal} />
        ))}
      </div>
    </Card>
  );
}

function RecentMovementRow({ m }: { m: RecentActivityItem }) {
  const isPos = m.quantityChange > 0;
  return (
    <div className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant={isPos ? 'success' : 'danger'}>{m.movementType}</Badge>
          <span className="font-bold text-slate-900">
            {m.sku} - {m.itemName}
          </span>
        </div>
        <p className="text-slate-500 mt-0.5">
          Ref: {m.referenceNumber} • {formatDateTimeWib(m.createdAt)}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isPos ? 'text-emerald-700' : 'text-red-600'}`}>
          {isPos ? '+' : ''}
          {formatQuantity(m.quantityChange)}
        </p>
        <p className="text-slate-500">Saldo: {formatQuantity(m.balanceAfter)}</p>
      </div>
    </div>
  );
}

export function DashboardView({
  snapshot,
}: {
  snapshot: DashboardSnapshot;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <KpiRow snapshot={snapshot} />
      <FlowChart30Days points={snapshot.chart30Days} />
      <Card className="space-y-3">
        <h3 className="font-bold text-slate-900">10 Transaksi Mutasi Terakhir</h3>
        {snapshot.recentMovements.length === 0 ? (
          <p className="text-xs text-slate-600">Belum ada transaksi tercatat.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {snapshot.recentMovements.map((m) => (
              <RecentMovementRow key={m.id} m={m} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
