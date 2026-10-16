# ADR 003: Pembatasan Dependensi & Keamanan Supply Chain

- **Status**: Disetujui
- **Tanggal**: 16/10/2026
- **Konteks**: Serangan *supply chain* pada ekosistem npm (typosquatting, malicious postinstall scripts, pembaruan otomatis semver `^`/`~` yang menyusupkan kode berbahaya) merupakan risiko keamanan utama bagi sistem operasional koperasi.

## Keputusan
1. **Satu Package Manager & Lockfile v3**:
   - Hanya menggunakan `npm` dan mewajibkan `package-lock.json` (`lockfileVersion: 3`) masuk ke dalam repositori Git.
2. **Pinning Versi Eksak & Larangan Postinstall Script**:
   - `.npmrc` dikonfigurasi dengan `save-exact=true`, `engine-strict=true`, `fund=false`, dan `ignore-scripts=true`.
   - Seluruh dependensi di `package.json` ditulis dengan versi eksak tanpa awalan `^` atau `~`.
3. **Minimalisasi Paket Pihak Ketiga**:
   - Mengutamakan Web API / Node.js API bawaan (`crypto`, `Intl.NumberFormat`, `Intl.DateTimeFormat`, `BarcodeDetector`).
   - Memilih `bcryptjs` murni JavaScript dibandingkan modul C++ native agar `ignore-scripts=true` tetap berjalan tanpa kompromi.
   - Menggunakan ESLint bawaan (`no-restricted-imports`, `max-lines`, `max-lines-per-function`) serta skrip Node murni `scripts/check-arch.mjs` tanpa menambah paket arsitektur pihak ketiga yang berat.
4. **Verifikasi Otomatis di CI**:
   - Setiap Pull Request wajib lulus `npm ci`, `npm audit --audit-level=high`, `npm run check:arch`, `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build`.

## Konsekuensi
- **Positif**: Permukaan serangan (*attack surface*) sangat kecil, build bersifat deterministik 100% antara lokal, GitHub Actions, dan Vercel Hobby.
- **Negatif**: Pembaruan versi dependensi dilakukan secara terukur melalui PR mingguan Dependabot yang dikaji manual.
