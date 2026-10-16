import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    username: text('username').notNull(),
    fullName: text('full_name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('PETUGAS_GUDANG'),
    isActive: boolean('is_active').notNull().default(true),
    mustChangePassword: boolean('must_change_password').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_users_username').on(table.username),
    index('idx_users_warehouse_role').on(table.warehouseId, table.role),
  ]
);

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_categories_wh_code').on(table.warehouseId, table.code),
    index('idx_categories_wh_name').on(table.warehouseId, table.name),
  ]
);

export const units = pgTable(
  'units',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('idx_units_wh_code').on(table.warehouseId, table.code)]
);

export const suppliers = pgTable(
  'suppliers',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    code: text('code').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_suppliers_wh_code').on(table.warehouseId, table.code),
    index('idx_suppliers_wh_name').on(table.warehouseId, table.name),
  ]
);

export const items = pgTable(
  'items',
  {
    id: text('id').primaryKey(),
    warehouseId: text('warehouse_id').notNull().default('wh_lubuk_ogung_01'),
    sku: text('sku').notNull(),
    barcode: text('barcode'),
    name: text('name').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    baseUnitId: text('base_unit_id')
      .notNull()
      .references(() => units.id),
    secondaryUnitName: text('secondary_unit_name'),
    conversionFactor: numeric('conversion_factor', {
      precision: 12,
      scale: 3,
    })
      .notNull()
      .default('1.000'),
    purchasePrice: numeric('purchase_price', { precision: 15, scale: 2 })
      .notNull()
      .default('0.00'),
    sellingPrice: numeric('selling_price', { precision: 15, scale: 2 })
      .notNull()
      .default('0.00'),
    minStock: numeric('min_stock', { precision: 14, scale: 3 })
      .notNull()
      .default('0.000'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_items_wh_sku').on(table.warehouseId, table.sku),
    index('idx_items_wh_barcode').on(table.warehouseId, table.barcode),
    index('idx_items_wh_category').on(table.warehouseId, table.categoryId),
    index('idx_items_wh_name').on(table.warehouseId, table.name),
  ]
);
