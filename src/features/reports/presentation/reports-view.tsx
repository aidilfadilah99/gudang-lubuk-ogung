'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

export interface ReportItemOption {
  id: string;
  sku: string;
  name: string;
}

function ReportFilterInputs(props: {
  kind: string; setKind: (v: string) => void;
  itemId: string; setItemId: (v: string) => void;
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  items: ReportItemOption[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Laporan</label>
        <select value={props.kind} onChange={(e) => props.setKind(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
          <option value="STOCK_AS_OF">1. Laporan Stok Per Tanggal</option>
          <option value="RECEIPTS_PERIOD">2. Laporan Barang Masuk Per Periode</option>
          <option value="ISSUES_PERIOD">3. Laporan Barang Keluar Per Periode</option>
          <option value="STOCK_CARD">4. Laporan Kartu Stok Per Barang</option>
          <option value="LOW_STOCK">5. Laporan Barang Stok Menipis</option>
        </select>
      </div>
      {props.kind === 'STOCK_CARD' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Barang (Kartu Stok)</label>
          <select value={props.itemId} onChange={(e) => props.setItemId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
            {props.items.map((i) => <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Dari Tanggal</label>
        <input type="date" value={props.fromDate} onChange={(e) => props.setFromDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
        <input type="date" value={props.toDate} onChange={(e) => props.setToDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
      </div>
    </div>
  );
}

export function ReportsView({ items }: { items: ReportItemOption[] }): React.ReactElement {
  const [kind, setKind] = useState('STOCK_AS_OF');
  const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [itemId, setItemId] = useState(items[0]?.id ?? '');

  function triggerDownload(format: 'PDF' | 'EXCEL') {
    const params = new URLSearchParams({ kind, format, fromDate, toDate, itemId });
    window.open(`/api/reports?${params.toString()}`, '_blank');
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-900">Generator Laporan Resmi KDKMP Lubuk Ogung (PDF & Excel)</h3>
        <p className="text-xs text-slate-600">
          Dilengkapi kop koperasi, periode, waktu cetak WIB, serta blok tanda tangan Dibuat Oleh & Mengetahui Ketua.
        </p>
      </div>
      <ReportFilterInputs kind={kind} setKind={setKind} itemId={itemId} setItemId={setItemId} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} items={items} />
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={() => triggerDownload('PDF')}>Unduh Laporan PDF (.pdf)</Button>
        <Button variant="secondary" onClick={() => triggerDownload('EXCEL')}>Unduh Laporan Excel (.xlsx)</Button>
      </div>
    </Card>
  );
}
