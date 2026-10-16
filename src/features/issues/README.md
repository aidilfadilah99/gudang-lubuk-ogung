# Fitur `issues` (Pencatatan Barang Keluar & Void Pengeluaran)

## Tujuan
Mengelola pengeluaran barang keluar ke Anggota Koperasi, Umum, atau Pemakaian Internal dengan validasi stok tidak boleh minus, serta pembatalan (*void*) pengeluaran oleh Admin menggunakan mutasi pembalik.

## Tabel yang Dimiliki
- `stock_issues`
- `stock_issue_items`

## Public API (`src/features/issues/index.ts`)
- `createIssueUseCase`: Mencatat pengeluaran barang dan mengurangi stok melalui `recordStockMovementUseCase` dari `@/features/stock`.
- `voidIssueUseCase`: Membatalkan pengeluaran oleh Admin dan mengembalikan stok melalui mutasi `REVERSAL_ISSUE`.
- `listIssuesUseCase`: Mengambil daftar barang keluar terpaginasi.
- `IssueForm` & `IssueListView`: Komponen antarmuka pengguna.

## Aturan Bisnis Utama
1. Pengeluaran barang ditolak secara atomik (`StokTidakCukupError`) apabila jumlah yang diminta melebihi saldo yang tersedia.
2. Void barang keluar hanya boleh dilakukan oleh `ADMIN` dengan alasan wajib minimal 5 karakter.
