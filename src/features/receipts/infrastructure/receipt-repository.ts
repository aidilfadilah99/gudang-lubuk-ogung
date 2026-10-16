import { and, count, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { toNumericString } from '@/shared/lib/format';
import {
  ReceiptItemLine,
  ReceiptRepositoryPort,
  StockReceiptDocument,
} from '../domain/receipt';
import {
  items,
  stockReceiptItems,
  stockReceipts,
  suppliers,
} from './schema';

async function loadLinesForReceiptIds(
  executor: DbExecutor,
  receiptIds: string[]
): Promise<Map<string, ReceiptItemLine[]>> {
  const map = new Map<string, ReceiptItemLine[]>();
  if (receiptIds.length === 0) return map;
  const rows = await executor
    .select({
      id: stockReceiptItems.id,
      receiptId: stockReceiptItems.receiptId,
      itemId: stockReceiptItems.itemId,
      itemName: items.name,
      sku: items.sku,
      quantity: stockReceiptItems.quantity,
      unitPurchasePrice: stockReceiptItems.unitPurchasePrice,
      subtotal: stockReceiptItems.subtotal,
    })
    .from(stockReceiptItems)
    .innerJoin(items, eq(stockReceiptItems.itemId, items.id))
    .where(inArray(stockReceiptItems.receiptId, receiptIds));

  for (const r of rows) {
    const list = map.get(r.receiptId) ?? [];
    list.push({
      id: r.id,
      itemId: r.itemId,
      itemName: r.itemName,
      sku: r.sku,
      quantity: Number(r.quantity),
      unitPurchasePrice: Number(r.unitPurchasePrice),
      subtotal: Number(r.subtotal),
    });
    map.set(r.receiptId, list);
  }
  return map;
}

async function insertReceiptAndLines(
  executor: DbExecutor,
  doc: StockReceiptDocument
): Promise<void> {
  await executor.insert(stockReceipts).values({
    id: doc.id,
    warehouseId: doc.warehouseId,
    receiptNumber: doc.receiptNumber,
    supplierId: doc.supplierId,
    invoiceNumber: doc.invoiceNumber,
    receiptDate: doc.receiptDate,
    status: doc.status,
    notes: doc.notes,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
  });

  for (const l of doc.lines) {
    await executor.insert(stockReceiptItems).values({
      id: l.id,
      receiptId: doc.id,
      itemId: l.itemId,
      quantity: toNumericString(l.quantity, 3),
      unitPurchasePrice: toNumericString(l.unitPurchasePrice, 2),
      subtotal: toNumericString(l.subtotal, 2),
    });
  }
}

async function findReceiptById(
  executor: DbExecutor,
  warehouseId: string,
  receiptId: string
): Promise<StockReceiptDocument | null> {
  const rows = await executor
    .select({ receipt: stockReceipts, supplierName: suppliers.name })
    .from(stockReceipts)
    .innerJoin(suppliers, eq(stockReceipts.supplierId, suppliers.id))
    .where(
      and(
        eq(stockReceipts.warehouseId, warehouseId),
        eq(stockReceipts.id, receiptId)
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const linesMap = await loadLinesForReceiptIds(executor, [receiptId]);
  return {
    ...row.receipt,
    supplierName: row.supplierName,
    status: row.receipt.status as 'POSTED' | 'VOIDED',
    lines: linesMap.get(receiptId) ?? [],
  };
}

async function queryReceiptsList(
  executor: DbExecutor,
  params: {
    warehouseId: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
    offset: number;
  }
): Promise<{ items: StockReceiptDocument[]; total: number }> {
  const filters = [eq(stockReceipts.warehouseId, params.warehouseId)];
  if (params.fromDate) filters.push(gte(stockReceipts.receiptDate, params.fromDate));
  if (params.toDate) filters.push(lte(stockReceipts.receiptDate, params.toDate));
  const whereClause = and(...filters);

  const rows = await executor
    .select({ receipt: stockReceipts, supplierName: suppliers.name })
    .from(stockReceipts)
    .innerJoin(suppliers, eq(stockReceipts.supplierId, suppliers.id))
    .where(whereClause)
    .orderBy(desc(stockReceipts.receiptDate))
    .limit(params.limit)
    .offset(params.offset);

  const totalRow = await executor
    .select({ value: count() })
    .from(stockReceipts)
    .where(whereClause);

  const linesMap = await loadLinesForReceiptIds(
    executor,
    rows.map((r) => r.receipt.id)
  );
  return {
    items: rows.map((r) => ({
      ...r.receipt,
      supplierName: r.supplierName,
      status: r.receipt.status as 'POSTED' | 'VOIDED',
      lines: linesMap.get(r.receipt.id) ?? [],
    })),
    total: Number(totalRow[0]?.value ?? 0),
  };
}

export function createReceiptRepository(
  executor: DbExecutor = getDb()
): ReceiptRepositoryPort {
  return {
    saveReceipt: (doc) => insertReceiptAndLines(executor, doc),
    findById: (whId, rId) => findReceiptById(executor, whId, rId),
    async markVoided(p) {
      await executor
        .update(stockReceipts)
        .set({
          status: 'VOIDED',
          voidReason: p.voidReason,
          voidedBy: p.voidedBy,
          voidedAt: p.voidedAt,
        })
        .where(
          and(
            eq(stockReceipts.warehouseId, p.warehouseId),
            eq(stockReceipts.id, p.receiptId)
          )
        );
    },
    listReceipts: (params) => queryReceiptsList(executor, params),
  };
}
