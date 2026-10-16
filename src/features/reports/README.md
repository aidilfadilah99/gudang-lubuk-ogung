# Fitur `reports` (Generator Laporan PDF & Excel)

## Tujuan
Menghasilkan 5 jenis laporan resmi dalam format PDF (`jspdf` + `jspdf-autotable`) dan Excel (`exceljs`):
1. Stok per tanggal
2. Barang masuk per periode
3. Barang keluar per periode
4. Kartu stok per barang
5. Barang menipis

Setiap laporan menyertakan Header nama koperasi (`KDKMP Lubuk Ogung`), periode, waktu cetak WIB (`Asia/Jakarta`), dan blok tanda tangan (`Dibuat oleh` dan `Mengetahui Ketua KDKMP Lubuk Ogung`).

## Public API (`src/features/reports/index.ts`)
- `buildReportTableUseCase`
- `renderReportToExcelBuffer`
- `renderReportToPdfBuffer`
- `ReportsView`
