import { describe, expect, it } from 'vitest';
import { loginUserUseCase } from '@/features/auth';
import { createIssueUseCase, voidIssueUseCase } from '@/features/issues';
import { createReceiptUseCase, voidReceiptUseCase } from '@/features/receipts';
import { getStockCardUseCase } from '@/features/stock';
import { APP_CONSTANTS, USER_ROLES } from '@/shared/config/constants';
import { createInMemoryWarehouseHarness } from './test-harness';

describe('E2E Alur Utama: Login -> Barang Masuk -> Barang Keluar -> Kartu Stok -> Void', () => {
  it('menjalankan siklus penuh transaksi gudang secara konsisten pada ledger', async () => {
    const h = createInMemoryWarehouseHarness();
    const whId = APP_CONSTANTS.DEFAULT_WAREHOUSE_ID;

    const session = await loginUserUseCase(
      { username: 'petugas1', password: 'PasswordLama123' },
      {
        authRepo: h.authRepo,
        verifyPasswordFn: async (plain, hash) => hash === `hashed:${plain}`,
      }
    );
    expect(session.username).toBe('petugas1');

    const receipt = await createReceiptUseCase(
      {
        warehouseId: whId,
        actorId: session.id,
        supplierId: 'sup_pt_pupuk',
        invoiceNumber: 'INV-2026-001',
        notes: 'Stok awal pupuk musim tanam',
        lines: [{ itemId: 'itm_pupuk_urea', quantity: 50, unitPurchasePrice: 120000 }],
      },
      { receiptRepo: h.receiptRepo, stockRepo: h.stockRepo }
    );
    expect(receipt.status).toBe('POSTED');

    const issue = await createIssueUseCase(
      {
        warehouseId: whId,
        actorId: session.id,
        destinationType: 'ANGGOTA',
        recipientName: 'Kelompok Tani Harapan',
        lines: [{ itemId: 'itm_pupuk_urea', quantity: 15, unitSellingPrice: 135000 }],
      },
      { issueRepo: h.issueRepo, stockRepo: h.stockRepo }
    );
    expect(issue.status).toBe('POSTED');

    const cardAfterIssue = await getStockCardUseCase(
      { warehouseId: whId, itemId: 'itm_pupuk_urea', page: 1, pageSize: 20 },
      { stockRepo: h.stockRepo }
    );
    expect(h.items.get('itm_pupuk_urea')?.currentBalance).toBe(35);
    expect(cardAfterIssue.movements).toHaveLength(2);
    expect(cardAfterIssue.movements[0]?.balanceAfter).toBe(50);
    expect(cardAfterIssue.movements[1]?.balanceAfter).toBe(35);

    const voidedIssue = await voidIssueUseCase(
      {
        warehouseId: whId,
        issueId: issue.id,
        voidReason: 'Batal ambil oleh kelompok tani',
        actorId: 'usr_admin_1',
        actorRole: USER_ROLES.ADMIN,
      },
      { issueRepo: h.issueRepo, stockRepo: h.stockRepo }
    );
    expect(voidedIssue.status).toBe('VOIDED');
    expect(h.items.get('itm_pupuk_urea')?.currentBalance).toBe(50);

    const voidedReceipt = await voidReceiptUseCase(
      {
        warehouseId: whId,
        receiptId: receipt.id,
        voidReason: 'Revisi harga faktur supplier salah ketik',
        actorId: 'usr_admin_1',
        actorRole: USER_ROLES.ADMIN,
      },
      { receiptRepo: h.receiptRepo, stockRepo: h.stockRepo }
    );
    expect(voidedReceipt.status).toBe('VOIDED');
    expect(h.items.get('itm_pupuk_urea')?.currentBalance).toBe(0);
  });
});
