import React from 'react';
import { formatDateTimeWib } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { AuditLogEntry } from '../domain/audit';

function getActionBadgeVariant(action: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (action.includes('CREATE') || action.includes('LOGIN')) return 'success';
  if (action.includes('VOID') || action.includes('DELETE')) return 'danger';
  if (action.includes('ADJUST') || action.includes('UPDATE')) return 'warning';
  return 'info';
}

function AuditRowCard({ log }: { log: AuditLogEntry }) {
  const variant = getActionBadgeVariant(log.action);
  return (
    <Card className="p-4 space-y-2.5 hover:shadow-sm transition-all border border-slate-200/80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={variant} withDot>{log.action}</Badge>
          <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
            {log.entityType} #{log.entityId}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {formatDateTimeWib(log.createdAt)} • oleh <strong className="text-slate-800 font-mono">@{log.actorUsername}</strong>
        </span>
      </div>
      {(log.beforeData || log.afterData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
          {log.beforeData && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-2.5 text-amber-950 overflow-x-auto font-mono text-[11px]">
              <span className="font-bold font-sans text-amber-900 block mb-1">Kondisi Sebelumnya:</span>
              <pre className="whitespace-pre-wrap break-all">{log.beforeData}</pre>
            </div>
          )}
          {log.afterData && (
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-2.5 text-emerald-950 overflow-x-auto font-mono text-[11px]">
              <span className="font-bold font-sans text-emerald-900 block mb-1">Kondisi Sesudahnya:</span>
              <pre className="whitespace-pre-wrap break-all">{log.afterData}</pre>
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
      <Card className="p-8 text-center border-dashed border-2 border-slate-200">
        <p className="text-sm font-bold text-slate-700">Belum ada jejak audit log</p>
        <p className="text-xs text-slate-500 mt-1">Setiap tindakan penting di sistem terekam permanen untuk kepatuhan tata kelola koperasi.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2.5">
      {logs.map((log) => (
        <AuditRowCard key={log.id} log={log} />
      ))}
    </div>
  );
}
