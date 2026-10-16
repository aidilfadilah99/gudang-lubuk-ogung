'use client';

import React, { useState } from 'react';
import { BarcodeScannerButton } from '@/shared/ui/barcode-scanner';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { submitCreateIssueAction } from './actions';

export interface IssueItemOption {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  sellingPrice: number;
  currentBalance: number;
  unitCode: string;
}

function IssueHeaderFields(props: {
  destinationType: string; setDestinationType: (v: string) => void;
  recipientName: string; setRecipientName: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Tujuan Pengeluaran</label>
        <select
          value={props.destinationType} onChange={(e) => props.setDestinationType(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          <option value="ANGGOTA">Anggota Koperasi</option>
          <option value="UMUM">Umum / Pelanggan</option>
          <option value="INTERNAL">Pemakaian Internal KDKMP</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penerima</label>
        <input
          type="text" value={props.recipientName} onChange={(e) => props.setRecipientName(e.target.value)}
          placeholder="Contoh: Pak Hendra (Kelompok Tani 2)"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan (Opsional)</label>
        <input
          type="text" value={props.notes} onChange={(e) => props.setNotes(e.target.value)}
          placeholder="Pengambilan pupuk blok B"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>
    </div>
  );
}

function IssueLineFields(props: {
  items: IssueItemOption[];
  itemId: string; setItemId: (v: string) => void;
  quantity: string; setQuantity: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Barang (Beserta Saldo)</label>
        <select
          value={props.itemId} onChange={(e) => props.setItemId(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
        >
          {props.items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.sku} - {i.name} (Stok: {i.currentBalance} {i.unitCode})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Keluar</label>
        <input
          type="number" step="0.001" min="0.001" value={props.quantity}
          onChange={(e) => props.setQuantity(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
        />
      </div>
    </div>
  );
}

export function IssueForm({ items }: { items: IssueItemOption[] }): React.ReactElement {
  const [destinationType, setDestinationType] = useState('ANGGOTA');
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [idemKey, setIdemKey] = useState(() => `iss_${crypto.randomUUID()}`);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleBarcodeMatch(code: string) {
    const found = items.find((i) => i.barcode === code || i.sku === code);
    if (!found) return setFeedback(`⚠️ Barcode "${code}" tidak ditemukan.`);
    setItemId(found.id); setFeedback(`🔍 Barcode cocok: ${found.name} (Stok: ${found.currentBalance})`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const sel = items.find((i) => i.id === itemId);
    const res = await submitCreateIssueAction({
      idempotencyKey: idemKey, destinationType, recipientName, notes,
      lines: [{ itemId, quantity: Number(quantity), unitSellingPrice: sel?.sellingPrice ?? 0 }],
    });
    setLoading(false);
    if (!res.ok) return setFeedback(`❌ ${res.message}`);
    setFeedback(`✅ Barang Keluar ${res.data.issueNumber} berhasil disimpan.`);
    setRecipientName(''); setQuantity('1'); setIdemKey(`iss_${crypto.randomUUID()}`);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">Catat Barang Keluar</h3><BarcodeScannerButton onScan={handleBarcodeMatch} /></div>
        <IssueHeaderFields destinationType={destinationType} setDestinationType={setDestinationType} recipientName={recipientName} setRecipientName={setRecipientName} notes={notes} setNotes={setNotes} />
        <IssueLineFields items={items} itemId={itemId} setItemId={setItemId} quantity={quantity} setQuantity={setQuantity} />
        {feedback && <p className="text-xs font-semibold text-slate-800">{feedback}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? 'Menyimpan...' : 'Simpan Barang Keluar'}</Button>
      </form>
    </Card>
  );
}
