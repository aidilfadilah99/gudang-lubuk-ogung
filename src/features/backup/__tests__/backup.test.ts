import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';
import { BackupRepositoryPort } from '../domain/backup';
import { exportWarehouseBackupUseCase } from '../application/export-backup';

const fakeBackupRepo: BackupRepositoryPort = {
  async fetchAllWarehouseData(warehouseId) {
    return {
      warehouseId,
      exportedAtIso: '2026-10-16T00:00:00.000Z',
      categories: [{ id: 'cat_1', code: 'PPK', name: 'Pupuk' }],
      units: [],
      suppliers: [],
      items: [],
      receipts: [],
      issues: [],
      movements: [],
      adjustments: [],
    };
  },
};

describe('Fitur Backup - Ekspor SQL & CSV', () => {
  it('menolak Petugas Gudang dan mengizinkan Admin mengunduh SQL/CSV backup', async () => {
    await expect(
      exportWarehouseBackupUseCase(
        {
          warehouseId: 'wh_01',
          actorRole: USER_ROLES.STAFF,
          format: 'SQL',
        },
        { backupRepo: fakeBackupRepo }
      )
    ).rejects.toThrow(TidakBerhakError);

    const sqlRes = await exportWarehouseBackupUseCase(
      {
        warehouseId: 'wh_01',
        actorRole: USER_ROLES.ADMIN,
        format: 'SQL',
      },
      { backupRepo: fakeBackupRepo }
    );
    expect(sqlRes.content).toContain('INSERT INTO "categories"');

    const csvRes = await exportWarehouseBackupUseCase(
      {
        warehouseId: 'wh_01',
        actorRole: USER_ROLES.ADMIN,
        format: 'CSV',
      },
      { backupRepo: fakeBackupRepo }
    );
    expect(csvRes.content).toContain('# TABEL: categories');
  });
});
