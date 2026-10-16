'use client';

import React, { useState } from 'react';
import { BarcodeScannerButton } from '@/shared/ui/barcode-scanner';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
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
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
        >
          {props.suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">No. Faktur / Surat Jalan</label>
        <input
          type="text" value={props.invoiceNumber} onChange={(e) => props.setInvoiceNumber(e.target.value)}
          placeholder="Contoh: SJ-2026-089" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan (Opsional)</label>
        <input
          type="text" value={props.notes} onChange={(e) => props.setNotes(e.target.value)}
          placeholder="Kondisi pengiriman baik" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Barang</label>
        <select value={props.itemId} onChange={(e) => onSelectItem(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
          {props.items.map((i) => <option key={i.id} value={i.id}>{i.sku} - {i.name} ({i.unitCode})</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Masuk</label>
        <input type="number" step="0.001" min="0.001" value={props.quantity} onChange={(e) => props.setQuantity(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli Satuan (Rp)</label>
        <input type="number" min="0" step="1" value={props.unitPrice} onChange={(e) => props.setUnitPrice(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required />
      </div>
    </div>
  );
}

export function ReceiptForm({ items, suppliers }: { items: ReceiptItemOption[]; suppliers: SupplierOption[] }): React.ReactElement {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState(String(items[0]?.purchasePrice ?? 0));
  const [idemKey, setIdemKey] = useState(() => `rcp_${crypto.randomUUID()}`);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleBarcodeMatch(code: string) {
    const found = items.find((i) => i.barcode === code || i.sku === code);
    if (!found) return setFeedback(`⚠️ Barcode "${code}" tidak ditemukan.`);
    setItemId(found.id); setUnitPrice(String(found.purchasePrice)); setFeedback(`🔍 Barcode cocok: ${found.name}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const res = await submitCreateReceiptAction({
      idempotencyKey: idemKey, supplierId, invoiceNumber, notes,
      lines: [{ itemId, quantity: Number(quantity), unitPurchasePrice: Number(unitPrice) }],
    });
    setLoading(false);
    if (!res.ok) return setFeedback(`❌ ${res.message}`);
    setFeedback(`✅ Barang Masuk ${res.data.receiptNumber} berhasil disimpan.`);
    setInvoiceNumber(''); setQuantity('1'); setIdemKey(`rcp_${crypto.randomUUID()}`);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-900">Catat Barang Masuk</h3><BarcodeScannerButton onScan={handleBarcodeMatch} /></div>
        <ReceiptHeaderFields suppliers={suppliers} supplierId={supplierId} setSupplierId={setSupplierId} invoiceNumber={invoiceNumber} setInvoiceNumber={setInvoiceNumber} notes={notes} setNotes={setNotes} />
        <ReceiptLineFields items={items} itemId={itemId} setItemId={setItemId} quantity={quantity} setQuantity={setQuantity} unitPrice={unitPrice} setUnitPrice={setUnitPrice} />
        {feedback && <p className="text-xs font-semibold text-slate-800">{feedback}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? 'Menyimpan...' : 'Simpan Barang Masuk'}</Button>
      </form>
    </Card>
  );
}
