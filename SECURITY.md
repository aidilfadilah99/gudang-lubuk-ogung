# Kebijakan Keamanan & Rantai Pasok (Supply Chain Security)

Dokumen ini menjelaskan kebijakan keamanan dependensi, pembaruan paket, pembacaan hasil audit, rotasi kredensial, serta perlindungan akun untuk **Sistem Pergudangan Barang KDKMP Lubuk Ogung**.

---

## 1. Daftar Lengkap Dependensi & Alasan Pemilihan

Kami menerapkan prinsip **minimasi dependensi** dan **versi terkunci eksak** (`save-exact=true` tanpa `^` atau `~` di `package.json`, serta `package-lock.json` `lockfileVersion: 3`). Fitur seperti hashing password (`node:crypto` `scrypt`), tanda tangan sesi (`HMAC-SHA256`), pembuat CSV, dan rate limiter diimplementasikan dengan Web/Node API bawaan untuk memperkecil permukaan serangan (*attack surface*).

### Dependensi Produksi (`dependencies`)

| Nama Paket | Versi Eksak | Fungsi | Alasan Dipilih | Tingkat Pemeliharaan |
| :--- | :--- | :--- | :--- | :--- |
| `next` | `16.4.2` | Framework Web & App Router | Standar utama React Server Components & Server Actions di Vercel; versi 16.4.2 bebas dari CVE lama. | Aktif (Tim Inti Vercel) |
| `react` | `19.3.1` | Pustaka UI inti | Dibutuhkan oleh Next.js 16 untuk rendering Server & Client Component. | Aktif (Meta / Tim React) |
| `react-dom` | `19.3.1` | Binding DOM untuk React | Pasangan wajib `react` untuk peramban web. | Aktif (Meta / Tim React) |
| `@neondatabase/serverless` | `1.2.0` | Driver PostgreSQL Serverless | Mendukung koneksi HTTP & WebSocket Pool (`withUnitOfWork`) yang hemat koneksi pada Neon Free Tier. | Aktif (Resmi Neon) |
| `drizzle-orm` | `0.45.4` | TypeScript ORM ringan | Overhead sangat kecil (0 binary), aman dari SQL injection via parameterized query, cocok untuk serverless cold start. | Aktif (Tim Drizzle) |
| `zod` | `3.25.76` | Validasi skema runtime | Standar industri validasi input form, Server Action, dan environment variables dengan inferensi tipe TypeScript. | Aktif (Colin McDonnell) |
| `exceljs` | `4.4.0` | Pembuatan & pembacaan file `.xlsx` | Mendukung pembuatan laporan Excel rapi dan pembacaan file impor Excel di sisi server. | Stabil & Teruji Luas |
| `jspdf` | `4.2.1` | Pembuatan laporan PDF | Versi 4.2.1 telah menambal celah keamanan lama pada versi 2.x/3.x dan berjalan murni di JavaScript tanpa headless browser berat. | Aktif (Parallax / Komunitas) |
| `jspdf-autotable` | `5.0.9` | Tabel otomatis untuk jsPDF | Memudahkan pencetakan tabel kartu stok, laporan periode, dan blok tanda tangan pada PDF. | Aktif |
| `@zxing/library` | `0.21.3` | Fallback pemindai barcode | Digunakan sebagai fallback kamera saat peramban Android belum mendukung native `BarcodeDetector` API. | Stabil (ZXing Resmi) |
| `@serwist/next` | `9.5.13` | Integrasi PWA Next.js | Menyediakan dukungan Service Worker dan manifest PWA yang terawat untuk Next.js App Router. | Aktif (Tim Serwist) |
| `serwist` | `9.5.13` | Inti Service Worker PWA | Pasangan resmi `@serwist/next` untuk caching aset statis dan mode standalone Android. | Aktif (Tim Serwist) |
| `bcryptjs` | `3.0.2` | Cadangan kompatibilitas hash | Tersedia bersama `node:crypto` `scrypt` murni JS tanpa kompilasi native C++. | Stabil |
| `lucide-react` | `1.57.0` | Ikon UI SVG ringan | Tree-shakeable sehingga hanya ikon yang dipakai yang masuk ke bundel akhir. | Aktif (Komunitas Lucide) |
| `clsx` | `2.1.1` | Utilitas penggabung class CSS | Sangat kecil, tanpa dependensi transisi, standar pasangan `tailwind-merge`. | Stabil (Luke Edwards) |
| `tailwind-merge` | `3.0.2` | Penggabung class Tailwind CSS | Mencegah konflik utilitas CSS pada komponen UI generik (`src/shared/ui`). | Aktif |

### Dependensi Pengembangan (`devDependencies`)

| Nama Paket | Versi Eksak | Fungsi | Alasan Dipilih | Tingkat Pemeliharaan |
| :--- | :--- | :--- | :--- | :--- |
| `typescript` | `5.9.3` | Kompiler & pemeriksa tipe | Menegakkan `strict: true` dan `noUncheckedIndexedAccess: true`. | Aktif (Microsoft) |
| `eslint` | `9.21.0` | Linter kode statis | Menegakkan batas baris (`max-lines`, `max-lines-per-function`) dan larangan impor lintas lapisan (`no-restricted-imports`) tanpa paket tambahan. | Aktif (OpenJS Foundation) |
| `@eslint/js` | `9.21.0` | Aturan dasar ESLint 9 | Konfigurasi standar JavaScript untuk Flat Config ESLint 9. | Aktif (OpenJS Foundation) |
| `typescript-eslint` | `8.71.2` | Parser & aturan ESLint TS | Mendukung pemeriksaan AST TypeScript pada ESLint 9 Flat Config. | Aktif |
| `vitest` | `5.0.5` | Test runner cepat | Menjalankan unit test, edge-case test, dan E2E flow test dengan cepat dan bebas dari kerentanan `vite`/`esbuild` lama. | Aktif (VoidZero / Vitest) |
| `drizzle-kit` | `0.31.11` | Alat bantu skema Drizzle | Digunakan saat pengembangan untuk inspeksi dan pembuatan berkas SQL migrasi. | Aktif (Tim Drizzle) |
| `tsx` | `4.23.15` | Eksekutor skrip TypeScript | Menjalankan skrip CLI `db:migrate` dan `db:seed` secara langsung. | Aktif |
| `tailwindcss` | `4.3.3` | Framework CSS utilitas | Menghasilkan bundel CSS sangat kecil khusus kelas yang digunakan. | Aktif (Tailwind Labs) |
| `@tailwindcss/postcss` | `4.3.3` | Plugin PostCSS Tailwind v4 | Integrasi resmi Tailwind v4 dengan Next.js. | Aktif (Tailwind Labs) |
| `postcss` | `8.5.30` | Pemroses CSS | Dibutuhkan oleh pipeline build Next.js + Tailwind. | Aktif |
| `@types/bcryptjs` | `2.4.6` | Definisi tipe bcryptjs | Pemeriksaan tipe statis TypeScript. | Stabil (DefinitelyTyped) |
| `@types/node` | `22.13.5` | Definisi tipe Node.js | Pemeriksaan tipe untuk API bawaan `node:crypto`, `node:fs`, dll. | Aktif (DefinitelyTyped) |
| `@types/react` | `19.0.10` | Definisi tipe React | Pemeriksaan tipe komponen React 19. | Aktif (DefinitelyTyped) |
| `@types/react-dom` | `19.0.4` | Definisi tipe React DOM | Pemeriksaan tipe React DOM 19. | Aktif (DefinitelyTyped) |

---

## 2. Aturan Ketat `.npmrc` & `ignore-scripts=true`

File [`.npmrc`](file:///d:/Code/gudang-lubuk-ogung/.npmrc) berisi:
```ini
save-exact=true
engine-strict=true
fund=false
ignore-scripts=true
```
- **`ignore-scripts=true`**: Mencegah eksekusi otomatis skrip `preinstall`/`install`/`postinstall` dari paket pihak ketiga yang merupakan vektor serangan rantai pasok (*supply chain malware*) paling umum di ekosistem npm.
- Seluruh dependensi pada proyek ini dipilih agar **tidak memerlukan** kompilasi binary native (`node-gyp`) saat instalasi. Jika di masa mendatang ada paket yang wajib menjalankan install script, jalankan secara eksplisit dengan `npm rebuild <nama-paket> --ignore-scripts=false` setelah menginspeksi kode sumber skrip paket tersebut, lalu dokumentasikan di bagian ini.

---

## 3. Cara Memperbarui Dependensi dengan Aman

1. **Jangan pernah menjalankan `npm update` langsung di branch `main`**.
2. Dependabot telah dikonfigurasi di [`.github/dependabot.yml`](file:///d:/Code/gudang-lubuk-ogung/.github/dependabot.yml) untuk membuka Pull Request setiap hari Senin pagi (WIB).
3. Saat meninjau PR pembaruan dependensi:
   - Periksa perubahan di `package.json` (pastikan versi tetap eksak tanpa `^` atau `~`).
   - Periksa diff `package-lock.json` untuk memastikan URL tarball berasal dari `https://registry.npmjs.org/`.
   - Jalankan verifikasi lokal:
     ```bash
     npm run verify
     npm run audit
     npm run check:arch
     npm run lint
     npm run typecheck
     npm test
     npm run build
     ```
   - **Dilarang mengaktifkan auto-merge** pada PR Dependabot; setiap PR harus dikaji dan disetujui secara manual.

---

## 4. Cara Membaca Hasil `npm audit` dan `npm audit signatures`

- Jalankan pemeriksaan kerentanan:
  ```bash
  npm run audit
  ```
  Perintah ini menjalankan `npm audit --audit-level=high`. Jika keluar kode `0` dan pesan `found 0 vulnerabilities`, maka tidak ada celah keamanan yang diketahui pada pohon dependensi.
- Jalankan pemeriksaan tanda tangan kriptografi paket registri:
  ```bash
  npm run verify
  ```
  Perintah ini menjalankan `npm ci && npm audit signatures` untuk memastikan setiap paket yang diunduh memiliki tanda tangan asli dari kunci publik registri npm (bukan paket yang dimodifikasi di tengah jalan).

---

## 5. Prosedur Rotasi Password Database & `AUTH_SECRET`

Lakukan rotasi rahasia secara berkala (minimal setiap 90 hari) atau segera apabila dicurigai terjadi kebocoran:

### A. Rotasi `AUTH_SECRET` (Kunci Sesi HMAC)
1. Buat nilai acak baru minimal 32 karakter:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```
2. Masuk ke **Vercel Dashboard -> Project Settings -> Environment Variables**.
3. Perbarui nilai `AUTH_SECRET` untuk lingkungan `Production` dan `Preview`.
4. Lakukan **Redeploy** pada deployment terakhir di Vercel.
5. *Dampak*: Seluruh sesi login aktif di HP/peramban petugas akan otomatis keluar dan pengguna cukup login kembali.

### B. Rotasi Password Database Neon (`DATABASE_URL`)
1. Masuk ke **Neon Console -> Project -> Roles & Databases**.
2. Klik **Reset Password** pada role database yang digunakan aplikasi.
3. Salin *Pooled Connection String* (`-pooler`) yang baru.
4. Perbarui variabel `DATABASE_URL` di **Vercel Dashboard -> Environment Variables**.
5. Lakukan **Redeploy** di Vercel dan verifikasi login aplikasi.

---

## 6. Kewajiban Autentikasi Dua Faktor (2FA)

Untuk melindungi rantai pasok dari pengambilalihan akun (*account takeover*), pemilik sistem (Admin KDKMP Lubuk Ogung) **WAJIB** mengaktifkan **2FA (Two-Factor Authentication)** menggunakan aplikasi autentikator (TOTP) atau kunci keamanan perangkat keras (Passkey/WebAuthn) pada ketiga layanan berikut:
1. **GitHub** (tempat kode sumber dan GitHub Actions CI berada).
2. **Vercel** (tempat aplikasi di-deploy dan Environment Variables disimpan).
3. **Neon** (tempat database PostgreSQL koperasi berada).
