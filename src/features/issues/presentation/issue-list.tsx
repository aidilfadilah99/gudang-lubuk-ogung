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
import { StockIssueDocument } from '../domain/issue';
import { submitVoidIssueAction } from './actions';

function IssueCard({
  iss, isAdmin, onVoid,
}: {
  iss: StockIssueDocument; isAdmin: boolean; onVoid: (id: string, num: string) => void;
}) {
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900">{iss.issueNumber}</span>
            <Badge variant="default">{iss.destinationType}</Badge>
            <Badge variant={iss.status === 'POSTED' ? 'success' : 'danger'}>{iss.status}</Badge>
          </div>
          <p className="text-xs text-slate-600">
            Penerima: <strong>{iss.recipientName}</strong> • {formatDateTimeWib(iss.issueDate)}
          </p>
        </div>
        {isAdmin && iss.status === 'POSTED' && (
          <Button variant="danger" size="sm" onClick={() => onVoid(iss.id, iss.issueNumber)}>
            Void Transaksi
          </Button>
        )}
      </div>
      <div className="border-t border-slate-100 pt-2 space-y-1">
        {iss.lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between text-xs text-slate-700">
            <span>{l.sku ? `${l.sku} - ` : ''}{l.itemName ?? l.itemId}</span>
            <span className="font-semibold">
              -{formatQuantity(l.quantity)} × {formatRupiah(l.unitSellingPrice)} = {formatRupiah(l.subtotal)}
            </span>
          </div>
        ))}
      </div>
      {iss.voidReason && <p className="text-xs text-red-600 font-semibold">Alasan Void: {iss.voidReason}</p>}
    </Card>
  );
}

export function IssueListView({
  issues, isAdmin,
}: {
  issues: StockIssueDocument[]; isAdmin: boolean;
}): React.ReactElement {
  const [msg, setMsg] = useState<string | null>(null);

  async function handleVoid(issueId: string, issueNumber: string) {
    const reason = window.prompt(`Masukkan alasan wajib VOID untuk dokumen ${issueNumber} (minimal 5 karakter):`);
    if (!reason) return;
    const res = await submitVoidIssueAction({
      idempotencyKey: `void_iss_${issueId}_${Date.now()}`, issueId, voidReason: reason,
    });
    setMsg(res.ok ? `✅ Dokumen ${issueNumber} berhasil di-VOID (stok telah dikembalikan).` : `❌ Gagal Void: ${res.message}`);
  }

  return (
    <div className="space-y-3">
      {msg && <div className="rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-800">{msg}</div>}
      {issues.map((iss) => (
        <IssueCard key={iss.id} iss={iss} isAdmin={isAdmin} onVoid={handleVoid} />
      ))}
    </div>
  );
}
