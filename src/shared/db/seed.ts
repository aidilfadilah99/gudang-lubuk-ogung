import { APP_CONSTANTS, USER_ROLES } from '../config/constants';
import { hashPassword } from '../security/password';
import { DbExecutor, withUnitOfWork } from './client';
import {
  categories,
  items,
  stockMovements,
  stockReceiptItems,
  stockReceipts,
  suppliers,
  units,
  users,
} from './schema';
import {
  SEED_CATEGORIES,
  SEED_ITEMS,
  SEED_SUPPLIERS,
  SEED_UNITS,
} from './seed-data';

async function seedUsersAndMasters(
  tx: DbExecutor,
  whId: string,
  adminUsername: string,
  adminHash: string,
  staffHash: string
): Promise<void> {
  await tx
    .insert(users)
    .values([
      {
        id: 'usr_admin_01', warehouseId: whId, username: adminUsername,
        fullName: 'Administrator KDKMP Lubuk Ogung', passwordHash: adminHash,
        role: USER_ROLES.ADMIN, isActive: true, mustChangePassword: true,
      },
      {
        id: 'usr_staff_01', warehouseId: whId, username: 'petugas1',
        fullName: 'Budi Santoso (Petugas Gudang 1)', passwordHash: staffHash,
        role: USER_ROLES.STAFF, isActive: true, mustChangePassword: false,
      },
      {
        id: 'usr_staff_02', warehouseId: whId, username: 'petugas2',
        fullName: 'Siti Rahmawati (Petugas Gudang 2)', passwordHash: staffHash,
        role: USER_ROLES.STAFF, isActive: true, mustChangePassword: false,
      },
    ])
    .onConflictDoNothing();

  for (const c of SEED_CATEGORIES) await tx.insert(categories).values({ ...c, warehouseId: whId }).onConflictDoNothing();
  for (const u of SEED_UNITS) await tx.insert(units).values({ ...u, warehouseId: whId }).onConflictDoNothing();
  for (const s of SEED_SUPPLIERS) await tx.insert(suppliers).values({ ...s, warehouseId: whId }).onConflictDoNothing();
}

async function seedInitialItemsAndLedger(tx: DbExecutor, whId: string): Promise<void> {
  const receiptId = 'rcp_seed_initial_01';
  await tx
    .insert(stockReceipts)
    .values({
      id: receiptId, warehouseId: whId, receiptNumber: 'BM-202610-0001',
      supplierId: 'sup_pupuk_riau', invoiceNumber: 'INV-INIT-2026-001',
      receiptDate: new Date(), status: 'POSTED',
      notes: 'Saldo Awal Gudang Utama KDKMP Lubuk Ogung', createdBy: 'usr_admin_01',
    })
    .onConflictDoNothing();

  for (const item of SEED_ITEMS) {
    const { initialQty, ...itemRow } = item;
    await tx.insert(items).values({ ...itemRow, warehouseId: whId }).onConflictDoNothing();
    const subtotal = (Number(initialQty) * Number(item.purchasePrice)).toFixed(2);
    await tx
      .insert(stockReceiptItems)
      .values({
        id: `rcpi_${item.id}`, receiptId, itemId: item.id,
        quantity: initialQty, unitPurchasePrice: item.purchasePrice, subtotal,
      })
      .onConflictDoNothing();
    await tx
      .insert(stockMovements)
      .values({
        id: `mov_init_${item.id}`, warehouseId: whId, itemId: item.id,
        movementType: 'RECEIPT_IN', referenceType: 'RECEIPT',
        referenceId: receiptId, referenceNumber: 'BM-202610-0001',
        quantityChange: initialQty, balanceAfter: initialQty,
        unitCost: item.purchasePrice, notes: 'Saldo Awal Master Barang', createdBy: 'usr_admin_01',
      })
      .onConflictDoNothing();
  }
}

async function runSeed(): Promise<void> {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD wajib diset di environment (min 8 karakter).');
  }
  const whId = APP_CONSTANTS.DEFAULT_WAREHOUSE_ID;
  const adminHash = await hashPassword(adminPassword);
  const staffHash = await hashPassword('PetugasGudang123!');

  await withUnitOfWork(async (tx) => {
    await seedUsersAndMasters(tx, whId, adminUsername, adminHash, staffHash);
    await seedInitialItemsAndLedger(tx, whId);
  });
  console.log('✅ Seed selesai: 1 Admin, 2 Petugas, Master Data & 10 Barang contoh.');
}

runSeed().catch((err) => {
  console.error('❌ Gagal menjalankan seed:', err);
  process.exit(1);
});
