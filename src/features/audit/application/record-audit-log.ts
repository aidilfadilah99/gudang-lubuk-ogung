import crypto from 'node:crypto';
import {
  AuditLogEntry,
  AuditRepositoryPort,
  buildAuditEntry,
  CreateAuditLogInput,
} from '../domain/audit';

export interface RecordAuditDependencies {
  auditRepo: AuditRepositoryPort;
  now?: () => Date;
  generateId?: () => string;
}

export async function recordAuditLogUseCase(
  input: CreateAuditLogInput,
  deps: RecordAuditDependencies
): Promise<AuditLogEntry> {
  const id = deps.generateId ? deps.generateId() : `aud_${crypto.randomUUID()}`;
  const now = deps.now ? deps.now() : new Date();
  const entry = buildAuditEntry(id, input, now);
  await deps.auditRepo.save(entry);
  return entry;
}
