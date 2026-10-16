'use client';

import React from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

export function BackupView(): React.ReactElement {
  function downloadBackup(format: 'SQL' | 'CSV') {
    window.open(`/api/backup?format=${format}`, '_blank');
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4 shadow-sm border border-slate-200/80">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            Cadangan Mandiri Seluruh Database Gudang (Hak Khusus Admin)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Unduh salinan lengkap seluruh tabel master barang, riwayat barang masuk/keluar, dan ledger mutasi stok ke perangkat lokal Anda tanpa ketergantungan pihak ketiga.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => downloadBackup('SQL')} className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Unduh Format SQL (.sql)</span>
        </Button>
        <Button variant="secondary" onClick={() => downloadBackup('CSV')} className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Unduh Arsip CSV (.csv)</span>
        </Button>
      </div>
    </Card>
  );
}
