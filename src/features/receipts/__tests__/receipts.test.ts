import { describe, expect, it } from 'vitest';
import { StockMovementRecord, StockRepositoryPort } from '@/features/stock';
import { USER_ROLES } from '@/shared/config/constants';
import { StokTidakCukupError, TidakBerhakError } from '@/shared/lib/errors';
import {
  ReceiptRepositoryPort,
  StockReceiptDocument,
} from '../domain/receipt';
import { createReceiptUseCase } from '../application/create-receipt';
import { voidReceiptUseCase } from '../application/void-receipt';

function createFakeDeps(initialBalance = 0) {
  let balance = initialBalance;
  const receipts = new Map<string, StockReceiptDocument>();
  const movements: StockMovementRecord[] = [];
  const receiptRepo: ReceiptRepositoryPort = {
    async saveReceipt(doc) {
      receipts.set(doc.id, doc);
    },
    async findById(_, id) {
      return receipts.get(id) ?? null;
    },
    async markVoided({ receiptId, voidReason, voidedBy, voidedAt }) {
      const r = receipts.get(receiptId);
      if (r) Object.assign(r, { status: 'VOIDED', voidReason, voidedBy, voidedAt });
    },
    async listReceipts() {
      return { items: Array.from(receipts.values()), total: receipts.size };
    },
  };
  const stockRepo: StockRepositoryPort = {
    async lockItemAndGetBalance() {
      return { itemName: 'Pupuk Urea', currentBalance: balance };
    },
    async insertMovement(m) {
      balance = m.balanceAfter;
      movements.push(m);
    },
    async insertAdjustment() {},
    async listCurrentStock() {
      return { items: [], total: 0 };
    },
    async getItemMovements() {
      return { movements, total: movements.length };
    },
  };
  return { receiptRepo, stockRepo, movements, getBalance: () => balance };
}

describe('Fitur Receipts - Barang Masuk & Void', () => {
  it('mencatat barang masuk dan menambah saldo ledger via fitur stock', async () => {
    const deps = createFakeDeps(10);
    const doc = await createReceiptUseCase(
      {
        warehouseId: 'wh_01',
        actorId: 'usr_staff',
        supplierId: 'sup_01',
        invoiceNumber: 'INV-001',
        lines: [{ itemId: 'item_01', quantity: 15, unitPurchasePrice: 50000 }],
      },
      deps
    );
    expect(doc.status).toBe('POSTED');
    expect(deps.getBalance()).toBe(25);
    expect(deps.movements).toHaveLength(1);
  });

  it('mengizinkan Admin melakukan void dan menolak Petugas Gudang', async () => {
    const deps = createFakeDeps(10);
    const doc = await createReceiptUseCase(
      {
        warehouseId: 'wh_01',
        actorId: 'usr_staff',
        supplierId: 'sup_01',
        invoiceNumber: 'INV-002',
        lines: [{ itemId: 'item_01', quantity: 5, unitPurchasePrice: 50000 }],
      },
      deps
    );
    await expect(
      voidReceiptUseCase(
        {
          warehouseId: 'wh_01',
          receiptId: doc.id,
          voidReason: 'Salah faktur',
          actorId: 'usr_staff',
          actorRole: USER_ROLES.STAFF,
        },
        deps
      )
    ).rejects.toThrow(TidakBerhakError);
    const voided = await voidReceiptUseCase(
      {
        warehouseId: 'wh_01',
        receiptId: doc.id,
        voidReason: 'Salah input nomor surat jalan',
        actorId: 'usr_admin',
        actorRole: USER_ROLES.ADMIN,
      },
      deps
    );
    expect(voided.status).toBe('VOIDED');
    expect(deps.getBalance()).toBe(10);
  });

  it('menolak void barang masuk jika stok sudah terpakai dan akan menjadi minus', async () => {
    const deps = createFakeDeps(0);
    const doc = await createReceiptUseCase(
      {
        warehouseId: 'wh_01',
        actorId: 'usr_admin',
        supplierId: 'sup_01',
        invoiceNumber: 'INV-003',
        lines: [{ itemId: 'item_01', quantity: 10, unitPurchasePrice: 50000 }],
      },
      deps
    );
    await deps.stockRepo.insertMovement({
      id: 'mov_out',
      warehouseId: 'wh_01',
      itemId: 'item_01',
      movementType: 'ISSUE_OUT',
      referenceType: 'ISSUE',
      referenceId: 'iss_1',
      referenceNumber: 'BK-001',
      quantityChange: -8,
      balanceAfter: 2,
      unitCost: 50000,
      notes: null,
      createdBy: 'usr_admin',
      createdAt: new Date(),
    });
    await expect(
      voidReceiptUseCase(
        {
          warehouseId: 'wh_01',
          receiptId: doc.id,
          voidReason: 'Coba void padahal stok sisa 2',
          actorId: 'usr_admin',
          actorRole: USER_ROLES.ADMIN,
        },
        deps
      )
    ).rejects.toThrow(StokTidakCukupError);
  });
});
