'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { submitStockAdjustmentAction } from './actions';

export interface AdjustableItemOption {
  id: string;
  sku: string;
  name: string;
  currentBalance: number;
  unitCode: string;
}

function AdjustmentItemAndQty(props: {
  items: AdjustableItemOption[];
  itemId: string; setItemId: (v: string) => void;
  quantityDelta: string; setQuantityDelta: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Barang</label>
        <select
          value={props.itemId} onChange={(e) => props.setItemId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none" required
        >
          {props.items.map((i) => (
            <option key={i.id} value={i.id}>{i.sku} — {i.name} (Saldo: {i.currentBalance} {i.unitCode})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Selisih Kuantitas (+ atau -)</label>
        <input
          type="number" step="0.001" value={props.quantityDelta} onChange={(e) => props.setQuantityDelta(e.target.value)}
          placeholder="Contoh: -2 atau 5" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none" required
        />
      </div>
    </>
  );
}

function AdjustmentReasonInputs(props: {
  reasonCategory: string; setReasonCategory: (v: string) => void;
  reasonDetail: string; setReasonDetail: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Alasan</label>
        <select
          value={props.reasonCategory} onChange={(e) => props.setReasonCategory(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none"
        >
          <option value="RUSAK">Barang Rusak</option>
          <option value="HILANG">Barang Hilang / Susut</option>
          <option value="SELISIH_HITUNG">Selisih Hitung Fisik</option>
          <option value="KOREKSI_ADMIN">Koreksi Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Lengkap (Wajib)</label>
        <input
          type="text" value={props.reasonDetail} onChange={(e) => props.setReasonDetail(e.target.value)}
          placeholder="Alasan penyesuaian" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none" required minLength={5}
        />
      </div>
    </>
  );
}

function AdjustmentTitle() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
        Penyesuaian Stok Manual (Hak Khusus Admin)
      </h3>
    </div>
  );
}

export function StockAdjustmentForm({ items }: { items: AdjustableItemOption[] }): React.ReactElement {
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [quantityDelta, setQuantityDelta] = useState('');
  const [reasonCategory, setReasonCategory] = useState('RUSAK');
  const [reasonDetail, setReasonDetail] = useState('');
  const [idemKey, setIdemKey] = useState(() => `adj_${crypto.randomUUID()}`);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setStatusMsg(null);
    const res = await submitStockAdjustmentAction({
      idempotencyKey: idemKey, itemId, quantityDelta: Number(quantityDelta), reasonCategory, reasonDetail,
    });
    setLoading(false);
    if (!res.ok) return setStatusMsg({ text: res.message, ok: false });
    setStatusMsg({ text: `Penyesuaian ${res.data.adjustmentNumber} berhasil. Saldo baru: ${res.data.movement.balanceAfter}`, ok: true });
    setQuantityDelta(''); setReasonDetail(''); setIdemKey(`adj_${crypto.randomUUID()}`);
  }

  return (
    <Card className="p-4 sm:p-5 border border-amber-200/60 bg-amber-50/20 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <AdjustmentTitle />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AdjustmentItemAndQty items={items} itemId={itemId} setItemId={setItemId} quantityDelta={quantityDelta} setQuantityDelta={setQuantityDelta} />
          <AdjustmentReasonInputs reasonCategory={reasonCategory} setReasonCategory={setReasonCategory} reasonDetail={reasonDetail} setReasonDetail={setReasonDetail} />
        </div>
        {statusMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-semibold ${statusMsg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {statusMsg.ok ? '✓ ' : '✕ '} {statusMsg.text}
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? 'Membukukan...' : 'Buku Penyesuaian ke Ledger'}</Button>
      </form>
    </Card>
  );
}
