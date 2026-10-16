import React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Boxes,
  ShieldCheck,
} from 'lucide-react';
import { formatDateTimeWib, formatQuantity } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import {
  DailyFlowPoint,
  DashboardSnapshot,
  RecentActivityItem,
} from '../domain/dashboard';

function QuickActionHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          Ringkasan Gudang Utama
        </h2>
        <p className="text-xs text-slate-500">
          Data inventaris berbasis buku besar mutasi permanen (*ledger*)
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/receipts"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-700/20 hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
          <span>Barang Masuk</span>
        </Link>
        <Link
          href="/issues"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition-all"
        >
          <ArrowUpFromLine className="h-3.5 w-3.5" />
          <span>Barang Keluar</span>
        </Link>
      </div>
    </div>
  );
}

function KpiCard(props: {
  title: string; icon: React.ReactNode; value: React.ReactNode; sub: string; action?: React.ReactNode;
}) {
  return (
    <Card className="bento-card relative overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{props.title}</span>
        {props.icon}
      </div>
      <div className="flex items-baseline justify-between mt-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{props.value}</div>
        {props.action}
      </div>
      <p className="text-[11px] font-semibold text-slate-500 mt-1">{props.sub}</p>
    </Card>
  );
}

function KpiRow({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        title="Total SKU"
        icon={<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Boxes className="h-4 w-4" /></div>}
        value={snapshot.totalSku}
        sub="Barang Terdaftar"
      />
      <KpiCard
        title="Stok Menipis"
        icon={<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><AlertTriangle className="h-4 w-4" /></div>}
        value={<span className="text-amber-600">{snapshot.lowStockCount}</span>}
        sub="Perlu Restock"
        action={<Link href="/stock?onlyLowStock=true" className="text-xs font-bold text-amber-700 hover:underline">Cek →</Link>}
      />
      <KpiCard
        title="Transaksi Hari Ini"
        icon={<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Activity className="h-4 w-4" /></div>}
        value={snapshot.todayTransactionsCount}
        sub="Mutasi Masuk/Keluar"
      />
      <KpiCard
        title="Buku Besar"
        icon={<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><ShieldCheck className="h-4 w-4" /></div>}
        value={<span className="text-lg sm:text-xl">Terkunci</span>}
        sub="Zero Negative Stock"
      />
    </div>
  );
}

function FlowBar({ pt, maxVal }: { pt: DailyFlowPoint; maxVal: number }) {
  const inPct = Math.round((pt.totalIn / maxVal) * 100);
  const outPct = Math.round((pt.totalOut / maxVal) * 100);
  return (
    <div className="flex flex-col items-center min-w-[24px] flex-1" title={`${pt.dateLabel}: Masuk ${pt.totalIn}, Keluar ${pt.totalOut}`}>
      <div className="flex items-end gap-1 h-28 w-full justify-center">
        <div style={{ height: `${Math.max(inPct, 4)}%` }} className="w-2.5 rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-500 transition-all" />
        <div style={{ height: `${Math.max(outPct, 4)}%` }} className="w-2.5 rounded-t-md bg-gradient-to-t from-rose-600 to-red-400 transition-all" />
      </div>
      <span className="text-[9px] font-mono text-slate-400 mt-1 truncate max-w-full">{pt.dateLabel}</span>
    </div>
  );
}

function FlowChart30Days({ points }: { points: DailyFlowPoint[] }) {
  const maxVal = Math.max(1, ...points.map((p) => Math.max(p.totalIn, p.totalOut)));
  return (
    <Card className="bento-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Arus Mutasi Barang (30 Hari Terakhir)</h3>
          <p className="text-xs text-slate-500">Perbandingan kuantitas barang masuk vs barang keluar</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <span className="h-2 w-2 rounded-full bg-emerald-600" /> Masuk
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
            <span className="h-2 w-2 rounded-full bg-rose-600" /> Keluar
          </span>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-36 overflow-x-auto pb-2 pt-2 scrollbar-none">
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
    <div className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isPos ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'}`}>
          {isPos ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={isPos ? 'success' : 'danger'}>{m.movementType}</Badge>
            <span className="font-bold text-slate-900 truncate">{m.itemName}</span>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            <span className="font-mono text-slate-600">{m.sku}</span> • {m.referenceNumber} • {formatDateTimeWib(m.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className={`font-extrabold text-sm ${isPos ? 'text-emerald-700' : 'text-rose-600'}`}>
          {isPos ? '+' : ''}{formatQuantity(m.quantityChange)}
        </p>
        <p className="text-[11px] text-slate-400 font-medium">Saldo: {formatQuantity(m.balanceAfter)}</p>
      </div>
    </div>
  );
}

export function DashboardView({ snapshot }: { snapshot: DashboardSnapshot }): React.ReactElement {
  return (
    <div className="space-y-5">
      <QuickActionHeader />
      <KpiRow snapshot={snapshot} />
      <FlowChart30Days points={snapshot.chart30Days} />
      <Card className="bento-card space-y-3">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">10 Transaksi Mutasi Terakhir</h3>
            <p className="text-xs text-slate-500">Aktivitas penerimaan dan pengeluaran barang terbaru</p>
          </div>
          <Link href="/stock" className="text-xs font-bold text-emerald-700 hover:underline">Semua Stok →</Link>
        </div>
        {snapshot.recentMovements.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Belum ada transaksi mutasi tercatat.</p>
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
