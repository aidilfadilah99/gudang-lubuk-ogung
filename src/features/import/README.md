# Fitur `import` (Impor Barang dari Excel/CSV dengan Pratinjau & Error Per Baris)

## Tujuan
Memungkinkan Admin mengimpor master barang secara massal dari file CSV/Excel dengan tahapan pratinjau (*preview*) dan pelaporan daftar kesalahan (*error*) spesifik per nomor baris sebelum disimpan ke database.

## Tabel yang Diakses
- `items`, `categories`, `units`

## Public API (`src/features/import/index.ts`)
- `validateImportBatch`, `parseCsvToRawImportRows`: Fungsi murni validasi baris impor.
- `previewAndCommitImportUseCase`: Use-case pratinjau dan penyimpanan impor.
- `parseExcelBufferToRawRows`: Parser file `.xlsx` menggunakan `exceljs`.
- `ImportCatalogView`: Komponen antarmuka impor dengan tabel pratinjau dan daftar error per baris.

## Aturan Bisnis Utama
1. Hanya peran `ADMIN` yang diizinkan melakukan impor barang.
2. Jika ada satu saja baris yang memiliki error (SKU duplikat, harga negatif, kode kategori/satuan tidak terdaftar), penyimpanan ditahan dan daftar error ditampilkan lengkap per nomor baris.
