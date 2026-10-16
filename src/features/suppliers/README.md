# Fitur `suppliers` (Master Data Pemasok / Supplier)

## Tujuan
Mengelola daftar pemasok (*supplier*) pupuk, sembako, alat pertanian, maupun gabungan kelompok tani pemasok hasil panen ke gudang KDKMP Lubuk Ogung.

## Tabel yang Dimiliki
- `suppliers`

## Public API (`src/features/suppliers/index.ts`)
- `listSuppliersUseCase`: Menampilkan seluruh pemasok aktif di gudang.
- `createSupplierUseCase`: Menambahkan pemasok baru (khusus Admin).
- `SuppliersView`: Komponen tampilan dan form supplier.

## Aturan Bisnis Utama
1. Hanya peran `ADMIN` yang berhak menambah pemasok baru.
2. Petugas Gudang dapat membaca daftar pemasok saat mencatat Barang Masuk.
