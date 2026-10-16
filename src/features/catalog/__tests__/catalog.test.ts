import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';
import { CatalogItemRecord, CatalogRepositoryPort } from '../domain/catalog';
import { createOrUpdateItemUseCase } from '../application/manage-items';

function createFakeCatalogRepo(): CatalogRepositoryPort & {
  items: CatalogItemRecord[];
} {
  const items: CatalogItemRecord[] = [];
  return {
    items,
    async listCategories() {
      return [];
    },
    async listUnits() {
      return [];
    },
    async listItems() {
      return { items, total: items.length };
    },
    async findItemById(_, id) {
      return items.find((x) => x.id === id) ?? null;
    },
    async saveItem(i) {
      items.push(i);
    },
    async updateItem(i) {
      const idx = items.findIndex((x) => x.id === i.id);
      if (idx >= 0) items[idx] = i;
    },
    async saveCategory() {},
    async saveUnit() {},
  };
}

describe('Fitur Catalog - Hak Akses Admin vs Petugas', () => {
  it('menolak Petugas Gudang saat mencoba mengubah master barang atau harga', async () => {
    const repo = createFakeCatalogRepo();
    await expect(
      createOrUpdateItemUseCase(
        {
          warehouseId: 'wh_01',
          actorRole: USER_ROLES.STAFF,
          input: {
            sku: 'PPK-99',
            name: 'Pupuk Uji',
            categoryId: 'cat_1',
            baseUnitId: 'unit_1',
            conversionFactor: 1,
            purchasePrice: 50000,
            sellingPrice: 60000,
            minStock: 5,
            isActive: true,
          },
        },
        { catalogRepo: repo }
      )
    ).rejects.toThrow(TidakBerhakError);
  });

  it('mengizinkan Admin membuat barang baru dan menormalisasi SKU huruf besar', async () => {
    const repo = createFakeCatalogRepo();
    const res = await createOrUpdateItemUseCase(
      {
        warehouseId: 'wh_01',
        actorRole: USER_ROLES.ADMIN,
        input: {
          sku: 'ppk-99',
          name: 'Pupuk Uji',
          categoryId: 'cat_1',
          baseUnitId: 'unit_1',
          conversionFactor: 1,
          purchasePrice: 50000,
          sellingPrice: 60000,
          minStock: 5,
          isActive: true,
        },
      },
      { catalogRepo: repo }
    );
    expect(res.item.sku).toBe('PPK-99');
    expect(repo.items).toHaveLength(1);
  });
});
