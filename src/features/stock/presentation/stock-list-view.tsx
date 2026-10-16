import React from 'react';
import Link from 'next/link';
import { formatQuantity, formatRupiah } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { StockSummaryItem } from '../domain/ledger';

function renderAlertBadge(status: StockSummaryItem['alertStatus']) {
  if (status === 'HABIS') {
    return <Badge variant="danger" withDot>Stok Habis</Badge>;
  }
  if (status === 'MENIPIS') {
    return <Badge variant="warning" withDot>Menipis</Badge>;
  }
  return <Badge variant="success" withDot>Stok Aman</Badge>;
}

function StockProgressBar({ current, min }: { current: number; min: number }) {
  const percent = min > 0 ? Math.min(100, Math.round((current / (min * 2)) * 100)) : 100;
  const isOut = current <= 0;
  const isLow = current <= min && !isOut;
  const barColor = isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-[11px] font-medium text-slate-500">
        <span>Kapasitas Minimum: {formatQuantity(min)}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.max(4, percent)}%` }} />
      </div>
    </div>
  );
}

function StockCardDetails({ item }: { item: StockSummaryItem }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100">
      <div>
        <p className="text-[11px] font-medium text-slate-500">Saldo Fisik</p>
        <p className="text-base font-extrabold text-slate-900 tracking-tight">
          {formatQuantity(item.currentBalance)} <span className="text-xs font-semibold text-slate-600">{item.unitCode}</span>
        </p>
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-500">Harga Jual</p>
        <p className="text-sm font-bold text-slate-800">
          {formatRupiah(item.sellingPrice)}
        </p>
      </div>
    </div>
  );
}

function StockSummaryCard({ item }: { item: StockSummaryItem }) {
  return (
    <Card className="flex flex-col justify-between gap-3 p-4 hover:shadow-md transition-all duration-200 hover:border-slate-300">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                {item.sku}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {item.categoryName}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h3>
          </div>
          {renderAlertBadge(item.alertStatus)}
        </div>
        <StockProgressBar current={item.currentBalance} min={item.minStock} />
        <StockCardDetails item={item} />
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
        <span className="text-[11px] font-mono text-slate-400">
          {item.barcode ? `BC: ${item.barcode}` : 'Tanpa Barcode'}
        </span>
        <Link
          href={`/stock/${item.itemId}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
        >
          <span>Kartu Stok</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </Card>
  );
}

export function StockListView({
  items,
}: {
  items: StockSummaryItem[];
}): React.ReactElement {
  if (items.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2 border-slate-200">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-700">Tidak ada barang yang cocok</p>
        <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {items.map((item) => (
        <StockSummaryCard key={item.itemId} item={item} />
      ))}
    </div>
  );
}
