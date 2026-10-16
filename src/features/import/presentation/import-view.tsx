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
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-700">Pratinjau Baris Valid:</p>
      <div className="space-y-1 text-xs">
        {rows.map((v) => (
          <div key={v.rowNumber} className="flex justify-between rounded-lg bg-slate-50 p-2">
            <span>
              Baris {v.rowNumber}: <strong>{v.sku}</strong> - {v.name} ({v.categoryCode}/{v.unitCode})
            </span>
            <span>
              Beli {formatRupiah(v.purchasePrice)} | Jual {formatRupiah(v.sellingPrice)}
            </span>
          </div>
        ))}
      </div>
      {canCommit && (
        <Button size="sm" disabled={loading} onClick={onCommit}>
          Konfirmasi & Simpan ke Database ({rows.length} Barang)
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
    <div className="space-y-3 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">Total Baris: {preview.totalRows}</Badge>
        <Badge variant="success">Valid: {preview.validRows.length}</Badge>
        <Badge variant={preview.invalidRows.length > 0 ? 'danger' : 'default'}>
          Error: {preview.invalidRows.length}
        </Badge>
      </div>
      {preview.invalidRows.length > 0 && (
        <div className="rounded-xl bg-red-50 p-3 space-y-1 text-xs text-red-900">
          <p className="font-bold">Daftar Error Per Baris (Perbaiki Sebelum Simpan):</p>
          {preview.invalidRows.map((err) => (
            <p key={err.rowNumber}>
              • <strong>Baris {err.rowNumber}</strong> (SKU: {err.sku}): {err.errors.join(', ')}
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

export function ImportCatalogView(): React.ReactElement {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [preview, setPreview] = useState<(ImportPreviewResult & { importedCount: number }) | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runImport(commit: boolean) {
    setLoading(true);
    setFeedback(null);
    const res = await processCsvImportAction({ csvContent: csvText, commit });
    setLoading(false);
    if (!res.ok) return setFeedback(`❌ ${res.message}`);
    setPreview(res.data);
    if (commit && res.data.importedCount > 0) {
      setFeedback(`✅ Berhasil mengimpor ${res.data.importedCount} barang ke database.`);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-900">Impor Master Barang (CSV / Excel) dengan Pratinjau</h3>
        <p className="text-xs text-slate-600">
          Kolom: <code>sku,barcode,name,category_code,unit_code,purchase_price,selling_price,min_stock</code>
        </p>
      </div>
      <textarea
        rows={6} value={csvText} onChange={(e) => setCsvText(e.target.value)}
        className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs"
      />
      <Button variant="secondary" size="sm" disabled={loading} onClick={() => runImport(false)}>
        1. Pratinjau & Cek Error Per Baris
      </Button>
      {feedback && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900">{feedback}</p>}
      {preview && <ImportPreviewSection preview={preview} onCommit={() => runImport(true)} loading={loading} />}
    </Card>
  );
}
