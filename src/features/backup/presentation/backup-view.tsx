'use client';

import React from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

export function BackupView(): React.ReactElement {
  function downloadBackup(format: 'SQL' | 'CSV') {
    window.open(`/api/backup?format=${format}`, '_blank');
  }

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="font-bold text-slate-900">
          Backup Mandiri Seluruh Data Gudang (Khusus Admin)
        </h3>
        <p className="text-xs text-slate-600">
          Unduh salinan lengkap seluruh tabel master, dokumen masuk/keluar, dan
          ledger kartu stok ke perangkat Anda sebagai cadangan berkala.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => downloadBackup('SQL')}>
          Unduh Backup SQL (.sql)
        </Button>
        <Button variant="secondary" onClick={() => downloadBackup('CSV')}>
          Unduh Backup Arsip CSV (.csv)
        </Button>
      </div>
    </Card>
  );
}
