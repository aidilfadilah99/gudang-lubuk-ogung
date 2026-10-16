'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

export interface ReportItemOption {
  id: string;
  sku: string;
  name: string;
}

function ReportTypeSelector(props: {
  kind: string; setKind: (v: string) => void;
  itemId: string; setItemId: (v: string) => void;
  items: ReportItemOption[];
}) {
  return (
    <>
      <div className={props.kind === 'STOCK_CARD' ? 'sm:col-span-1' : 'sm:col-span-2'}>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Laporan</label>
        <select
          value={props.kind} onChange={(e) => props.setKind(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none"
        >
          <option value="STOCK_AS_OF">1. Laporan Stok Per Tanggal</option>
          <option value="RECEIPTS_PERIOD">2. Laporan Barang Masuk Per Periode</option>
          <option value="ISSUES_PERIOD">3. Laporan Barang Keluar Per Periode</option>
          <option value="STOCK_CARD">4. Laporan Kartu Stok Per Barang</option>
          <option value="LOW_STOCK">5. Laporan Barang Stok Menipis</option>
        </select>
      </div>
      {props.kind === 'STOCK_CARD' && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Barang</label>
          <select
            value={props.itemId} onChange={(e) => props.setItemId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none"
          >
            {props.items.map((i) => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}
          </select>
        </div>
      )}
    </>
  );
}

function ReportDateInputs(props: {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Dari Tanggal</label>
        <input
          type="date" value={props.fromDate} onChange={(e) => props.setFromDate(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
        <input
          type="date" value={props.toDate} onChange={(e) => props.setToDate(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none"
        />
      </div>
    </>
  );
}

function ReportsHeader() {
  return (
    <div className="border-b border-slate-100 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
        <h3 className="font-bold text-slate-900 text-sm">Generator Laporan Resmi KDKMP</h3>
      </div>
      <p className="text-xs text-slate-500 mt-0.5">Dilengkapi kop surat, periode waktu WIB, dan blok tanda tangan.</p>
    </div>
  );
}

function ReportsActions({ onDownload }: { onDownload: (f: 'PDF' | 'EXCEL') => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
      <Button onClick={() => onDownload('PDF')} className="flex items-center gap-2">
        <span>Unduh PDF (.pdf)</span>
      </Button>
      <Button variant="secondary" onClick={() => onDownload('EXCEL')} className="flex items-center gap-2">
        <span>Unduh Excel (.xlsx)</span>
      </Button>
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
    <Card className="p-4 sm:p-6 space-y-4 shadow-sm border border-slate-200/80">
      <ReportsHeader />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <ReportTypeSelector kind={kind} setKind={setKind} itemId={itemId} setItemId={setItemId} items={items} />
        <ReportDateInputs fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} />
      </div>
      <ReportsActions onDownload={triggerDownload} />
    </Card>
  );
}
