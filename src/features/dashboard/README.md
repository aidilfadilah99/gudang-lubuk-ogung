# Fitur `dashboard` (Ringkasan & Grafik Operasional Gudang)

## Tujuan
Menyajikan metrik utama operasional gudang KDKMP Lubuk Ogung secara cepat: total SKU aktif, jumlah barang yang stoknya menipis/habis, jumlah mutasi hari ini, grafik perbandingan barang masuk vs keluar selama 30 hari terakhir, dan 10 mutasi terakhir.

## Tabel yang Diakses (Read-Only)
- `items`
- `stock_movements`

## Public API (`src/features/dashboard/index.ts`)
- `getDashboardStatsUseCase`: Mengambil snapshot ringkasan gudang.
- `buildLastNDaysBuckets`: Fungsi murni pembentuk deret tanggal 30 hari untuk grafik.
- `DashboardView`: Komponen antarmuka dashboard mobile-first.
