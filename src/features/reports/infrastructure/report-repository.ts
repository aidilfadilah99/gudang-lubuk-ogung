import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { isLocalMemoryMode } from '@/shared/db/local-store';
import { ReportDataPort } from '../domain/report';
import { createLocalReportRepository } from './local-report-repository';
import {
  categories,
  items,
  stockIssueItems,
  stockIssues,
  stockMovements,
  stockReceiptItems,
  stockReceipts,
  suppliers,
  units,
} from './schema';

async function queryStockAsOf(
  executor: DbExecutor,
  warehouseId: string,
  asOfDate: Date
) {
  const rows = await executor
    .select({
      sku: items.sku,
      name: items.name,
      categoryName: categories.name,
      unitCode: units.code,
      minStock: items.minStock,
      sellingPrice: items.sellingPrice,
      balance: sql<string>`COALESCE(SUM(CASE WHEN ${stockMovements.createdAt} <= ${asOfDate} THEN ${stockMovements.quantityChange} ELSE 0 END), 0)`,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .innerJoin(units, eq(items.baseUnitId, units.id))
    .leftJoin(stockMovements, eq(items.id, stockMovements.itemId))
    .where(and(eq(items.warehouseId, warehouseId), eq(items.isActive, true)))
    .groupBy(items.id, categories.name, units.code)
    .orderBy(asc(items.sku));

  return rows.map((r) => ({
    sku: r.sku,
    name: r.name,
    categoryName: r.categoryName,
    unitCode: r.unitCode,
    balance: Number(r.balance),
    minStock: Number(r.minStock),
    sellingPrice: Number(r.sellingPrice),
  }));
}

async function queryReceiptsPeriod(
  executor: DbExecutor,
  warehouseId: string,
  from: Date,
  to: Date
) {
  const rows = await executor
    .select({
      receiptNumber: stockReceipts.receiptNumber,
      receiptDate: stockReceipts.receiptDate,
      supplierName: suppliers.name,
      invoiceNumber: stockReceipts.invoiceNumber,
      sku: items.sku,
      itemName: items.name,
      quantity: stockReceiptItems.quantity,
      unitPrice: stockReceiptItems.unitPurchasePrice,
      subtotal: stockReceiptItems.subtotal,
      status: stockReceipts.status,
    })
    .from(stockReceiptItems)
    .innerJoin(stockReceipts, eq(stockReceiptItems.receiptId, stockReceipts.id))
    .innerJoin(suppliers, eq(stockReceipts.supplierId, suppliers.id))
    .innerJoin(items, eq(stockReceiptItems.itemId, items.id))
    .where(
      and(
        eq(stockReceipts.warehouseId, warehouseId),
        gte(stockReceipts.receiptDate, from),
        lte(stockReceipts.receiptDate, to)
      )
    )
    .orderBy(desc(stockReceipts.receiptDate));

  return rows.map((r) => ({
    ...r,
    quantity: Number(r.quantity),
    unitPrice: Number(r.unitPrice),
    subtotal: Number(r.subtotal),
  }));
}

async function queryIssuesPeriod(
  executor: DbExecutor,
  warehouseId: string,
  from: Date,
  to: Date
) {
  const rows = await executor
    .select({
      issueNumber: stockIssues.issueNumber,
      issueDate: stockIssues.issueDate,
      destinationType: stockIssues.destinationType,
      recipientName: stockIssues.recipientName,
      sku: items.sku,
      itemName: items.name,
      quantity: stockIssueItems.quantity,
      unitPrice: stockIssueItems.unitSellingPrice,
      subtotal: stockIssueItems.subtotal,
      status: stockIssues.status,
    })
    .from(stockIssueItems)
    .innerJoin(stockIssues, eq(stockIssueItems.issueId, stockIssues.id))
    .innerJoin(items, eq(stockIssueItems.itemId, items.id))
    .where(
      and(
        eq(stockIssues.warehouseId, warehouseId),
        gte(stockIssues.issueDate, from),
        lte(stockIssues.issueDate, to)
      )
    )
    .orderBy(desc(stockIssues.issueDate));

  return rows.map((r) => ({
    ...r,
    quantity: Number(r.quantity),
    unitPrice: Number(r.unitPrice),
    subtotal: Number(r.subtotal),
  }));
}

export function createReportRepository(
  executor: DbExecutor = getDb()
): ReportDataPort {
  if (isLocalMemoryMode()) return createLocalReportRepository();
  return {
    fetchStockAsOf: (whId, asOf) => queryStockAsOf(executor, whId, asOf),
    fetchReceiptsByPeriod: (whId, from, to) =>
      queryReceiptsPeriod(executor, whId, from, to),
    fetchIssuesByPeriod: (whId, from, to) =>
      queryIssuesPeriod(executor, whId, from, to),
    async fetchStockCard(warehouseId, itemId) {
      const rows = await executor
        .select()
        .from(stockMovements)
        .where(
          and(
            eq(stockMovements.warehouseId, warehouseId),
            eq(stockMovements.itemId, itemId)
          )
        )
        .orderBy(asc(stockMovements.createdAt));
      return rows.map((r) => ({
        createdAt: r.createdAt,
        movementType: r.movementType,
        referenceNumber: r.referenceNumber,
        quantityChange: Number(r.quantityChange),
        balanceAfter: Number(r.balanceAfter),
        notes: r.notes,
      }));
    },
  };
}
