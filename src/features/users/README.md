# Fitur `users` (Kelola Petugas Gudang)

## Tujuan
Memungkinkan Admin mengelola akun Petugas Gudang (menambah akun baru, menonaktifkan/mengaktifkan kembali akun petugas, serta me-reset password petugas).

## Tabel yang Dimiliki
- `users`

## Public API (`src/features/users/index.ts`)
- `createStaffUseCase`: Membuat akun Petugas Gudang baru (khusus Admin).
- `listStaffUsersUseCase`, `toggleStaffStatusUseCase`, `resetStaffPasswordUseCase`.
- `UserManagementView`: Komponen antarmuka kelola pengguna.

## Aturan Bisnis Utama
1. Hanya peran `ADMIN` yang boleh menambah, menonaktifkan, atau me-reset password petugas.
2. Admin tidak diizinkan menonaktifkan akunnya sendiri.
