import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { DbExecutor, getDb } from '@/shared/db/client';
import { getLocalStore, isLocalMemoryMode } from '@/shared/db/local-store';
import { toNumericString } from '@/shared/lib/format';
import {
  ImportRepositoryPort,
  RawImportRow,
  ValidatedImportRow,
} from '../domain/import-parser';
import { categories, items, units } from './schema';

export async function parseExcelBufferToRawRows(
  buffer: Buffer
): Promise<RawImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: RawImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    rows.push({
      rowNumber,
      sku: String(row.getCell(1).text ?? '').trim(),
      barcode: String(row.getCell(2).text ?? '').trim(),
      name: String(row.getCell(3).text ?? '').trim(),
      categoryCode: String(row.getCell(4).text ?? '').trim(),
      unitCode: String(row.getCell(5).text ?? '').trim(),
      purchasePrice: row.getCell(6).text ?? '0',
      sellingPrice: row.getCell(7).text ?? '0',
      minStock: row.getCell(8).text ?? '0',
    });
  });
  return rows;
}

function upsertLocalBatchRows(
  warehouseId: string,
  rows: Array<ValidatedImportRow & { categoryId: string; baseUnitId: string }>
): number {
  const s = getLocalStore();
  for (const r of rows) {
    const existing = s.items.find(
      (i) => i.warehouseId === warehouseId && i.sku === r.sku
    );
    if (existing) {
      Object.assign(existing, {
        name: r.name, barcode: r.barcode, categoryId: r.categoryId,
        baseUnitId: r.baseUnitId, purchasePrice: r.purchasePrice,
        sellingPrice: r.sellingPrice, minStock: r.minStock,
      });
    } else {
      s.items.push({
        id: `item_${crypto.randomUUID()}`, warehouseId, sku: r.sku,
        barcode: r.barcode, name: r.name, categoryId: r.categoryId,
        baseUnitId: r.baseUnitId, secondaryUnitName: null, conversionFactor: 1,
        purchasePrice: r.purchasePrice, sellingPrice: r.sellingPrice,
        minStock: r.minStock, isActive: true,
      });
    }
  }
  return rows.length;
}

function createLocalImportRepository(): ImportRepositoryPort {
  return {
    async getCategoryAndUnitMaps(warehouseId) {
      const s = getLocalStore();
      return {
        categoryByCode: new Map(
          s.categories
            .filter((c) => c.warehouseId === warehouseId)
            .map((c) => [c.code.toUpperCase(), c.id])
        ),
        unitByCode: new Map(
          s.units
            .filter((u) => u.warehouseId === warehouseId)
            .map((u) => [u.code.toUpperCase(), u.id])
        ),
      };
    },
    upsertImportedItems: async (whId, rows) => upsertLocalBatchRows(whId, rows),
  };
}

async function upsertBatchRows(
  executor: DbExecutor,
  warehouseId: string,
  rows: Array<ValidatedImportRow & { categoryId: string; baseUnitId: string }>
): Promise<number> {
  let count = 0;
  for (const r of rows) {
    await executor
      .insert(items)
      .values({
        id: `item_${crypto.randomUUID()}`,
        warehouseId,
        sku: r.sku,
        barcode: r.barcode,
        name: r.name,
        categoryId: r.categoryId,
        baseUnitId: r.baseUnitId,
        purchasePrice: toNumericString(r.purchasePrice, 2),
        sellingPrice: toNumericString(r.sellingPrice, 2),
        minStock: toNumericString(r.minStock, 3),
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [items.warehouseId, items.sku],
        set: {
          name: r.name,
          barcode: r.barcode,
          categoryId: r.categoryId,
          baseUnitId: r.baseUnitId,
          purchasePrice: toNumericString(r.purchasePrice, 2),
          sellingPrice: toNumericString(r.sellingPrice, 2),
          minStock: toNumericString(r.minStock, 3),
          updatedAt: new Date(),
        },
      });
    count += 1;
  }
  return count;
}

export function createImportRepository(
  executor: DbExecutor = getDb()
): ImportRepositoryPort {
  if (isLocalMemoryMode()) return createLocalImportRepository();
  return {
    async getCategoryAndUnitMaps(warehouseId: string) {
      const [catRows, unitRows] = await Promise.all([
        executor
          .select({ id: categories.id, code: categories.code })
          .from(categories)
          .where(eq(categories.warehouseId, warehouseId)),
        executor
          .select({ id: units.id, code: units.code })
          .from(units)
          .where(eq(units.warehouseId, warehouseId)),
      ]);
      return {
        categoryByCode: new Map(
          catRows.map((c) => [c.code.toUpperCase(), c.id])
        ),
        unitByCode: new Map(unitRows.map((u) => [u.code.toUpperCase(), u.id])),
      };
    },
    upsertImportedItems: (whId, rows) => upsertBatchRows(executor, whId, rows),
  };
}
