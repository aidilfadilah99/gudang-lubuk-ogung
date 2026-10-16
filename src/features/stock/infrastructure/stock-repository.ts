import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { isLocalMemoryMode } from '@/shared/db/local-store';
import { DataTidakDitemukanError } from '@/shared/lib/errors';
import { toNumericString } from '@/shared/lib/format';
import {
  evaluateStockAlertStatus,
  MovementType,
  ReferenceType,
  StockMovementRecord,
  StockRepositoryPort,
  StockSummaryItem,
} from '../domain/ledger';
import { createLocalStockRepository } from './local-stock-repository';
import {
  categories,
  items,
  stockAdjustments,
  stockMovements,
  units,
} from './schema';

async function lockAndFetchBalance(
  executor: DbExecutor,
  warehouseId: string,
  itemId: string
): Promise<{ itemName: string; currentBalance: number }> {
  await executor.execute(
    sql`SELECT id FROM items WHERE id = ${itemId} AND warehouse_id = ${warehouseId} FOR UPDATE`
  );
  const itemRows = await executor
    .select({ id: items.id, name: items.name })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.warehouseId, warehouseId)))
    .limit(1);
  const item = itemRows[0];
  if (!item) throw new DataTidakDitemukanError('Barang');

  const sumRows = await executor
    .select({
      balance: sql<string>`COALESCE(SUM(${stockMovements.quantityChange}), 0)`,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.warehouseId, warehouseId),
        eq(stockMovements.itemId, itemId)
      )
    );
  return { itemName: item.name, currentBalance: Number(sumRows[0]?.balance ?? 0) };
}

async function fetchRawStockRows(
  executor: DbExecutor,
  warehouseId: string,
  search?: string,
  categoryId?: string
) {
  const filters = [eq(items.warehouseId, warehouseId), eq(items.isActive, true)];
  if (categoryId) filters.push(eq(items.categoryId, categoryId));
  if (search) {
    const q = `%${search.trim()}%`;
    filters.push(
      or(ilike(items.name, q), ilike(items.sku, q), ilike(items.barcode, q))!
    );
  }
  return executor
    .select({
      itemId: items.id,
      sku: items.sku,
      barcode: items.barcode,
      name: items.name,
      categoryId: items.categoryId,
      categoryName: categories.name,
      unitCode: units.code,
      purchasePrice: items.purchasePrice,
      sellingPrice: items.sellingPrice,
      minStock: items.minStock,
      currentBalance: sql<string>`COALESCE(SUM(${stockMovements.quantityChange}), 0)`,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .innerJoin(units, eq(items.baseUnitId, units.id))
    .leftJoin(stockMovements, eq(items.id, stockMovements.itemId))
    .where(and(...filters))
    .groupBy(items.id, categories.name, units.code)
    .orderBy(items.name);
}

async function queryCurrentStockList(
  executor: DbExecutor,
  params: {
    warehouseId: string; search?: string; categoryId?: string;
    onlyLowStock?: boolean; limit: number; offset: number;
  }
): Promise<{ items: StockSummaryItem[]; total: number }> {
  const rows = await fetchRawStockRows(executor, params.warehouseId, params.search, params.categoryId);
  const mapped: StockSummaryItem[] = rows.map((r) => {
    const bal = Number(r.currentBalance);
    const min = Number(r.minStock);
    return {
      itemId: r.itemId, sku: r.sku, barcode: r.barcode, name: r.name,
      categoryId: r.categoryId, categoryName: r.categoryName, unitCode: r.unitCode,
      purchasePrice: Number(r.purchasePrice), sellingPrice: Number(r.sellingPrice),
      minStock: min, currentBalance: bal, alertStatus: evaluateStockAlertStatus(bal, min),
    };
  });
  const filtered = params.onlyLowStock ? mapped.filter((x) => x.alertStatus !== 'AMAN') : mapped;
  return {
    items: filtered.slice(params.offset, params.offset + params.limit),
    total: filtered.length,
  };
}

async function fetchItemMovements(
  executor: DbExecutor,
  params: { warehouseId: string; itemId: string; limit: number; offset: number }
) {
  const whereClause = and(
    eq(stockMovements.warehouseId, params.warehouseId),
    eq(stockMovements.itemId, params.itemId)
  );
  const rows = await executor
    .select()
    .from(stockMovements)
    .where(whereClause)
    .orderBy(desc(stockMovements.createdAt))
    .limit(params.limit)
    .offset(params.offset);
  const totalRow = await executor
    .select({ value: count() })
    .from(stockMovements)
    .where(whereClause);
  return {
    movements: rows.map((r) => ({
      ...r,
      movementType: r.movementType as MovementType,
      referenceType: r.referenceType as ReferenceType,
      quantityChange: Number(r.quantityChange),
      balanceAfter: Number(r.balanceAfter),
      unitCost: Number(r.unitCost),
    })),
    total: Number(totalRow[0]?.value ?? 0),
  };
}

export function createStockRepository(
  executor: DbExecutor = getDb()
): StockRepositoryPort {
  if (isLocalMemoryMode()) return createLocalStockRepository();
  return {
    lockItemAndGetBalance: (whId, itemId) =>
      lockAndFetchBalance(executor, whId, itemId),
    async insertMovement(m: StockMovementRecord): Promise<void> {
      await executor.insert(stockMovements).values({
        ...m,
        quantityChange: toNumericString(m.quantityChange, 3),
        balanceAfter: toNumericString(m.balanceAfter, 3),
        unitCost: toNumericString(m.unitCost, 2),
      });
    },
    async insertAdjustment(p): Promise<void> {
      await executor.insert(stockAdjustments).values({
        ...p,
        quantityDelta: toNumericString(p.quantityDelta, 3),
      });
    },
    listCurrentStock: (params) => queryCurrentStockList(executor, params),
    getItemMovements: (params) => fetchItemMovements(executor, params),
  };
}
