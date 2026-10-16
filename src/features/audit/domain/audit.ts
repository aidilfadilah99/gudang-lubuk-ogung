export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_PASSWORD_CHANGE'
  | 'USER_CREATE'
  | 'USER_STATUS_CHANGE'
  | 'USER_PASSWORD_RESET'
  | 'ITEM_CREATE'
  | 'ITEM_UPDATE'
  | 'ITEM_IMPORT'
  | 'SUPPLIER_CREATE'
  | 'RECEIPT_CREATE'
  | 'RECEIPT_VOID'
  | 'ISSUE_CREATE'
  | 'ISSUE_VOID'
  | 'STOCK_ADJUSTMENT'
  | 'DATA_BACKUP';

export interface AuditLogEntry {
  id: string;
  warehouseId: string;
  actorId: string;
  actorUsername: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeData: string | null;
  afterData: string | null;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  warehouseId: string;
  actorId: string;
  actorUsername: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
}

export interface AuditRepositoryPort {
  save(entry: AuditLogEntry): Promise<void>;
  findMany(params: {
    warehouseId: string;
    entityType?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: AuditLogEntry[]; total: number }>;
}

export function buildAuditEntry(
  id: string,
  input: CreateAuditLogInput,
  now: Date
): AuditLogEntry {
  return {
    id,
    warehouseId: input.warehouseId,
    actorId: input.actorId,
    actorUsername: input.actorUsername,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    beforeData:
      input.beforeData !== undefined ? JSON.stringify(input.beforeData) : null,
    afterData:
      input.afterData !== undefined ? JSON.stringify(input.afterData) : null,
    createdAt: now,
  };
}
