import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';
import { AuditLogEntry, AuditRepositoryPort } from '../domain/audit';

export interface ListAuditLogsInput {
  warehouseId: string;
  actorRole: UserRole;
  entityType?: string;
  page: number;
  pageSize: number;
}

export async function listAuditLogsUseCase(
  input: ListAuditLogsInput,
  deps: { auditRepo: AuditRepositoryPort }
): Promise<{ items: AuditLogEntry[]; total: number }> {
  if (input.actorRole !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError('Hanya Admin yang dapat melihat Audit Log.');
  }
  const offset = (input.page - 1) * input.pageSize;
  return deps.auditRepo.findMany({
    warehouseId: input.warehouseId,
    entityType: input.entityType,
    limit: input.pageSize,
    offset,
  });
}
