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

function IssueLinesSummary({ lines }: { lines: StockIssueDocument['lines'] }) {
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
            -{formatQuantity(l.quantity)} × {formatRupiah(l.unitSellingPrice)} = {formatRupiah(l.subtotal)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold text-slate-900">
        <span>Total Nilai Penyaluran:</span>
        <span className="text-emerald-700 font-extrabold">{formatRupiah(totalAmount)}</span>
      </div>
    </div>
  );
}

function IssueCard({
  iss, isAdmin, onVoid,
}: {
  iss: StockIssueDocument; isAdmin: boolean; onVoid: (id: string, num: string) => void;
}) {
  const isPosted = iss.status === 'POSTED';
  return (
    <Card className="p-4 sm:p-5 space-y-3 hover:shadow-sm transition-all border border-slate-200/80">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-extrabold text-sm text-slate-900">{iss.issueNumber}</span>
            <Badge variant="info">{iss.destinationType}</Badge>
            <Badge variant={isPosted ? 'success' : 'danger'} withDot>
              {iss.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Penerima: <strong className="text-slate-800">{iss.recipientName}</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            Waktu Penyaluran: {formatDateTimeWib(iss.issueDate)}
          </p>
        </div>
        {isAdmin && isPosted && (
          <Button variant="danger" size="sm" onClick={() => onVoid(iss.id, iss.issueNumber)}>
            Void Transaksi
          </Button>
        )}
      </div>
      <IssueLinesSummary lines={iss.lines} />
      {iss.voidReason && (
        <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-100 font-medium">
          <strong>Alasan Void:</strong> {iss.voidReason}
        </div>
      )}
    </Card>
  );
}

export function IssueListView({
  issues, isAdmin,
}: {
  issues: StockIssueDocument[]; isAdmin: boolean;
}): React.ReactElement {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleVoid(issueId: string, issueNumber: string) {
    const reason = window.prompt(`Masukkan alasan wajib VOID untuk dokumen ${issueNumber} (minimal 5 karakter):`);
    if (!reason) return;
    const res = await submitVoidIssueAction({
      idempotencyKey: `void_iss_${issueId}_${Date.now()}`, issueId, voidReason: reason,
    });
    setMsg({
      text: res.ok ? `Dokumen ${issueNumber} berhasil di-VOID (stok dikembalikan via jurnal pembalik).` : res.message,
      ok: res.ok,
    });
  }

  if (issues.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2 border-slate-200">
        <p className="text-sm font-bold text-slate-700">Belum ada riwayat barang keluar</p>
        <p className="text-xs text-slate-500 mt-1">Form di atas dapat digunakan untuk mencatat pengeluaran pertama.</p>
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
      {issues.map((iss) => (
        <IssueCard key={iss.id} iss={iss} isAdmin={isAdmin} onVoid={handleVoid} />
      ))}
    </div>
  );
}
