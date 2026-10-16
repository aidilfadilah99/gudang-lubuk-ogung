import React from 'react';
import { BackupView } from '@/features/backup';
import { requireAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function BackupPage(): Promise<React.ReactElement> {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Backup & Ekspor Data Gudang (Khusus Admin)
        </h2>
        <p className="text-xs text-slate-600">
          Simpan cadangan seluruh tabel gudang KDKMP Lubuk Ogung
        </p>
      </div>
      <BackupView />
    </div>
  );
}
