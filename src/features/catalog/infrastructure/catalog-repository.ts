import { and, asc, count, eq, ilike, or } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { toNumericString } from '@/shared/lib/format';
import {
  CatalogItemRecord,
  CatalogRepositoryPort,
} from '../domain/catalog';
import { categories, items, units } from './schema';

function mapItemRow(r: {
  item: typeof items.$inferSelect;
  categoryName?: string;
  unitCode?: string;
}): CatalogItemRecord {
  return {
    id: r.item.id,
    warehouseId: r.item.warehouseId,
    sku: r.item.sku,
    barcode: r.item.barcode,
    name: r.item.name,
    categoryId: r.item.categoryId,
    categoryName: r.categoryName,
    baseUnitId: r.item.baseUnitId,
    unitCode: r.unitCode,
    secondaryUnitName: r.item.secondaryUnitName,
    conversionFactor: Number(r.item.conversionFactor),
    purchasePrice: Number(r.item.purchasePrice),
    sellingPrice: Number(r.item.sellingPrice),
    minStock: Number(r.item.minStock),
    isActive: r.item.isActive,
  };
}

async function queryCatalogItems(
  executor: DbExecutor,
  params: { warehouseId: string; search?: string; categoryId?: string; limit: number; offset: number }
) {
  const filters = [eq(items.warehouseId, params.warehouseId)];
  if (params.categoryId) filters.push(eq(items.categoryId, params.categoryId));
  if (params.search) {
    const q = `%${params.search.trim()}%`;
    filters.push(or(ilike(items.name, q), ilike(items.sku, q), ilike(items.barcode, q))!);
  }
  const whereClause = and(...filters);
  const rows = await executor
    .select({ item: items, categoryName: categories.name, unitCode: units.code })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .innerJoin(units, eq(items.baseUnitId, units.id))
    .where(whereClause)
    .orderBy(asc(items.name))
    .limit(params.limit)
    .offset(params.offset);
  const totalRow = await executor.select({ value: count() }).from(items).where(whereClause);
  return { items: rows.map(mapItemRow), total: Number(totalRow[0]?.value ?? 0) };
}

async function insertCatalogItem(executor: DbExecutor, item: CatalogItemRecord): Promise<void> {
  await executor.insert(items).values({
    id: item.id, warehouseId: item.warehouseId, sku: item.sku, barcode: item.barcode,
    name: item.name, categoryId: item.categoryId, baseUnitId: item.baseUnitId,
    secondaryUnitName: item.secondaryUnitName,
    conversionFactor: toNumericString(item.conversionFactor, 3),
    purchasePrice: toNumericString(item.purchasePrice, 2),
    sellingPrice: toNumericString(item.sellingPrice, 2),
    minStock: toNumericString(item.minStock, 3),
    isActive: item.isActive,
  });
}

async function modifyCatalogItem(executor: DbExecutor, item: CatalogItemRecord): Promise<void> {
  await executor
    .update(items)
    .set({
      sku: item.sku, barcode: item.barcode, name: item.name, categoryId: item.categoryId,
      baseUnitId: item.baseUnitId, secondaryUnitName: item.secondaryUnitName,
      conversionFactor: toNumericString(item.conversionFactor, 3),
      purchasePrice: toNumericString(item.purchasePrice, 2),
      sellingPrice: toNumericString(item.sellingPrice, 2),
      minStock: toNumericString(item.minStock, 3),
      isActive: item.isActive, updatedAt: new Date(),
    })
    .where(and(eq(items.warehouseId, item.warehouseId), eq(items.id, item.id)));
}

export function createCatalogRepository(executor: DbExecutor = getDb()): CatalogRepositoryPort {
  return {
    listCategories: (whId) =>
      executor.select().from(categories).where(eq(categories.warehouseId, whId)).orderBy(asc(categories.name)),
    listUnits: (whId) =>
      executor.select().from(units).where(eq(units.warehouseId, whId)).orderBy(asc(units.code)),
    listItems: (params) => queryCatalogItems(executor, params),
    async findItemById(whId, itemId) {
      const rows = await executor
        .select({ item: items })
        .from(items)
        .where(and(eq(items.warehouseId, whId), eq(items.id, itemId)))
        .limit(1);
      return rows[0] ? mapItemRow(rows[0]) : null;
    },
    saveItem: (item) => insertCatalogItem(executor, item),
    updateItem: (item) => modifyCatalogItem(executor, item),
    saveCategory: async (cat) => { await executor.insert(categories).values(cat); },
    saveUnit: async (unit) => { await executor.insert(units).values(unit); },
  };
}
