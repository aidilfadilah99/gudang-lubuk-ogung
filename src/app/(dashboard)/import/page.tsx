import React from 'react';
import { ImportCatalogView } from '@/features/import';
import { requireAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function ImportPage(): Promise<React.ReactElement> {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Impor Barang dari Excel / CSV (Khusus Admin)
        </h2>
        <p className="text-xs text-slate-600">
          Pratinjau otomatis dan pemeriksaan kesalahan format per baris
        </p>
      </div>
      <ImportCatalogView />
    </div>
  );
}
