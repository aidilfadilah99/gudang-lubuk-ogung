import React from 'react';
import {
  AuditLogTable,
  createAuditRepository,
  listAuditLogsUseCase,
} from '@/features/audit';
import { requireAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function AuditPage(): Promise<React.ReactElement> {
  const session = await requireAdmin();
  const { items, total } = await listAuditLogsUseCase(
    {
      warehouseId: session.warehouseId,
      actorRole: session.role,
      page: 1,
      pageSize: 50,
    },
    { auditRepo: createAuditRepository() }
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          Audit Log Keamanan & Jejak Perubahan ({total})
        </h2>
        <p className="text-xs text-slate-600">
          Rekaman lengkap siapa, tindakan apa, kapan, serta nilai sebelum dan
          sesudah
        </p>
      </div>
      <AuditLogTable logs={items} />
    </div>
  );
}
