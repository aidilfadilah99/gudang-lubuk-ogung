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

function AdjustmentFields(props: {
  items: AdjustableItemOption[];
  itemId: string; setItemId: (v: string) => void;
  quantityDelta: string; setQuantityDelta: (v: string) => void;
  reasonCategory: string; setReasonCategory: (v: string) => void;
  reasonDetail: string; setReasonDetail: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Barang</label>
        <select value={props.itemId} onChange={(e) => props.setItemId(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required>
          {props.items.map((i) => <option key={i.id} value={i.id}>{i.sku} - {i.name} (Saldo: {i.currentBalance} {i.unitCode})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Selisih Kuantitas (+ / -)</label>
          <input type="number" step="0.001" value={props.quantityDelta} onChange={(e) => props.setQuantityDelta(e.target.value)} placeholder="Contoh: -2 atau 5" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Alasan</label>
          <select value={props.reasonCategory} onChange={(e) => props.setReasonCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
            <option value="RUSAK">Barang Rusak</option>
            <option value="HILANG">Barang Hilang / Susut</option>
            <option value="SELISIH_HITUNG">Selisih Hitung Fisik</option>
            <option value="KOREKSI_ADMIN">Koreksi Admin</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Lengkap (Wajib)</label>
        <input type="text" value={props.reasonDetail} onChange={(e) => props.setReasonDetail(e.target.value)} placeholder="Contoh: 2 sak pupuk basah terkena rembesan air hujan" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required minLength={5} />
      </div>
    </>
  );
}

export function StockAdjustmentForm({ items }: { items: AdjustableItemOption[] }): React.ReactElement {
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [quantityDelta, setQuantityDelta] = useState('');
  const [reasonCategory, setReasonCategory] = useState('RUSAK');
  const [reasonDetail, setReasonDetail] = useState('');
  const [idemKey, setIdemKey] = useState(() => `adj_${crypto.randomUUID()}`);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    const res = await submitStockAdjustmentAction({
      idempotencyKey: idemKey, itemId, quantityDelta: Number(quantityDelta), reasonCategory, reasonDetail,
    });
    setLoading(false);
    if (!res.ok) return setStatusMsg(`❌ ${res.message}`);
    setStatusMsg(`✅ Penyesuaian ${res.data.adjustmentNumber} berhasil. Saldo baru: ${res.data.movement.balanceAfter}`);
    setQuantityDelta(''); setReasonDetail(''); setIdemKey(`adj_${crypto.randomUUID()}`);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="font-bold text-slate-900">Form Penyesuaian Stok Manual (Khusus Admin)</h3>
        <AdjustmentFields items={items} itemId={itemId} setItemId={setItemId} quantityDelta={quantityDelta} setQuantityDelta={setQuantityDelta} reasonCategory={reasonCategory} setReasonCategory={setReasonCategory} reasonDetail={reasonDetail} setReasonDetail={setReasonDetail} />
        {statusMsg && <p className="text-xs font-semibold text-slate-800">{statusMsg}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? 'Menyimpan...' : 'Simpan Penyesuaian Stok'}</Button>
      </form>
    </Card>
  );
}
