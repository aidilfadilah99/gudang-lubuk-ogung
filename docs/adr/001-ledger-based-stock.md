# ADR 001: Manajemen Stok Berbasis Ledger (Immutable Stock Movements)

- **Status**: Disetujui
- **Tanggal**: 16/10/2026
- **Konteks**: Sistem Pergudangan Barang KDKMP Lubuk Ogung membutuhkan akuntabilitas penuh atas saldo barang (sembako, pupuk, alat pertanian, hasil tani) dan riwayat mutasi (Kartu Stok) yang tahan terhadap manipulasi maupun race condition saat digunakan bersama oleh Admin dan Petugas Gudang.

## Keputusan
1. **Tabel `stock_movements` sebagai Satu-Satunya Sumber Kebenaran (Single Source of Truth)**:
   - Setiap perubahan stok (Barang Masuk, Barang Keluar, Void/Pembalik, Penyesuaian Manual) wajib menghasilkan baris baru yang bersifat *append-only* (tidak pernah di-UPDATE atau di-DELETE) di tabel `stock_movements`.
   - Kolom `quantity_change` menyimpan nilai bertanda (`numeric(14, 3)`): positif untuk penambahan stok, negatif untuk pengurangan stok.
   - Kolom `balance_after` menyimpan saldo berjalan tepat setelah transaksi tersebut dieksekusi di dalam transaksi database yang sama.
2. **Kepemilikan Eksklusif oleh Fitur `stock`**:
   - Hanya modul `src/features/stock` (melalui fungsi publik `recordStockMovement`) yang diizinkan menulis ke tabel `stock_movements`.
   - Fitur `receipts`, `issues`, dan `adjustments` wajib memanggil `recordStockMovement` di dalam satu transaksi database (`UnitOfWork`) yang atomik.
3. **Pencegahan Stok Minus & Race Condition**:
   - Pengambilan saldo terakhir dan penulisan mutasi baru dilakukan di dalam transaksi dengan penguncian baris barang (`SELECT ... FOR UPDATE` pada baris `items` terkait) sehingga dua transaksi keluar yang bersamaan dieksekusi secara berurutan.
   - Jika `currentBalance + quantityChange < 0`, domain layer melempar error `StokTidakCukupError` dan seluruh transaksi dibatalkan (*rollback*).
4. **Void Tanpa Hapus Data**:
   - Pembatalan transaksi yang sudah diposting tidak pernah menghapus baris lama, melainkan mengubah status dokumen menjadi `VOIDED` dan membuat mutasi pembalik (`REVERSAL_RECEIPT` atau `REVERSAL_ISSUE`) dengan alasan wajib dan jejak audit.

## Konsekuensi
- **Positif**: Kartu stok selalu konsisten 100% dengan saldo aktual; jejak audit tidak bisa dihapus; aman dari anomali transaksi bersamaan.
- **Negatif**: Membutuhkan transaksi database di setiap operasi mutasi stok (dioptimalkan dengan indeks komposit `(warehouse_id, item_id, created_at)`).
