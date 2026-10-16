import React from 'react';
import Link from 'next/link';
import { formatQuantity, formatRupiah } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { StockSummaryItem } from '../domain/ledger';

function renderAlertBadge(status: StockSummaryItem['alertStatus']) {
  if (status === 'HABIS') return <Badge variant="danger">Stok Habis</Badge>;
  if (status === 'MENIPIS') return <Badge variant="warning">Stok Menipis</Badge>;
  return <Badge variant="success">Aman</Badge>;
}

function StockSummaryCard({ item }: { item: StockSummaryItem }) {
  return (
    <Card className="flex flex-col justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-mono text-slate-500">
              {item.sku} {item.barcode ? `• ${item.barcode}` : ''}
            </span>
            <h3 className="font-bold text-slate-900">{item.name}</h3>
          </div>
          {renderAlertBadge(item.alertStatus)}
        </div>
        <p className="text-xs text-slate-600">
          Kategori: <strong>{item.categoryName}</strong> • Min: {formatQuantity(item.minStock)} {item.unitCode}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <div>
          <p className="text-xs text-slate-500">Saldo Saat Ini</p>
          <p className="text-lg font-extrabold text-emerald-800">
            {formatQuantity(item.currentBalance)} {item.unitCode}
          </p>
          <p className="text-xs text-slate-500">Jual: {formatRupiah(item.sellingPrice)}</p>
        </div>
        <Link
          href={`/stock/${item.itemId}`}
          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200"
        >
          Kartu Stok →
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
      <Card>
        <p className="text-sm text-slate-600">Tidak ada barang yang cocok dengan pencarian/filter.</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => (
        <StockSummaryCard key={item.itemId} item={item} />
      ))}
    </div>
  );
}
