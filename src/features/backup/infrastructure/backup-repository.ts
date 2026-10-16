import { eq } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { getLocalStore, isLocalMemoryMode } from '@/shared/db/local-store';
import {
  BackupRepositoryPort,
  WarehouseFullBackupData,
} from '../domain/backup';
import {
  categories,
  items,
  stockAdjustments,
  stockIssues,
  stockMovements,
  stockReceipts,
  suppliers,
  units,
} from './schema';

function createLocalBackupRepository(): BackupRepositoryPort {
  return {
    async fetchAllWarehouseData(warehouseId: string): Promise<WarehouseFullBackupData> {
      const s = getLocalStore();
      return {
        warehouseId,
        exportedAtIso: new Date().toISOString(),
        categories: s.categories.map((x) => ({ ...x })),
        units: s.units.map((x) => ({ ...x })),
        suppliers: s.suppliers.map((x) => ({ ...x })),
        items: s.items.map((x) => ({ ...x })),
        receipts: s.receipts.map((x) => ({ ...x })),
        issues: s.issues.map((x) => ({ ...x })),
        movements: s.movements.map((x) => ({ ...x })),
        adjustments: s.adjustments,
      };
    },
  };
}

async function fetchMasterBackupTables(
  executor: DbExecutor,
  warehouseId: string
) {
  const [catRows, unitRows, supRows, itemRows] = await Promise.all([
    executor
      .select()
      .from(categories)
      .where(eq(categories.warehouseId, warehouseId)),
    executor.select().from(units).where(eq(units.warehouseId, warehouseId)),
    executor
      .select()
      .from(suppliers)
      .where(eq(suppliers.warehouseId, warehouseId)),
    executor.select().from(items).where(eq(items.warehouseId, warehouseId)),
  ]);
  return { catRows, unitRows, supRows, itemRows };
}

async function fetchTransactionBackupTables(
  executor: DbExecutor,
  warehouseId: string
) {
  const [rcpRows, issRows, movRows, adjRows] = await Promise.all([
    executor
      .select()
      .from(stockReceipts)
      .where(eq(stockReceipts.warehouseId, warehouseId)),
    executor
      .select()
      .from(stockIssues)
      .where(eq(stockIssues.warehouseId, warehouseId)),
    executor
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.warehouseId, warehouseId)),
    executor
      .select()
      .from(stockAdjustments)
      .where(eq(stockAdjustments.warehouseId, warehouseId)),
  ]);
  return { rcpRows, issRows, movRows, adjRows };
}

export function createBackupRepository(
  executor: DbExecutor = getDb()
): BackupRepositoryPort {
  if (isLocalMemoryMode()) return createLocalBackupRepository();
  return {
    async fetchAllWarehouseData(
      warehouseId: string
    ): Promise<WarehouseFullBackupData> {
      const [m, t] = await Promise.all([
        fetchMasterBackupTables(executor, warehouseId),
        fetchTransactionBackupTables(executor, warehouseId),
      ]);
      return {
        warehouseId,
        exportedAtIso: new Date().toISOString(),
        categories: m.catRows,
        units: m.unitRows,
        suppliers: m.supRows,
        items: m.itemRows,
        receipts: t.rcpRows,
        issues: t.issRows,
        movements: t.movRows,
        adjustments: t.adjRows,
      };
    },
  };
}
