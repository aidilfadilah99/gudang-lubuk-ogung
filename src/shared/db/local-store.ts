import bcrypt from 'bcryptjs';
import { APP_CONSTANTS, USER_ROLES, UserRole } from '../config/constants';
import { getEnv } from '../config/env';
import {
  SEED_CATEGORIES,
  SEED_ITEMS,
  SEED_SUPPLIERS,
  SEED_UNITS,
} from './seed-data';

export interface LocalUserRow {
  id: string;
  warehouseId: string;
  username: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface LocalItemRow {
  id: string;
  warehouseId: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryId: string;
  baseUnitId: string;
  secondaryUnitName: string | null;
  conversionFactor: number;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  isActive: boolean;
}

export interface LocalMovementRow {
  id: string;
  warehouseId: string;
  itemId: string;
  movementType: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  quantityChange: number;
  balanceAfter: number;
  unitCost: number;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface LocalReceiptDocRow {
  id: string;
  warehouseId: string;
  receiptNumber: string;
  supplierId: string;
  supplierName?: string;
  invoiceNumber: string;
  receiptDate: Date;
  status: 'POSTED' | 'VOIDED';
  notes: string | null;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  lines: Array<{
    id: string;
    itemId: string;
    itemName?: string;
    sku?: string;
    quantity: number;
    unitPurchasePrice: number;
    subtotal: number;
  }>;
}

export interface LocalIssueDocRow {
  id: string;
  warehouseId: string;
  issueNumber: string;
  destinationType: 'ANGGOTA' | 'UMUM' | 'INTERNAL';
  recipientName: string;
  issueDate: Date;
  status: 'POSTED' | 'VOIDED';
  notes: string | null;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  lines: Array<{
    id: string;
    itemId: string;
    itemName?: string;
    sku?: string;
    quantity: number;
    unitSellingPrice: number;
    subtotal: number;
  }>;
}

export interface LocalStoreState {
  users: LocalUserRow[];
  categories: Array<{ id: string; warehouseId: string; code: string; name: string; description: string | null; isActive: boolean }>;
  units: Array<{ id: string; warehouseId: string; code: string; name: string; isActive: boolean }>;
  suppliers: Array<{ id: string; warehouseId: string; code: string; name: string; phone: string | null; address: string | null; isActive: boolean; createdAt: Date }>;
  items: LocalItemRow[];
  movements: LocalMovementRow[];
  receipts: LocalReceiptDocRow[];
  issues: LocalIssueDocRow[];
  adjustments: Array<Record<string, unknown>>;
  auditLogs: Array<{
    id: string; warehouseId: string; actorId: string; actorUsername: string;
    action: string; entityType: string; entityId: string;
    beforeData: string | null; afterData: string | null; createdAt: Date;
  }>;
  idempotencyKeys: Set<string>;
}

export function isLocalMemoryMode(): boolean {
  return getEnv().DATABASE_URL === 'local-memory';
}

function buildInitialUsers(whId: string, now: Date): LocalUserRow[] {
  const adminHash = bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD ?? 'AdminGudang123!', 8);
  const staffHash = bcrypt.hashSync('PetugasGudang123!', 8);
  return [
    {
      id: 'usr_admin_01', warehouseId: whId, username: 'admin',
      fullName: 'Administrator KDKMP Lubuk Ogung', passwordHash: adminHash,
      role: USER_ROLES.ADMIN, isActive: true, mustChangePassword: false, createdAt: now,
    },
    {
      id: 'usr_staff_01', warehouseId: whId, username: 'petugas1',
      fullName: 'Budi Santoso (Petugas Gudang 1)', passwordHash: staffHash,
      role: USER_ROLES.STAFF, isActive: true, mustChangePassword: false, createdAt: now,
    },
    {
      id: 'usr_staff_02', warehouseId: whId, username: 'petugas2',
      fullName: 'Siti Rahmawati (Petugas Gudang 2)', passwordHash: staffHash,
      role: USER_ROLES.STAFF, isActive: true, mustChangePassword: false, createdAt: now,
    },
  ];
}

function createSeededLocalStore(): LocalStoreState {
  const whId = APP_CONSTANTS.DEFAULT_WAREHOUSE_ID;
  const now = new Date();
  const items: LocalItemRow[] = SEED_ITEMS.map((i) => ({
    id: i.id, warehouseId: whId, sku: i.sku, barcode: i.barcode, name: i.name,
    categoryId: i.categoryId, baseUnitId: i.baseUnitId, secondaryUnitName: i.secondaryUnitName,
    conversionFactor: Number(i.conversionFactor), purchasePrice: Number(i.purchasePrice),
    sellingPrice: Number(i.sellingPrice), minStock: Number(i.minStock), isActive: true,
  }));
  const movements: LocalMovementRow[] = SEED_ITEMS.map((i) => ({
    id: `mov_init_${i.id}`, warehouseId: whId, itemId: i.id,
    movementType: 'RECEIPT_IN', referenceType: 'RECEIPT',
    referenceId: 'rcp_seed_initial_01', referenceNumber: 'BM-202610-0001',
    quantityChange: Number(i.initialQty), balanceAfter: Number(i.initialQty),
    unitCost: Number(i.purchasePrice), notes: 'Saldo Awal Master Barang KDKMP',
    createdBy: 'usr_admin_01', createdAt: now,
  }));

  return {
    users: buildInitialUsers(whId, now),
    categories: SEED_CATEGORIES.map((c) => ({ ...c, warehouseId: whId, isActive: true })),
    units: SEED_UNITS.map((u) => ({ ...u, warehouseId: whId, isActive: true })),
    suppliers: SEED_SUPPLIERS.map((s) => ({ ...s, warehouseId: whId, isActive: true, createdAt: now })),
    items,
    movements,
    receipts: [],
    issues: [],
    adjustments: [],
    auditLogs: [
      {
        id: 'aud_seed_01', warehouseId: whId, actorId: 'usr_admin_01', actorUsername: 'admin',
        action: 'SYSTEM_SEED', entityType: 'WAREHOUSE', entityId: whId,
        beforeData: null, afterData: '{"message":"Inisialisasi stok awal 10 SKU KDKMP Lubuk Ogung"}',
        createdAt: now,
      },
    ],
    idempotencyKeys: new Set<string>(),
  };
}

const globalForLocal = globalThis as unknown as { __kdkmpLocalStore?: LocalStoreState };

export function getLocalStore(): LocalStoreState {
  if (!globalForLocal.__kdkmpLocalStore) {
    globalForLocal.__kdkmpLocalStore = createSeededLocalStore();
  }
  return globalForLocal.__kdkmpLocalStore;
}
