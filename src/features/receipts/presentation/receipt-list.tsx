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

function ReceiptCard({
  r, isAdmin, onVoid,
}: {
  r: StockReceiptDocument; isAdmin: boolean; onVoid: (id: string, num: string) => void;
}) {
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900">{r.receiptNumber}</span>
            <Badge variant={r.status === 'POSTED' ? 'success' : 'danger'}>{r.status}</Badge>
          </div>
          <p className="text-xs text-slate-600">
            Supplier: <strong>{r.supplierName ?? r.supplierId}</strong> • Faktur: {r.invoiceNumber} • {formatDateTimeWib(r.receiptDate)}
          </p>
        </div>
        {isAdmin && r.status === 'POSTED' && (
          <Button variant="danger" size="sm" onClick={() => onVoid(r.id, r.receiptNumber)}>
            Void Transaksi
          </Button>
        )}
      </div>
      <div className="border-t border-slate-100 pt-2 space-y-1">
        {r.lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between text-xs text-slate-700">
            <span>{l.sku ? `${l.sku} - ` : ''}{l.itemName ?? l.itemId}</span>
            <span className="font-semibold">
              {formatQuantity(l.quantity)} × {formatRupiah(l.unitPurchasePrice)} = {formatRupiah(l.subtotal)}
            </span>
          </div>
        ))}
      </div>
      {r.voidReason && <p className="text-xs text-red-600 font-semibold">Alasan Void: {r.voidReason}</p>}
    </Card>
  );
}

export function ReceiptListView({
  receipts, isAdmin,
}: {
  receipts: StockReceiptDocument[]; isAdmin: boolean;
}): React.ReactElement {
  const [msg, setMsg] = useState<string | null>(null);

  async function handleVoid(receiptId: string, receiptNumber: string) {
    const reason = window.prompt(`Masukkan alasan wajib VOID untuk dokumen ${receiptNumber} (minimal 5 karakter):`);
    if (!reason) return;
    const res = await submitVoidReceiptAction({
      idempotencyKey: `void_rcp_${receiptId}_${Date.now()}`, receiptId, voidReason: reason,
    });
    setMsg(res.ok ? `✅ Dokumen ${receiptNumber} berhasil di-VOID (mutasi pembalik tercatat).` : `❌ Gagal Void: ${res.message}`);
  }

  return (
    <div className="space-y-3">
      {msg && <div className="rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-800">{msg}</div>}
      {receipts.map((r) => (
        <ReceiptCard key={r.id} r={r} isAdmin={isAdmin} onVoid={handleVoid} />
      ))}
    </div>
  );
}
