import { and, count, desc, eq } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { getLocalStore, isLocalMemoryMode } from '@/shared/db/local-store';
import { TransaksiDuplikatError } from '@/shared/lib/errors';
import {
  AuditAction,
  AuditLogEntry,
  AuditRepositoryPort,
} from '../domain/audit';
import { auditLogs, idempotencyKeys } from './schema';

function createLocalAuditRepository(): AuditRepositoryPort {
  return {
    async save(entry: AuditLogEntry): Promise<void> {
      getLocalStore().auditLogs.unshift({ ...entry });
    },
    async findMany(params) {
      const filtered = getLocalStore().auditLogs.filter(
        (l) =>
          l.warehouseId === params.warehouseId &&
          (!params.entityType || l.entityType === params.entityType)
      );
      return {
        items: filtered
          .slice(params.offset, params.offset + params.limit)
          .map((r) => ({ ...r, action: r.action as AuditAction })),
        total: filtered.length,
      };
    },
  };
}

async function queryAuditLogs(
  executor: DbExecutor,
  params: { warehouseId: string; entityType?: string; limit: number; offset: number }
) {
  const filters = [eq(auditLogs.warehouseId, params.warehouseId)];
  if (params.entityType) filters.push(eq(auditLogs.entityType, params.entityType));
  const whereClause = and(...filters);
  const rows = await executor
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(params.limit)
    .offset(params.offset);
  const totalRows = await executor
    .select({ value: count() })
    .from(auditLogs)
    .where(whereClause);

  return {
    items: rows.map((r) => ({ ...r, action: r.action as AuditAction })),
    total: Number(totalRows[0]?.value ?? 0),
  };
}

export function createAuditRepository(
  executor: DbExecutor = getDb()
): AuditRepositoryPort {
  if (isLocalMemoryMode()) return createLocalAuditRepository();
  return {
    async save(entry: AuditLogEntry): Promise<void> {
      await executor.insert(auditLogs).values({
        id: entry.id,
        warehouseId: entry.warehouseId,
        actorId: entry.actorId,
        actorUsername: entry.actorUsername,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        beforeData: entry.beforeData,
        afterData: entry.afterData,
        createdAt: entry.createdAt,
      });
    },
    findMany: (params) => queryAuditLogs(executor, params),
  };
}

export async function claimIdempotencyKey(
  tx: DbExecutor,
  params: { key: string; warehouseId: string; actorId: string; operation: string }
): Promise<void> {
  if (isLocalMemoryMode()) {
    const keys = getLocalStore().idempotencyKeys;
    if (keys.has(params.key)) throw new TransaksiDuplikatError();
    keys.add(params.key);
    return;
  }
  const existing = await tx
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, params.key))
    .limit(1);
  if (existing.length > 0) throw new TransaksiDuplikatError();

  await tx.insert(idempotencyKeys).values({
    key: params.key,
    warehouseId: params.warehouseId,
    actorId: params.actorId,
    operation: params.operation,
    responsePayload: 'CLAIMED',
  });
}
