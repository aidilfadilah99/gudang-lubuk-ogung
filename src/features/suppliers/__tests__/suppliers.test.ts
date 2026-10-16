import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';
import { SupplierRecord, SupplierRepositoryPort } from '../domain/supplier';
import { createSupplierUseCase } from '../application/manage-suppliers';

function createFakeSupplierRepo(): SupplierRepositoryPort & {
  list: SupplierRecord[];
} {
  const list: SupplierRecord[] = [];
  return {
    list,
    async listSuppliers() {
      return list;
    },
    async saveSupplier(s) {
      list.push(s);
    },
  };
}

describe('Fitur Suppliers - Master Data Pemasok', () => {
  it('menolak Petugas Gudang dan mengizinkan Admin menambah supplier', async () => {
    const repo = createFakeSupplierRepo();
    await expect(
      createSupplierUseCase(
        {
          warehouseId: 'wh_01',
          actorRole: USER_ROLES.STAFF,
          code: 'sup-10',
          name: 'CV Tani Subur',
        },
        { supplierRepo: repo }
      )
    ).rejects.toThrow(TidakBerhakError);

    const created = await createSupplierUseCase(
      {
        warehouseId: 'wh_01',
        actorRole: USER_ROLES.ADMIN,
        code: 'sup-10',
        name: 'CV Tani Subur',
      },
      { supplierRepo: repo }
    );
    expect(created.code).toBe('SUP-10');
    expect(repo.list).toHaveLength(1);
  });
});
