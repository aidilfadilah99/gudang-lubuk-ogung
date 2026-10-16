# Fitur `catalog` (Master Data Barang, Kategori & Satuan)

## Tujuan
Mengelola master data barang (SKU, barcode, nama, kategori, satuan dasar, konversi satuan sekunder, harga beli, harga jual, stok minimum, status aktif), kategori, dan satuan.

## Tabel yang Dimiliki
- `items`
- `categories`
- `units`

## Public API (`src/features/catalog/index.ts`)
- `createOrUpdateItemUseCase`: Menambah atau memperbarui barang beserta harga (khusus Admin).
- `listCatalogOverviewUseCase`: Membaca daftar barang, kategori, dan satuan.
- `createCategoryUseCase`, `createUnitUseCase`.
- `CatalogView`: Komponen antarmuka katalog barang.

## Aturan Bisnis Utama
1. Petugas Gudang hanya dapat melihat daftar barang, namun dilarang menambah/mengubah barang atau harga (`TidakBerhakError`).
2. Harga beli, harga jual, dan stok minimum tidak boleh bernilai negatif.
