# Sistem Pergudangan Barang KDKMP Lubuk Ogung (Tahap 1 — MVP)

Aplikasi Web + PWA (*Progressive Web App*) pengelolaan stok gudang berbasis buku besar (*ledger-based inventory*) untuk **Koperasi Desa Merah Putih (KDKMP) Lubuk Ogung**. Dirancang khusus dengan fokus **Keamanan Rantai Pasok (Supply Chain Security)**, **Arsitektur Modular 4-Lapisan Berbasis Fitur**, dan **Kepatuhan Paket Gratis (Neon PostgreSQL Free + Vercel Hobby)**.

---

## Fitur Utama Tahap 1 (MVP)

1. **Autentikasi & Keamanan Sesi**: Login username & password (`scrypt` + timing-safe compare), cookie sesi `httpOnly`/`secure`/`sameSite=lax`, *rate limiting* percobaan login, kedaluwarsa sesi 8 jam, dan **wajib ganti password saat login pertama** bagi Admin hasil seed.
2. **Master Data Koperasi**: Barang (SKU, barcode, kategori, satuan dasar, konversi satuan opsional, harga beli, harga jual, stok minimum, status aktif), Kategori, Satuan, dan Supplier.
3. **Barang Masuk (Receipts)**: Pencatatan penerimaan barang dari supplier dengan nomor faktur/surat jalan, pemindaian barcode kamera HP (`BarcodeDetector` API + fallback `@zxing/library`), dan pencegahan kirim ganda (*idempotency*).
4. **Barang Keluar (Issues)**: Pengeluaran barang untuk Anggota, Umum, atau Pemakaian Internal. **Stok dijamin tidak pernah minus** menggunakan penguncian baris transaksi (`SELECT ... FOR UPDATE`).
5. **Stok Saat Ini & Kartu Stok Ledger**: Pencarian cepat, filter kategori, indikator stok menipis (`LOW_STOCK` / `OUT_OF_STOCK`), dan Kartu Stok per barang dengan riwayat mutasi masuk, keluar, dan saldo berjalan yang dihitung dari ledger.
6. **Void Transaksi & Penyesuaian Stok (Khusus Admin)**: Pembatalan dokumen (*Void*) dengan alasan wajib menggunakan **jurnal pembalik** (data yang sudah diposting tidak pernah dihapus), serta penyesuaian stok manual (barang rusak/hilang/koreksi).
7. **Dashboard Ringkas**: Total SKU aktif, jumlah barang menipis, transaksi hari ini, 10 mutasi terakhir, dan grafik perbandingan Barang Masuk vs Barang Keluar 30 hari terakhir.
8. **Laporan Resmi PDF & Excel**: Stok per tanggal, barang masuk per periode, barang keluar per periode, kartu stok, dan barang menipis — lengkap dengan kop KDKMP Lubuk Ogung, waktu cetak WIB (`DD/MM/YYYY`), serta blok tanda tangan (*Dibuat oleh* & *Mengetahui Ketua KDKMP*).
9. **Impor Barang CSV/Excel**: Pratinjau validasi baris demi baris dan daftar error detail per baris sebelum disimpan ke database.
10. **Audit Log & Backup Database (Khusus Admin)**: Jejak audit permanen (*siapa, apa, kapan, nilai sebelum/sesudah*) dan tombol unduh cadangan seluruh data gudang.
11. **PWA Mobile-First**: Dapat diinstal ke layar utama HP Android (*Add to Home Screen*), tombol besar nyaman disentuh (`min-h-11`), dan navigasi bawah (*bottom navigation*).

---

## Panduan Langkah demi Langkah (Dari Nol sampai Online Gratis)

### Langkah 1: Buat Database Gratis di Neon PostgreSQL
1. Daftar/masuk ke [https://neon.tech](https://neon.tech) (Gratis tanpa kartu kredit).
2. Buat proyek baru bernama `gudang-lubuk-ogung` (pilih region terdekat, misal **Singapore `ap-southeast-1`**).
3. Pada dashboard proyek Neon, klik **Connect** dan aktifkan opsi **Connection pooling** (`-pooler` di hostname).
4. Salin connection string tersebut, contohnya:
   ```text
   postgresql://neondb_owner:password_anda@ep-contoh-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### Langkah 2: Persiapan di Komputer Lokal
1. Pastikan **Node.js v20+** dan **npm v10+** terpasang.
2. Clone repositori dan pasang dependensi secara deterministik menggunakan `npm ci`:
   ```bash
   git clone https://github.com/aidilfadilah99/gudang-lubuk-ogung.git
   cd gudang-lubuk-ogung
   npm ci
   ```
3. Salin [`.env.example`](file:///d:/Code/gudang-lubuk-ogung/.env.example) menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
4. Isi variabel di dalam `.env`:
   - `DATABASE_URL`: Tempel *pooled connection string* dari Neon.
   - `AUTH_SECRET`: Buat string acak minimal 32 karakter (jalankan `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`).
   - `SEED_ADMIN_USERNAME`: `admin`
   - `SEED_ADMIN_PASSWORD`: Password sementara Admin pertama (minimal 8 karakter, hanya dipakai sekali saat menjalankan seed).

### Langkah 3: Jalankan Migrasi Skema & Seed Data Awal
1. Jalankan migrasi tabel dan indeks ke Neon PostgreSQL:
   ```bash
   npm run db:migrate
   ```
2. Jalankan skrip seed untuk membuat Gudang Utama Lubuk Ogung, satuan dasar (`KG`, `SAK`, `PCS`, `DUS`, `LTR`), kategori awal, dan akun Admin pertama:
   ```bash
   npm run db:seed
   ```
3. Jalankan server pengembangan lokal untuk menguji:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000`.

### Langkah 4: Deploy Gratis ke Vercel Hobby
1. Pastikan kode sudah di-push ke repositori GitHub `https://github.com/aidilfadilah99/gudang-lubuk-ogung.git`.
2. Masuk ke [https://vercel.com](https://vercel.com) (paket **Hobby / Gratis**) dan klik **Add New... -> Project**.
3. Pilih repositori GitHub `gudang-lubuk-ogung`.
4. Pada bagian **Build and Development Settings**:
   - **Framework Preset**: `Next.js`
   - **Install Command**: Ubah menjadi `npm ci` (Wajib agar Vercel menghormati `package-lock.json` secara ketat).
   - **Node.js Version**: Pastikan `20.x` (sesuai `.nvmrc`).
5. Pada bagian **Environment Variables**, tambahkan:
   - `DATABASE_URL` = *(Pooled connection string Neon Anda)*
   - `AUTH_SECRET` = *(Secret acak minimal 32 karakter)*
   - `NEXT_PUBLIC_APP_NAME` = `Gudang KDKMP Lubuk Ogung`
   *(Catatan: `SEED_ADMIN_PASSWORD` tidak perlu dipasang di Vercel setelah seed selesai dijalankan).*
6. Klik **Deploy**. Dalam ~1 menit aplikasi Anda sudah online dengan HTTPS otomatis.

### Langkah 5: Login Pertama Admin & Pengaturan Petugas Gudang
1. Buka URL aplikasi Vercel Anda dari HP Android atau komputer.
2. Login menggunakan `SEED_ADMIN_USERNAME` dan `SEED_ADMIN_PASSWORD` yang Anda gunakan saat menjalankan `npm run db:seed`.
3. Sistem akan **mewajibkan Anda mengganti password sementara** dengan password baru pilihan Anda sebelum dapat mengakses menu gudang.
4. Setelah berhasil masuk:
   - Buka menu **Petugas** (`/users`) untuk menambahkan akun bagi 1–5 Petugas Gudang.
   - Buka menu **Katalog** (`/catalog`) atau **Impor** (`/import`) untuk memasukkan daftar barang koperasi.
   - Pada Chrome di HP Android, ketuk menu pojok kanan atas -> **Tambahkan ke layar utama (Install App)** untuk memasang aplikasi sebagai PWA layar penuh.

---

## Perintah Penting & Verifikasi Kualitas

| Perintah | Fungsi |
| :--- | :--- |
| `npm ci` | Menginstal dependensi secara deterministik dari `package-lock.json` (`ignore-scripts=true`). |
| `npm run check:arch` | Memeriksa aturan arsitektur 4-lapisan, batas 200 baris/file, larangan impor lintas fitur, dan 0 *circular dependency*. |
| `npm run lint` | Menjalankan ESLint (`no-restricted-imports`, `max-lines`, `max-lines-per-function`). |
| `npm run typecheck` | Menjalankan pemeriksaan tipe TypeScript strict (`tsc --noEmit`). |
| `npm test` | Menjalankan seluruh unit test, E2E test, dan pengujian kasus batas (Vitest). |
| `npm run audit` | Memeriksa celah keamanan dependensi (`npm audit --audit-level=high`). |
| `npm run verify` | Menjalankan `npm ci && npm audit signatures`. |

---

## Estimasi Kapasitas Paket Gratis & Kapan Perlu Upgrade

Aplikasi ini dirancang sangat hemat sumber daya (tanpa menyimpan foto/berkas besar di database, menggunakan paginasi dan indeks komposit):

1. **Penyimpanan Database (Neon Free Tier — 0,5 GB / 500 MB)**:
   - Rata-rata 1 baris transaksi mutasi stok (`stock_movements`) + dokumen header/detail + log audit membutuhkan sekitar **~1,2 KB** ruang termasuk indeks.
   - Dengan asumsi **500 SKU** dan **50 transaksi per hari** (~18.250 transaksi/tahun), pertumbuhan data hanya sekitar **~22 MB sampai 30 MB per tahun**.
   - **Kesimpulan**: Kapasitas 500 MB gratis Neon cukup untuk **lebih dari 10 tahun** operasional normal KDKMP Lubuk Ogung.
2. **Jam Komputasi Database (Neon Free Tier — 190 Compute Hours/bulan pada 0.25 CU)**:
   - Karena menggunakan driver serverless `@neondatabase/serverless`, database otomatis *scale-to-zero* (idle) saat gudang tutup di malam hari.
   - Untuk operasional gudang 8–10 jam sehari dengan 1–6 pengguna aktif, pemakaian compute berkisar **60–90 jam/bulan** (masih jauh di bawah batas 190 jam).
3. **Hosting & Fungsi Serverless (Vercel Hobby — Gratis)**:
   - Batas eksekusi fungsi Vercel Hobby (10–60 detik) dan bandwidth (100 GB/bulan) sangat mencukupi untuk 10–50 transaksi/hari serta ekspor laporan PDF/Excel.
4. **Kapan Perlu Upgrade ke Paket Berbayar?**
   - Jika KDKMP Lubuk Ogung berkembang membuka **banyak cabang gudang sekaligus** yang beroperasi 24 jam penuh tanpa jeda *scale-to-zero*.
   - Jika volume transaksi meningkat drastis melebihi **1.000 transaksi/hari** atau mulai menyimpan foto fisik barang beresolusi tinggi.

---

## Dokumentasi Tambahan
- [ARCHITECTURE.md](file:///d:/Code/gudang-lubuk-ogung/ARCHITECTURE.md) — Diagram modul, aturan lapisan, alur transaksi ledger, dan panduan menambah fitur.
- [SECURITY.md](file:///d:/Code/gudang-lubuk-ogung/SECURITY.md) — Tabel dependensi lengkap, aturan `.npmrc`, cara audit, rotasi rahasia, dan panduan 2FA.
- [ADR 001: Stok Berbasis Ledger](file:///d:/Code/gudang-lubuk-ogung/docs/adr/001-ledger-based-stock.md)
- [ADR 002: Arsitektur Modular 4-Lapisan](file:///d:/Code/gudang-lubuk-ogung/docs/adr/002-feature-four-layer-architecture.md)
- [ADR 003: Pembatasan Dependensi & Keamanan Rantai Pasok](file:///d:/Code/gudang-lubuk-ogung/docs/adr/003-dependency-restrictions-supply-chain.md)
