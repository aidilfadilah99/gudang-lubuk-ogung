import { describe, expect, it } from 'vitest';
import { assertCanModifyCatalog } from '@/features/catalog';
import {
  parseCsvToRawImportRows,
  validateImportBatch,
} from '@/features/import';
import { createIssueUseCase } from '@/features/issues';
import { createReceiptUseCase, voidReceiptUseCase } from '@/features/receipts';
import { createStockAdjustmentUseCase } from '@/features/stock';
import { APP_CONSTANTS, USER_ROLES } from '@/shared/config/constants';
import {
  DataTidakValidError,
  StokTidakCukupError,
  TidakBerhakError,
  TransaksiDuplikatError,
} from '@/shared/lib/errors';
import { assertAndLockIdempotency } from '@/shared/security/idempotency';
import { createInMemoryWarehouseHarness } from './test-harness';

describe('Pengujian Kasus Batas (Edge Cases) Wajib', () => {
  const whId = APP_CONSTANTS.DEFAULT_WAREHOUSE_ID;

  it('1. menolak pengeluaran barang yang melebihi stok (StokTidakCukupError)', async () => {
    const h = createInMemoryWarehouseHarness();
    await createReceiptUseCase(
      {
        warehouseId: whId,
        actorId: 'usr_1',
        supplierId: 'sup_1',
        invoiceNumber: 'INV-10',
        lines: [
          { itemId: 'itm_pupuk_urea', quantity: 10, unitPurchasePrice: 120000 },
        ],
      },
      { receiptRepo: h.receiptRepo, stockRepo: h.stockRepo }
    );

    await expect(
      createIssueUseCase(
        {
          warehouseId: whId,
          actorId: 'usr_1',
          destinationType: 'UMUM',
          recipientName: 'Pembeli Umum',
          lines: [
            {
              itemId: 'itm_pupuk_urea',
              quantity: 12,
              unitSellingPrice: 135000,
            },
          ],
        },
        { issueRepo: h.issueRepo, stockRepo: h.stockRepo }
      )
    ).rejects.toThrow(StokTidakCukupError);
  });

  it('2. menolak dua pengeluaran bersamaan jika stok hanya cukup untuk satu', async () => {
    const h = createInMemoryWarehouseHarness();
    await createReceiptUseCase(
      {
        warehouseId: whId,
        actorId: 'usr_1',
        supplierId: 'sup_1',
        invoiceNumber: 'INV-CONC',
        lines: [
          { itemId: 'itm_pupuk_urea', quantity: 10, unitPurchasePrice: 120000 },
        ],
      },
      { receiptRepo: h.receiptRepo, stockRepo: h.stockRepo }
    );

    const results = await Promise.allSettled([
      createIssueUseCase(
        {
          warehouseId: whId,
          actorId: 'usr_1',
          destinationType: 'ANGGOTA',
          recipientName: 'Anggota A',
          lines: [
            { itemId: 'itm_pupuk_urea', quantity: 8, unitSellingPrice: 135000 },
          ],
        },
        { issueRepo: h.issueRepo, stockRepo: h.stockRepo }
      ),
      createIssueUseCase(
        {
          warehouseId: whId,
          actorId: 'usr_2',
          destinationType: 'ANGGOTA',
          recipientName: 'Anggota B',
          lines: [
            { itemId: 'itm_pupuk_urea', quantity: 8, unitSellingPrice: 135000 },
          ],
        },
        { issueRepo: h.issueRepo, stockRepo: h.stockRepo }
      ),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(h.items.get('itm_pupuk_urea')?.currentBalance).toBe(2);
  });

  it('3. mencegah duplikasi pengiriman form akibat klik ganda (idempotency)', () => {
    assertAndLockIdempotency('idem-key-klik-ganda-001');
    expect(() => assertAndLockIdempotency('idem-key-klik-ganda-001')).toThrow(
      TransaksiDuplikatError
    );
  });

  it('4. menolak void tanpa alasan atau oleh bukan Admin', async () => {
    const h = createInMemoryWarehouseHarness();
    const rcp = await createReceiptUseCase(
      {
        warehouseId: whId,
        actorId: 'usr_1',
        supplierId: 'sup_1',
        invoiceNumber: 'INV-VOID',
        lines: [
          { itemId: 'itm_pupuk_urea', quantity: 5, unitPurchasePrice: 120000 },
        ],
      },
      { receiptRepo: h.receiptRepo, stockRepo: h.stockRepo }
    );

    await expect(
      voidReceiptUseCase(
        {
          warehouseId: whId,
          receiptId: rcp.id,
          voidReason: 'Alasan cukup panjang',
          actorId: 'usr_staff',
          actorRole: USER_ROLES.STAFF,
        },
        { receiptRepo: h.receiptRepo, stockRepo: h.stockRepo }
      )
    ).rejects.toThrow(TidakBerhakError);

    await expect(
      voidReceiptUseCase(
        {
          warehouseId: whId,
          receiptId: rcp.id,
          voidReason: 'abc',
          actorId: 'usr_admin',
          actorRole: USER_ROLES.ADMIN,
        },
        { receiptRepo: h.receiptRepo, stockRepo: h.stockRepo }
      )
    ).rejects.toThrow(DataTidakValidError);
  });

  it('5. menolak Petugas Gudang saat mencoba operasi khusus Admin', async () => {
    const h = createInMemoryWarehouseHarness();
    expect(() => assertCanModifyCatalog(USER_ROLES.STAFF)).toThrow(
      TidakBerhakError
    );

    await expect(
      createStockAdjustmentUseCase(
        {
          warehouseId: whId,
          actorId: 'usr_staff',
          actorUsername: 'petugas1',
          actorRole: USER_ROLES.STAFF,
          itemId: 'itm_pupuk_urea',
          quantityDelta: -1,
          reasonCategory: 'RUSAK',
          reasonDetail: 'Kemasan pecah di gudang',
        },
        { stockRepo: h.stockRepo }
      )
    ).rejects.toThrow(TidakBerhakError);
  });

  it('6. melaporkan daftar error per baris pada impor CSV rusak tanpa crash', () => {
    const csvBad = [
      'sku,barcode,name,categoryCode,unitCode,purchasePrice,sellingPrice,minStock',
      ',899001,Barang Tanpa SKU,SEMBAKO,KG,10000,12000,5',
      'SKU-VALID,899002,Beras Super,SEMBAKO,KG,13000,14500,10',
      'SKU-VALID,899003,Duplikat SKU,SEMBAKO,KG,-500,14500,10',
    ].join('\n');

    const rawRows = parseCsvToRawImportRows(csvBad);
    const preview = validateImportBatch(rawRows);
    expect(preview.validRows).toHaveLength(1);
    expect(preview.invalidRows.length).toBeGreaterThanOrEqual(2);
    expect(preview.invalidRows.some((e) => e.rowNumber === 2)).toBe(true);
    expect(preview.invalidRows.some((e) => e.rowNumber === 4)).toBe(true);
  });
});
