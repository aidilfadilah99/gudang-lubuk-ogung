'use client';

import React, { useState } from 'react';
import {
  formatDateTimeWib,
  formatQuantity,
  formatRupiah,
} from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { StockReceiptDocument } from '../domain/receipt';
import { submitVoidReceiptAction } from './actions';

function ReceiptLinesSummary({ lines }: { lines: StockReceiptDocument['lines'] }) {
  const totalAmount = lines.reduce((acc, curr) => acc + curr.subtotal, 0);

  return (
    <div className="border-t border-slate-100 pt-3 space-y-1.5">
      {lines.map((l) => (
        <div key={l.id} className="flex items-center justify-between text-xs text-slate-700">
          <span className="font-medium text-slate-800">
            {l.sku ? <span className="font-mono text-slate-500 mr-1.5">{l.sku}</span> : null}
            {l.itemName ?? l.itemId}
          </span>
          <span className="font-semibold text-slate-900">
            {formatQuantity(l.quantity)} × {formatRupiah(l.unitPurchasePrice)} = {formatRupiah(l.subtotal)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold text-slate-900">
        <span>Total Nilai Faktur:</span>
        <span className="text-emerald-700 font-extrabold">{formatRupiah(totalAmount)}</span>
      </div>
    </div>
  );
}

function ReceiptCard({
  r, isAdmin, onVoid,
}: {
  r: StockReceiptDocument; isAdmin: boolean; onVoid: (id: string, num: string) => void;
}) {
  const isPosted = r.status === 'POSTED';
  return (
    <Card className="p-4 sm:p-5 space-y-3 hover:shadow-sm transition-all border border-slate-200/80">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-sm text-slate-900">{r.receiptNumber}</span>
            <Badge variant={isPosted ? 'success' : 'danger'} withDot>
              {r.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Supplier: <strong className="text-slate-800">{r.supplierName ?? r.supplierId}</strong> • Faktur: <span className="font-mono text-slate-700">{r.invoiceNumber}</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Waktu Penerimaan: {formatDateTimeWib(r.receiptDate)}
          </p>
        </div>
        {isAdmin && isPosted && (
          <Button variant="danger" size="sm" onClick={() => onVoid(r.id, r.receiptNumber)}>
            Void Transaksi
          </Button>
        )}
      </div>
      <ReceiptLinesSummary lines={r.lines} />
      {r.voidReason && (
        <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-100 font-medium">
          <strong>Alasan Void:</strong> {r.voidReason}
        </div>
      )}
    </Card>
  );
}

export function ReceiptListView({
  receipts, isAdmin,
}: {
  receipts: StockReceiptDocument[]; isAdmin: boolean;
}): React.ReactElement {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleVoid(receiptId: string, receiptNumber: string) {
    const reason = window.prompt(`Masukkan alasan wajib VOID untuk dokumen ${receiptNumber} (minimal 5 karakter):`);
    if (!reason) return;
    const res = await submitVoidReceiptAction({
      idempotencyKey: `void_rcp_${receiptId}_${Date.now()}`, receiptId, voidReason: reason,
    });
    setMsg({
      text: res.ok ? `Dokumen ${receiptNumber} berhasil di-VOID (jurnal pembalik diterbitkan ke ledger).` : res.message,
      ok: res.ok,
    });
  }

  if (receipts.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2 border-slate-200">
        <p className="text-sm font-bold text-slate-700">Belum ada riwayat barang masuk</p>
        <p className="text-xs text-slate-500 mt-1">Form di atas dapat digunakan untuk mencatat penerimaan pertama.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {msg.ok ? '✓ ' : '✕ '} {msg.text}
        </div>
      )}
      {receipts.map((r) => (
        <ReceiptCard key={r.id} r={r} isAdmin={isAdmin} onVoid={handleVoid} />
      ))}
    </div>
  );
}
