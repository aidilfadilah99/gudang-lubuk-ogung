# Fitur `audit` (Jejak Audit & Idempotency)

## Tujuan
Mencatat seluruh perubahan penting (siapa, tindakan apa, kapan, nilai sebelum & sesudah) serta menjaga idempotensi transaksi agar klik ganda pada jaringan HP yang tidak stabil tidak menyimpan transaksi dua kali.

## Tabel yang Dimiliki
- `audit_logs`
- `idempotency_keys`

## Public API (`src/features/audit/index.ts`)
- `recordAuditLogUseCase`: Menyimpan jejak audit baru.
- `listAuditLogsUseCase`: Menampilkan daftar audit log terpaginasi (khusus Admin).
- `claimIdempotencyKey`: Memvalidasi dan mengklaim kunci idempotensi di dalam transaksi database.
- `AuditLogTable`: Komponen tampilan daftar audit log.

## Aturan Bisnis Utama
1. Hanya peran `ADMIN` yang diizinkan membaca daftar audit log.
2. Catatan audit bersifat *append-only* dan tidak pernah dihapus.
