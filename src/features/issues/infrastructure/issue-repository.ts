import { and, count, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { toNumericString } from '@/shared/lib/format';
import {
  IssueDestinationType,
  IssueItemLine,
  IssueRepositoryPort,
  StockIssueDocument,
} from '../domain/issue';
import { items, stockIssueItems, stockIssues } from './schema';

async function loadLinesForIssueIds(
  executor: DbExecutor,
  issueIds: string[]
): Promise<Map<string, IssueItemLine[]>> {
  const map = new Map<string, IssueItemLine[]>();
  if (issueIds.length === 0) return map;
  const rows = await executor
    .select({
      id: stockIssueItems.id,
      issueId: stockIssueItems.issueId,
      itemId: stockIssueItems.itemId,
      itemName: items.name,
      sku: items.sku,
      quantity: stockIssueItems.quantity,
      unitSellingPrice: stockIssueItems.unitSellingPrice,
      subtotal: stockIssueItems.subtotal,
    })
    .from(stockIssueItems)
    .innerJoin(items, eq(stockIssueItems.itemId, items.id))
    .where(inArray(stockIssueItems.issueId, issueIds));

  for (const r of rows) {
    const list = map.get(r.issueId) ?? [];
    list.push({
      id: r.id,
      itemId: r.itemId,
      itemName: r.itemName,
      sku: r.sku,
      quantity: Number(r.quantity),
      unitSellingPrice: Number(r.unitSellingPrice),
      subtotal: Number(r.subtotal),
    });
    map.set(r.issueId, list);
  }
  return map;
}

async function insertIssueAndLines(
  executor: DbExecutor,
  doc: StockIssueDocument
): Promise<void> {
  await executor.insert(stockIssues).values({
    id: doc.id,
    warehouseId: doc.warehouseId,
    issueNumber: doc.issueNumber,
    destinationType: doc.destinationType,
    recipientName: doc.recipientName,
    issueDate: doc.issueDate,
    status: doc.status,
    notes: doc.notes,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
  });

  for (const l of doc.lines) {
    await executor.insert(stockIssueItems).values({
      id: l.id,
      issueId: doc.id,
      itemId: l.itemId,
      quantity: toNumericString(l.quantity, 3),
      unitSellingPrice: toNumericString(l.unitSellingPrice, 2),
      subtotal: toNumericString(l.subtotal, 2),
    });
  }
}

async function findIssueById(
  executor: DbExecutor,
  warehouseId: string,
  issueId: string
): Promise<StockIssueDocument | null> {
  const rows = await executor
    .select()
    .from(stockIssues)
    .where(
      and(
        eq(stockIssues.warehouseId, warehouseId),
        eq(stockIssues.id, issueId)
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const linesMap = await loadLinesForIssueIds(executor, [issueId]);
  return {
    ...row,
    destinationType: row.destinationType as IssueDestinationType,
    status: row.status as 'POSTED' | 'VOIDED',
    lines: linesMap.get(issueId) ?? [],
  };
}

async function queryIssuesList(
  executor: DbExecutor,
  params: {
    warehouseId: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
    offset: number;
  }
): Promise<{ items: StockIssueDocument[]; total: number }> {
  const filters = [eq(stockIssues.warehouseId, params.warehouseId)];
  if (params.fromDate) filters.push(gte(stockIssues.issueDate, params.fromDate));
  if (params.toDate) filters.push(lte(stockIssues.issueDate, params.toDate));
  const whereClause = and(...filters);

  const rows = await executor
    .select()
    .from(stockIssues)
    .where(whereClause)
    .orderBy(desc(stockIssues.issueDate))
    .limit(params.limit)
    .offset(params.offset);

  const totalRow = await executor
    .select({ value: count() })
    .from(stockIssues)
    .where(whereClause);

  const linesMap = await loadLinesForIssueIds(
    executor,
    rows.map((r) => r.id)
  );
  return {
    items: rows.map((r) => ({
      ...r,
      destinationType: r.destinationType as IssueDestinationType,
      status: r.status as 'POSTED' | 'VOIDED',
      lines: linesMap.get(r.id) ?? [],
    })),
    total: Number(totalRow[0]?.value ?? 0),
  };
}

export function createIssueRepository(
  executor: DbExecutor = getDb()
): IssueRepositoryPort {
  return {
    saveIssue: (doc) => insertIssueAndLines(executor, doc),
    findById: (whId, id) => findIssueById(executor, whId, id),
    async markVoided(p) {
      await executor
        .update(stockIssues)
        .set({
          status: 'VOIDED',
          voidReason: p.voidReason,
          voidedBy: p.voidedBy,
          voidedAt: p.voidedAt,
        })
        .where(
          and(
            eq(stockIssues.warehouseId, p.warehouseId),
            eq(stockIssues.id, p.issueId)
          )
        );
    },
    listIssues: (params) => queryIssuesList(executor, params),
  };
}
