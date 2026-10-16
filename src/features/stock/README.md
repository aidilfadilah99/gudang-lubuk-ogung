# Fitur `stock` (Ledger Mutasi, Saldo, Kartu Stok, Void & Penyesuaian)

## Tujuan
Menjadi satu-satunya pengelola buku besar (*ledger*) mutasi stok (`stock_movements`), perhitungan saldo real-time, Kartu Stok per barang, validasi pencegahan stok minus, aturan void pembalik, dan penyesuaian stok manual oleh Admin.

## Tabel yang Dimiliki
- `stock_movements` (Immutable append-only ledger)
- `stock_adjustments` (Dokumen penyesuaian manual Admin)

## Public API (`src/features/stock/index.ts`)
- `recordStockMovementUseCase`: Satu-satunya fungsi yang diizinkan menulis ke `stock_movements` (dipanggil oleh `receipts`, `issues`, dan `stock` di dalam transaksi database yang sama).
- `createStockAdjustmentUseCase`: Mencatat penyesuaian stok manual oleh Admin.
- `getStockSummaryUseCase`: Mengambil daftar saldo stok saat ini beserta status peringatan (`AMAN`, `MENIPIS`, `HABIS`).
- `getStockCardUseCase`: Mengambil riwayat Kartu Stok per barang.
- Fungsi murni domain: `calculateNextBalance`, `convertToBaseQuantity`, `validateVoidEligibility`, `evaluateStockAlertStatus`.

## Aturan Bisnis Utama
1. Saldo barang tidak pernah diedit langsung; selalu dihitung dari akumulasi `stock_movements`.
2. Stok tidak boleh minus (`balance_after >= 0`).
3. Hanya peran `ADMIN` yang dapat melakukan penyesuaian stok manual dengan alasan wajib minimal 5 karakter.
