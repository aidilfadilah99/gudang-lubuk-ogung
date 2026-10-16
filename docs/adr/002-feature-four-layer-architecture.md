# ADR 002: Arsitektur Modular Berbasis Fitur 4-Lapisan (Feature-Driven 4-Layer Architecture)

- **Status**: Disetujui
- **Tanggal**: 16/10/2026
- **Konteks**: Aplikasi pergudangan sering berkembang menjadi monolit kusut ketika query database, aturan bisnis, dan komponen React dicampur di dalam Route Handler atau folder global `components/` dan `utils/`.

## Keputusan
1. **Pembagian Modul Berdasarkan Fitur Bisnis (`src/features/<fitur>`)**:
   - Setiap domain fungsional (`auth`, `users`, `catalog`, `suppliers`, `receipts`, `issues`, `stock`, `dashboard`, `reports`, `import`, `backup`, `audit`) diisolasi dalam foldernya sendiri.
2. **Empat Lapisan Internal di Setiap Fitur**:
   - `domain/`: Aturan bisnis murni, tipe entitas, kalkulasi saldo, konversi satuan, aturan void. Bebas dari Drizzle ORM, React, dan Next.js.
   - `application/`: Use-case (1 file = 1 use-case). Menerima dependensi (repository/port, waktu server, transaksi) lewat parameter agar mudah diuji tanpa database nyata.
   - `infrastructure/`: Implementasi repository menggunakan Drizzle ORM dan definisi skema tabel milik fitur tersebut.
   - `presentation/`: Komponen React (Server Component untuk baca data, Client Component kecil untuk form/interaksi/scan barcode) serta Server Action tipis.
3. **Pintu Publik Tunggal (`index.ts`)**:
   - Fitur lain dan layer `src/app` hanya boleh mengimpor suatu fitur melalui `@/features/<nama-fitur>` (`index.ts`). Impor langsung ke subfolder internal dilarang keras.
4. **Batas Anti-Monolit**:
   - Maksimal 200 baris kode aktif per file dan maksimal 40 baris per fungsi, ditegakkan otomatis oleh ESLint dan `scripts/check-arch.mjs`.

## Konsekuensi
- **Positif**: Kode sangat mudah diuji per lapisan, mudah dipelihara, bebas *circular dependency*, dan siap dikembangkan ke Tahap 2 (multi-gudang, stok opname, PO).
- **Negatif**: Membutuhkan disiplin pemecahan file kecil dan kontrak antarmuka (port) yang jelas.
