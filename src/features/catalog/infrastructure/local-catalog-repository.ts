import { getLocalStore, LocalItemRow } from '@/shared/db/local-store';
import {
  CatalogItemRecord,
  CatalogRepositoryPort,
} from '../domain/catalog';

function toCatalogRecord(i: LocalItemRow): CatalogItemRecord {
  const s = getLocalStore();
  const cat = s.categories.find((c) => c.id === i.categoryId);
  const unit = s.units.find((u) => u.id === i.baseUnitId);
  return {
    ...i,
    categoryName: cat?.name,
    unitCode: unit?.code,
  };
}

function listLocalCatalogItems(params: {
  warehouseId: string;
  search?: string;
  categoryId?: string;
  limit: number;
  offset: number;
}) {
  const q = params.search?.trim().toLowerCase() ?? '';
  const filtered = getLocalStore()
    .items.filter(
      (i) =>
        i.warehouseId === params.warehouseId &&
        (!params.categoryId || i.categoryId === params.categoryId) &&
        (!q ||
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          (i.barcode ?? '').toLowerCase().includes(q))
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(toCatalogRecord);
  return {
    items: filtered.slice(params.offset, params.offset + params.limit),
    total: filtered.length,
  };
}

export function createLocalCatalogRepository(): CatalogRepositoryPort {
  return {
    async listCategories(whId) {
      return getLocalStore()
        .categories.filter((c) => c.warehouseId === whId)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async listUnits(whId) {
      return getLocalStore()
        .units.filter((u) => u.warehouseId === whId)
        .sort((a, b) => a.code.localeCompare(b.code));
    },
    listItems: async (params) => listLocalCatalogItems(params),
    async findItemById(whId, itemId) {
      const item = getLocalStore().items.find(
        (i) => i.warehouseId === whId && i.id === itemId
      );
      return item ? toCatalogRecord(item) : null;
    },
    async saveItem(item) {
      getLocalStore().items.push({ ...item });
    },
    async updateItem(item) {
      const idx = getLocalStore().items.findIndex(
        (i) => i.warehouseId === item.warehouseId && i.id === item.id
      );
      if (idx >= 0) getLocalStore().items[idx] = { ...item };
    },
    async saveCategory(cat) {
      getLocalStore().categories.push({ ...cat });
    },
    async saveUnit(unit) {
      getLocalStore().units.push({ ...unit });
    },
  };
}
