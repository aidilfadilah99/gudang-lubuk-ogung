import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { items, suppliers, users } from './tables-master';

export const stockReceipts = pgTable(
  'stock_receipts',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    receiptNumber: text('receipt_number').notNull(),
    supplierId: text('supplier_id').notNull().references(() => suppliers.id),
    invoiceNumber: text('invoice_number').notNull(),
    receiptDate: timestamp('receipt_date', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('POSTED'),
    notes: text('notes'),
    voidReason: text('void_reason'),
    voidedBy: text('voided_by').references(() => users.id),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_receipts_wh_number').on(table.warehouseId, table.receiptNumber),
    index('idx_receipts_wh_date').on(table.warehouseId, table.receiptDate),
    index('idx_receipts_supplier').on(table.supplierId),
  ]
);

export const stockReceiptItems = pgTable(
  'stock_receipt_items',
  {
    id: text('id').primaryKey(),
    receiptId: text('receipt_id').notNull().references(() => stockReceipts.id),
    itemId: text('item_id').notNull().references(() => items.id),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    unitPurchasePrice: numeric('unit_purchase_price', { precision: 15, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 16, scale: 2 }).notNull(),
  },
  (table) => [
    index('idx_receipt_items_receipt').on(table.receiptId),
    index('idx_receipt_items_item').on(table.itemId),
  ]
);

export const stockIssues = pgTable(
  'stock_issues',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    issueNumber: text('issue_number').notNull(),
    destinationType: text('destination_type').notNull(),
    recipientName: text('recipient_name').notNull(),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('POSTED'),
    notes: text('notes'),
    voidReason: text('void_reason'),
    voidedBy: text('voided_by').references(() => users.id),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_issues_wh_number').on(table.warehouseId, table.issueNumber),
    index('idx_issues_wh_date').on(table.warehouseId, table.issueDate),
  ]
);

export const stockIssueItems = pgTable(
  'stock_issue_items',
  {
    id: text('id').primaryKey(),
    issueId: text('issue_id').notNull().references(() => stockIssues.id),
    itemId: text('item_id').notNull().references(() => items.id),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    unitSellingPrice: numeric('unit_selling_price', { precision: 15, scale: 2 }).notNull(),
    subtotal: numeric('subtotal', { precision: 16, scale: 2 }).notNull(),
  },
  (table) => [
    index('idx_issue_items_issue').on(table.issueId),
    index('idx_issue_items_item').on(table.itemId),
  ]
);

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    itemId: text('item_id').notNull().references(() => items.id),
    movementType: text('movement_type').notNull(),
    referenceType: text('reference_type').notNull(),
    referenceId: text('reference_id').notNull(),
    referenceNumber: text('reference_number').notNull(),
    quantityChange: numeric('quantity_change', { precision: 14, scale: 3 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 14, scale: 3 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 15, scale: 2 }).notNull().default('0.00'),
    notes: text('notes'),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_movements_wh_item_date').on(table.warehouseId, table.itemId, table.createdAt),
    index('idx_movements_reference').on(table.referenceType, table.referenceId),
  ]
);

export const stockAdjustments = pgTable(
  'stock_adjustments',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    adjustmentNumber: text('adjustment_number').notNull(),
    itemId: text('item_id').notNull().references(() => items.id),
    quantityDelta: numeric('quantity_delta', { precision: 14, scale: 3 }).notNull(),
    reasonCategory: text('reason_category').notNull(),
    reasonDetail: text('reason_detail').notNull(),
    createdBy: text('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_adjustments_wh_number').on(table.warehouseId, table.adjustmentNumber),
    index('idx_adjustments_wh_item').on(table.warehouseId, table.itemId),
  ]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    actorId: text('actor_id').notNull().references(() => users.id),
    actorUsername: text('actor_username').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    beforeData: text('before_data'),
    afterData: text('after_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_wh_created').on(table.warehouseId, table.createdAt),
    index('idx_audit_entity').on(table.entityType, table.entityId),
  ]
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    key: text('key').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    actorId: text('actor_id').notNull().references(() => users.id),
    operation: text('operation').notNull(),
    responsePayload: text('response_payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('idx_idempotency_created').on(table.createdAt)]
);
