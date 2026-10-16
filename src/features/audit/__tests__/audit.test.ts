import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';
import { AuditLogEntry, AuditRepositoryPort } from '../domain/audit';
import { recordAuditLogUseCase } from '../application/record-audit-log';
import { listAuditLogsUseCase } from '../application/list-audit-logs';

function createFakeAuditRepo(): AuditRepositoryPort & { store: AuditLogEntry[] } {
  const store: AuditLogEntry[] = [];
  return {
    store,
    async save(entry) {
      store.push(entry);
    },
    async findMany({ warehouseId, limit, offset }) {
      const filtered = store.filter((x) => x.warehouseId === warehouseId);
      return {
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
      };
    },
  };
}

describe('Fitur Audit - Domain & Application', () => {
  it('mencatat entri audit dengan data sebelum dan sesudah', async () => {
    const repo = createFakeAuditRepo();
    const entry = await recordAuditLogUseCase(
      {
        warehouseId: 'wh_01',
        actorId: 'usr_1',
        actorUsername: 'admin',
        action: 'ITEM_UPDATE',
        entityType: 'ITEM',
        entityId: 'item_01',
        beforeData: { sellingPrice: 10000 },
        afterData: { sellingPrice: 12000 },
      },
      { auditRepo: repo }
    );
    expect(entry.actorUsername).toBe('admin');
    expect(repo.store).toHaveLength(1);
  });

  it('menolak Petugas Gudang saat mencoba membaca Audit Log', async () => {
    const repo = createFakeAuditRepo();
    await expect(
      listAuditLogsUseCase(
        {
          warehouseId: 'wh_01',
          actorRole: USER_ROLES.STAFF,
          page: 1,
          pageSize: 10,
        },
        { auditRepo: repo }
      )
    ).rejects.toThrow(TidakBerhakError);
  });
});
