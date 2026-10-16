import React from 'react';
import { formatDateTimeWib } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { AuditLogEntry } from '../domain/audit';

function AuditRowCard({ log }: { log: AuditLogEntry }) {
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{log.action}</Badge>
          <span className="text-xs font-semibold text-slate-700">
            {log.entityType} #{log.entityId}
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {formatDateTimeWib(log.createdAt)} • oleh <strong>{log.actorUsername}</strong>
        </span>
      </div>
      {(log.beforeData || log.afterData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {log.beforeData && (
            <div className="rounded-lg bg-amber-50 p-2 text-amber-900 overflow-x-auto">
              <span className="font-bold block">Sebelum:</span>
              <code>{log.beforeData}</code>
            </div>
          )}
          {log.afterData && (
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-900 overflow-x-auto">
              <span className="font-bold block">Sesudah:</span>
              <code>{log.afterData}</code>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function AuditLogTable({
  logs,
}: {
  logs: AuditLogEntry[];
}): React.ReactElement {
  if (logs.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">Belum ada catatan audit log.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <AuditRowCard key={log.id} log={log} />
      ))}
    </div>
  );
}
