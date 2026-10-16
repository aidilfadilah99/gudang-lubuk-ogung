'use client';

import React, { useState } from 'react';
import { formatRupiah } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  ImportPreviewResult,
  ValidatedImportRow,
} from '../domain/import-parser';
import { processCsvImportAction } from './actions';

const SAMPLE_CSV = `sku,barcode,name,category_code,unit_code,purchase_price,selling_price,min_stock
PPK-010,8992003100991,Pupuk KCL Mahkota 50 Kg,PPK,SAK,410000,445000,15
SMB-010,8991002109911,Tepung Terigu Segitiga 1 Kg,SMB,KG,11500,13500,20`;

function ValidPreviewList({
  rows,
  canCommit,
  loading,
  onCommit,
}: {
  rows: ValidatedImportRow[];
  canCommit: boolean;
  loading: boolean;
  onCommit: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold text-slate-800">Pratinjau Data Siap Impor:</p>
      <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pr-1">
        {rows.map((v) => (
          <div key={v.rowNumber} className="flex flex-wrap items-center justify-between rounded-xl bg-slate-50 border border-slate-200/60 p-2.5">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-400 block">Baris {v.rowNumber}</span>
              <span className="font-bold text-slate-900">{v.name}</span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-mono bg-slate-200/60 px-1 rounded">{v.sku}</span>
                <span>• {v.categoryCode} / {v.unitCode}</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-[11px] text-slate-500 block">Beli: {formatRupiah(v.purchasePrice)}</span>
              <span className="font-extrabold text-emerald-800">Jual: {formatRupiah(v.sellingPrice)}</span>
            </div>
          </div>
        ))}
      </div>
      {canCommit && (
        <Button size="sm" disabled={loading} onClick={onCommit} className="w-full sm:w-auto">
          {loading ? 'Menyimpan ke Database...' : `Konfirmasi & Simpan (${rows.length} Barang)`}
        </Button>
      )}
    </div>
  );
}

function ImportPreviewSection({
  preview,
  onCommit,
  loading,
}: {
  preview: ImportPreviewResult & { importedCount: number };
  onCommit: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-3.5 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">Total Baris: {preview.totalRows}</Badge>
        <Badge variant="success" withDot>Valid: {preview.validRows.length}</Badge>
        <Badge variant={preview.invalidRows.length > 0 ? 'danger' : 'default'} withDot>
          Error: {preview.invalidRows.length}
        </Badge>
      </div>
      {preview.invalidRows.length > 0 && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200/70 p-3.5 space-y-1.5 text-xs text-rose-900">
          <p className="font-bold text-rose-950">Daftar Kesalahan Baris (Wajib Diperbaiki Sebelum Impor):</p>
          {preview.invalidRows.map((err) => (
            <p key={err.rowNumber} className="text-[11px]">
              • <strong>Baris {err.rowNumber}</strong> (SKU: {err.sku || 'Kosong'}): {err.errors.join(', ')}
            </p>
          ))}
        </div>
      )}
      {preview.validRows.length > 0 && (
        <ValidPreviewList
          rows={preview.validRows}
          canCommit={preview.invalidRows.length === 0}
          loading={loading}
          onCommit={onCommit}
        />
      )}
    </div>
  );
}

function ImportHeader() {
  return (
    <div className="border-b border-slate-100 pb-3">
      <h3 className="font-bold text-slate-900 text-sm">Impor Master Barang Massal (CSV / Format Excel)</h3>
      <p className="text-xs text-slate-500 mt-1">
        Tempelkan teks CSV dengan header: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">sku,barcode,name,category_code,unit_code,purchase_price,selling_price,min_stock</code>
      </p>
    </div>
  );
}

export function ImportCatalogView(): React.ReactElement {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [preview, setPreview] = useState<(ImportPreviewResult & { importedCount: number }) | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function runImport(commit: boolean) {
    setLoading(true); setFeedback(null);
    const res = await processCsvImportAction({ csvContent: csvText, commit });
    setLoading(false);
    if (!res.ok) return setFeedback({ text: res.message, ok: false });
    setPreview(res.data);
    if (commit && res.data.importedCount > 0) {
      setFeedback({ text: `Berhasil mengimpor ${res.data.importedCount} barang ke database gudang.`, ok: true });
    }
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4 shadow-sm border border-slate-200/80">
      <ImportHeader />
      <textarea
        rows={6} value={csvText} onChange={(e) => setCsvText(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" disabled={loading} onClick={() => runImport(false)}>
          {loading ? 'Memvalidasi...' : '1. Pratinjau & Validasi Baris'}
        </Button>
      </div>
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${feedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.ok ? '✓ ' : '✕ '} {feedback.text}
        </div>
      )}
      {preview && <ImportPreviewSection preview={preview} onCommit={() => runImport(true)} loading={loading} />}
    </Card>
  );
}
