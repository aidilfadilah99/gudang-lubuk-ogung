'use client';

import React, { useState } from 'react';
import { BarcodeScannerButton } from '@/shared/ui/barcode-scanner';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { formatRupiah } from '@/shared/lib/format';
import { submitCreateReceiptAction } from './actions';

export interface ReceiptItemOption {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  purchasePrice: number;
  unitCode: string;
}

export interface SupplierOption {
  id: string;
  code: string;
  name: string;
}

function ReceiptHeaderFields(props: {
  suppliers: SupplierOption[];
  supplierId: string; setSupplierId: (v: string) => void;
  invoiceNumber: string; setInvoiceNumber: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
        <select
          value={props.supplierId} onChange={(e) => props.setSupplierId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none" required
        >
          {props.suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">No. Faktur</label>
        <input
          type="text" value={props.invoiceNumber} onChange={(e) => props.setInvoiceNumber(e.target.value)}
          placeholder="SJ-2026-089" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none" required
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

function ReceiptSubtotalFooter({ subtotal }: { subtotal: number }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs">
      <span className="text-slate-500 font-medium">Subtotal Estimasi:</span>
      <span className="font-extrabold text-emerald-800 text-sm">{formatRupiah(subtotal)}</span>
    </div>
  );
}

function ReceiptItemInputs(props: {
  items: ReceiptItemOption[];
  itemId: string; onSelect: (id: string) => void;
  quantity: string; setQuantity: (v: string) => void;
  unitPrice: string; setUnitPrice: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
      <div className="sm:col-span-6">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Barang Masuk</label>
        <select
          value={props.itemId} onChange={(e) => props.onSelect(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 outline-none"
        >
          {props.items.map((i) => <option key={i.id} value={i.id}>{i.sku} — {i.name} ({i.unitCode})</option>)}
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah</label>
        <input
          type="number" step="0.001" min="0.001" value={props.quantity} onChange={(e) => props.setQuantity(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none" required
        />
      </div>
      <div className="sm:col-span-3">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli (Rp)</label>
        <input
          type="number" min="0" step="1" value={props.unitPrice} onChange={(e) => props.setUnitPrice(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none" required
        />
      </div>
    </div>
  );
}

function ReceiptLineFields(props: {
  items: ReceiptItemOption[];
  itemId: string; setItemId: (v: string) => void;
  quantity: string; setQuantity: (v: string) => void;
  unitPrice: string; setUnitPrice: (v: string) => void;
}) {
  function onSelectItem(id: string) {
    props.setItemId(id);
    const sel = props.items.find((x) => x.id === id);
    if (sel) props.setUnitPrice(String(sel.purchasePrice));
  }
  const subtotal = (Number(props.quantity) || 0) * (Number(props.unitPrice) || 0);

  return (
    <div className="rounded-2xl bg-slate-50/60 p-4 border border-slate-200/80 space-y-3">
      <ReceiptItemInputs items={props.items} itemId={props.itemId} onSelect={onSelectItem} quantity={props.quantity} setQuantity={props.setQuantity} unitPrice={props.unitPrice} setUnitPrice={props.setUnitPrice} />
      <ReceiptSubtotalFooter subtotal={subtotal} />
    </div>
  );
}

function ReceiptFeedbackAlert({ feedback }: { feedback: { text: string; ok: boolean } | null }) {
  if (!feedback) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-semibold ${feedback.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
      {feedback.ok ? '✓ ' : '✕ '} {feedback.text}
    </div>
  );
}

function ReceiptFormHeader({ onScan }: { onScan: (code: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <h3 className="font-bold text-slate-900 text-sm">Penerimaan Barang Masuk</h3>
      </div>
      <BarcodeScannerButton onScan={onScan} />
    </div>
  );
}

function findItemByBarcode(items: ReceiptItemOption[], code: string) {
  return items.find((i) => i.barcode === code || i.sku === code);
}

function useReceiptForm(items: ReceiptItemOption[]) {
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState(String(items[0]?.purchasePrice ?? 0));
  const [idemKey, setIdemKey] = useState(() => `rcp_${crypto.randomUUID()}`);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  return { itemId, setItemId, quantity, setQuantity, unitPrice, setUnitPrice, idemKey, setIdemKey, feedback, setFeedback, loading, setLoading };
}

export function ReceiptForm({
  items, suppliers,
}: {
  items: ReceiptItemOption[]; suppliers: SupplierOption[];
}): React.ReactElement {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const s = useReceiptForm(items);

  function handleBarcodeMatch(code: string) {
    const f = findItemByBarcode(items, code);
    if (!f) return s.setFeedback({ text: `Barcode "${code}" tidak ditemukan.`, ok: false });
    s.setItemId(f.id); s.setUnitPrice(String(f.purchasePrice)); s.setFeedback({ text: `Barcode cocok: ${f.name}`, ok: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); s.setLoading(true);
    const res = await submitCreateReceiptAction({
      idempotencyKey: s.idemKey, supplierId, invoiceNumber, notes,
      lines: [{ itemId: s.itemId, quantity: Number(s.quantity), unitPurchasePrice: Number(s.unitPrice) }],
    });
    s.setLoading(false);
    if (!res.ok) return s.setFeedback({ text: res.message, ok: false });
    s.setFeedback({ text: `Barang Masuk #${res.data.receiptNumber} berhasil dicatat.`, ok: true });
    setInvoiceNumber(''); s.setQuantity('1'); s.setIdemKey(`rcp_${crypto.randomUUID()}`);
  }

  return (
    <Card className="p-4 sm:p-5 shadow-sm border border-slate-200/80">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ReceiptFormHeader onScan={handleBarcodeMatch} />
        <ReceiptHeaderFields suppliers={suppliers} supplierId={supplierId} setSupplierId={setSupplierId} invoiceNumber={invoiceNumber} setInvoiceNumber={setInvoiceNumber} notes={notes} setNotes={setNotes} />
        <ReceiptLineFields items={items} itemId={s.itemId} setItemId={s.setItemId} quantity={s.quantity} setQuantity={s.setQuantity} unitPrice={s.unitPrice} setUnitPrice={s.setUnitPrice} />
        <ReceiptFeedbackAlert feedback={s.feedback} />
        <Button type="submit" disabled={s.loading} className="w-full sm:w-auto">{s.loading ? 'Menyimpan...' : 'Simpan Barang Masuk'}</Button>
      </form>
    </Card>
  );
}
