# Fitur `receipts` (Pencatatan Barang Masuk & Void Penerimaan)

## Tujuan
Mengelola penerimaan barang masuk dari supplier (nomor faktur/surat jalan, item, kuantitas, harga beli) serta pembatalan (*void*) penerimaan oleh Admin menggunakan mutasi pembalik.

## Tabel yang Dimiliki
- `stock_receipts`
- `stock_receipt_items`

## Public API (`src/features/receipts/index.ts`)
- `createReceiptUseCase`: Mencatat dokumen barang masuk dan memicu mutasi `RECEIPT_IN` melalui API publik `@/features/stock`.
- `voidReceiptUseCase`: Membatalkan dokumen barang masuk oleh Admin dengan mutasi pembalik `REVERSAL_RECEIPT`.
- `listReceiptsUseCase`: Menampilkan daftar penerimaan barang per periode.
- `ReceiptForm` & `ReceiptListView`: Komponen antarmuka pengguna.

## Aturan Bisnis Utama
1. Fitur ini **tidak pernah** menulis ke tabel `stock_movements` secara langsung; wajib memanggil `recordStockMovementUseCase` dari `@/features/stock`.
2. Void barang masuk hanya dapat dilakukan oleh `ADMIN` dengan alasan wajib minimal 5 karakter dan gagal jika stok barang tersebut sudah terpakai sehingga saldo tidak cukup untuk dibalik.
