-- Initial Migration: Sistem Pergudangan Barang KDKMP Lubuk Ogung
-- Multi-Warehouse Ready (warehouse_id) + Immutable Ledger Stock Movements

CREATE TABLE IF NOT EXISTS "users" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "username" text NOT NULL,
  "full_name" text NOT NULL,
  "password_hash" text NOT NULL,
  "role" text DEFAULT 'PETUGAS_GUDANG' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "must_change_password" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_username" ON "users" ("username");
CREATE INDEX IF NOT EXISTS "idx_users_warehouse_role" ON "users" ("warehouse_id", "role");

CREATE TABLE IF NOT EXISTS "categories" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_categories_wh_code" ON "categories" ("warehouse_id", "code");
CREATE INDEX IF NOT EXISTS "idx_categories_wh_name" ON "categories" ("warehouse_id", "name");

CREATE TABLE IF NOT EXISTS "units" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_units_wh_code" ON "units" ("warehouse_id", "code");

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "address" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_suppliers_wh_code" ON "suppliers" ("warehouse_id", "code");
CREATE INDEX IF NOT EXISTS "idx_suppliers_wh_name" ON "suppliers" ("warehouse_id", "name");

CREATE TABLE IF NOT EXISTS "items" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "sku" text NOT NULL,
  "barcode" text,
  "name" text NOT NULL,
  "category_id" text NOT NULL REFERENCES "categories"("id"),
  "base_unit_id" text NOT NULL REFERENCES "units"("id"),
  "secondary_unit_name" text,
  "conversion_factor" numeric(12, 3) DEFAULT '1.000' NOT NULL,
  "purchase_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
  "selling_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
  "min_stock" numeric(14, 3) DEFAULT '0.000' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_items_wh_sku" ON "items" ("warehouse_id", "sku");
CREATE INDEX IF NOT EXISTS "idx_items_wh_barcode" ON "items" ("warehouse_id", "barcode");
CREATE INDEX IF NOT EXISTS "idx_items_wh_category" ON "items" ("warehouse_id", "category_id");
CREATE INDEX IF NOT EXISTS "idx_items_wh_name" ON "items" ("warehouse_id", "name");

CREATE TABLE IF NOT EXISTS "stock_receipts" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "receipt_number" text NOT NULL,
  "supplier_id" text NOT NULL REFERENCES "suppliers"("id"),
  "invoice_number" text NOT NULL,
  "receipt_date" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'POSTED' NOT NULL,
  "notes" text,
  "void_reason" text,
  "voided_by" text REFERENCES "users"("id"),
  "voided_at" timestamp with time zone,
  "created_by" text NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_receipts_wh_number" ON "stock_receipts" ("warehouse_id", "receipt_number");
CREATE INDEX IF NOT EXISTS "idx_receipts_wh_date" ON "stock_receipts" ("warehouse_id", "receipt_date");
CREATE INDEX IF NOT EXISTS "idx_receipts_supplier" ON "stock_receipts" ("supplier_id");

CREATE TABLE IF NOT EXISTS "stock_receipt_items" (
  "id" text PRIMARY KEY NOT NULL,
  "receipt_id" text NOT NULL REFERENCES "stock_receipts"("id"),
  "item_id" text NOT NULL REFERENCES "items"("id"),
  "quantity" numeric(14, 3) NOT NULL CHECK ("quantity" > 0),
  "unit_purchase_price" numeric(15, 2) NOT NULL CHECK ("unit_purchase_price" >= 0),
  "subtotal" numeric(16, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_receipt_items_receipt" ON "stock_receipt_items" ("receipt_id");
CREATE INDEX IF NOT EXISTS "idx_receipt_items_item" ON "stock_receipt_items" ("item_id");

CREATE TABLE IF NOT EXISTS "stock_issues" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "issue_number" text NOT NULL,
  "destination_type" text NOT NULL,
  "recipient_name" text NOT NULL,
  "issue_date" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'POSTED' NOT NULL,
  "notes" text,
  "void_reason" text,
  "voided_by" text REFERENCES "users"("id"),
  "voided_at" timestamp with time zone,
  "created_by" text NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_issues_wh_number" ON "stock_issues" ("warehouse_id", "issue_number");
CREATE INDEX IF NOT EXISTS "idx_issues_wh_date" ON "stock_issues" ("warehouse_id", "issue_date");

CREATE TABLE IF NOT EXISTS "stock_issue_items" (
  "id" text PRIMARY KEY NOT NULL,
  "issue_id" text NOT NULL REFERENCES "stock_issues"("id"),
  "item_id" text NOT NULL REFERENCES "items"("id"),
  "quantity" numeric(14, 3) NOT NULL CHECK ("quantity" > 0),
  "unit_selling_price" numeric(15, 2) NOT NULL CHECK ("unit_selling_price" >= 0),
  "subtotal" numeric(16, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_issue_items_issue" ON "stock_issue_items" ("issue_id");
CREATE INDEX IF NOT EXISTS "idx_issue_items_item" ON "stock_issue_items" ("item_id");

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "item_id" text NOT NULL REFERENCES "items"("id"),
  "movement_type" text NOT NULL,
  "reference_type" text NOT NULL,
  "reference_id" text NOT NULL,
  "reference_number" text NOT NULL,
  "quantity_change" numeric(14, 3) NOT NULL,
  "balance_after" numeric(14, 3) NOT NULL CHECK ("balance_after" >= 0),
  "unit_cost" numeric(15, 2) DEFAULT '0.00' NOT NULL,
  "notes" text,
  "created_by" text NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_movements_wh_item_date" ON "stock_movements" ("warehouse_id", "item_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_movements_reference" ON "stock_movements" ("reference_type", "reference_id");

CREATE TABLE IF NOT EXISTS "stock_adjustments" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "adjustment_number" text NOT NULL,
  "item_id" text NOT NULL REFERENCES "items"("id"),
  "quantity_delta" numeric(14, 3) NOT NULL,
  "reason_category" text NOT NULL,
  "reason_detail" text NOT NULL,
  "created_by" text NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_adjustments_wh_number" ON "stock_adjustments" ("warehouse_id", "adjustment_number");
CREATE INDEX IF NOT EXISTS "idx_adjustments_wh_item" ON "stock_adjustments" ("warehouse_id", "item_id");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "actor_id" text NOT NULL REFERENCES "users"("id"),
  "actor_username" text NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "before_data" text,
  "after_data" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_audit_wh_created" ON "audit_logs" ("warehouse_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id");

CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "key" text PRIMARY KEY NOT NULL,
  "warehouse_id" text DEFAULT 'wh_lubuk_ogung_01' NOT NULL,
  "actor_id" text NOT NULL REFERENCES "users"("id"),
  "operation" text NOT NULL,
  "response_payload" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_idempotency_created" ON "idempotency_keys" ("created_at");
