'use client';

import React, { useState } from 'react';
import { BarcodeScannerButton } from '@/shared/ui/barcode-scanner';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { formatQuantity, formatRupiah } from '@/shared/lib/format';
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
        <label className="block text-xs font-semibold text-slate-700 mb-1">Tujuan</label>
        <select
          value={props.destinationType} onChange={(e) => props.setDestinationType(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none"
        >
          <option value="ANGGOTA">Anggota Koperasi</option>
          <option value="UMUM">Umum / Pembeli</option>
          <option value="INTERNAL">Pemakaian Internal</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Penerima</label>
        <input
          type="text" value={props.recipientName} onChange={(e) => props.setRecipientName(e.target.value)}
          placeholder="Nama penerima" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
        <input
          type="text" value={props.notes} onChange={(e) => props.setNotes(e.target.value)}
          placeholder="Opsional" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none"
        />
      </div>
    </div>
  );
}

function IssuePriceFooter({ sel, qty, isExceed }: { sel: IssueItemOption; qty: number; isExceed: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
      <span className="text-slate-500">
        Harga: <strong>{formatRupiah(sel.sellingPrice)}</strong> • Total: <strong className="text-slate-900">{formatRupiah(sel.sellingPrice * qty)}</strong>
      </span>
      <span className={`text-xs font-semibold ${isExceed ? 'text-rose-600' : 'text-emerald-700'}`}>
        {isExceed ? `⚠️ Stok kurang (sisa ${sel.currentBalance})` : `✓ Stok aman (${sel.currentBalance} ${sel.unitCode})`}
      </span>
    </div>
  );
}

function IssueLineFields(props: {
  items: IssueItemOption[]; itemId: string; setItemId: (v: string) => void;
  quantity: string; setQuantity: (v: string) => void;
}) {
  const sel = props.items.find((i) => i.id === props.itemId);
  const qty = Number(props.quantity) || 0;
  const isExceed = sel ? qty > sel.currentBalance : false;

  return (
    <div className="rounded-2xl bg-slate-50/60 p-4 border border-slate-200/80 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Barang Keluar</label>
          <select
            value={props.itemId} onChange={(e) => props.setItemId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none"
          >
            {props.items.map((i) => (
              <option key={i.id} value={i.id}>{i.sku} — {i.name} ({formatQuantity(i.currentBalance)} {i.unitCode})</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
          <input
            type="number" step="0.001" min="0.001" value={props.quantity} onChange={(e) => props.setQuantity(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2 text-xs font-medium outline-none ${isExceed ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200 bg-white'}`}
            required
          />
        </div>
      </div>
      {sel && <IssuePriceFooter sel={sel} qty={qty} isExceed={isExceed} />}
    </div>
  );
}

function IssueFormHeader({ onScan }: { onScan: (code: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        <h3 className="font-bold text-slate-900 text-sm">Pencatatan Barang Keluar</h3>
      </div>
      <BarcodeScannerButton onScan={onScan} />
    </div>
  );
}

function IssueFeedbackAlert({ feedback }: { feedback: { text: string; ok: boolean } | null }) {
  if (!feedback) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-semibold ${feedback.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
      {feedback.ok ? '✓ ' : '✕ '} {feedback.text}
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
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  function handleBarcodeMatch(code: string) {
    const found = items.find((i) => i.barcode === code || i.sku === code);
    if (!found) return setFeedback({ text: `Barcode "${code}" tidak ditemukan.`, ok: false });
    setItemId(found.id); setFeedback({ text: `Barcode cocok: ${found.name}`, ok: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const sel = items.find((i) => i.id === itemId);
    const res = await submitCreateIssueAction({
      idempotencyKey: idemKey, destinationType, recipientName, notes,
      lines: [{ itemId, quantity: Number(quantity), unitSellingPrice: sel?.sellingPrice ?? 0 }],
    });
    setLoading(false);
    if (!res.ok) return setFeedback({ text: res.message, ok: false });
    setFeedback({ text: `Barang Keluar #${res.data.issueNumber} berhasil dicatat.`, ok: true });
    setRecipientName(''); setQuantity('1'); setIdemKey(`iss_${crypto.randomUUID()}`);
  }

  return (
    <Card className="p-4 sm:p-5 shadow-sm border border-slate-200/80">
      <form onSubmit={handleSubmit} className="space-y-4">
        <IssueFormHeader onScan={handleBarcodeMatch} />
        <IssueHeaderFields destinationType={destinationType} setDestinationType={setDestinationType} recipientName={recipientName} setRecipientName={setRecipientName} notes={notes} setNotes={setNotes} />
        <IssueLineFields items={items} itemId={itemId} setItemId={setItemId} quantity={quantity} setQuantity={setQuantity} />
        <IssueFeedbackAlert feedback={feedback} />
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? 'Menyimpan...' : 'Simpan Barang Keluar'}</Button>
      </form>
    </Card>
  );
}
