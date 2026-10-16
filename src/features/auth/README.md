# Fitur `auth` (Autentikasi, Rate Limit, Sesi & Ganti Password)

## Tujuan
Menangani login, logout, proteksi brute-force (*rate limiting*), validasi status aktif pengguna, pembuatan cookie sesi (`httpOnly`, `secure`, `sameSite=lax`), dan kewajiban ganti password saat login pertama Admin.

## Tabel yang Dimiliki / Diakses
- `users`

## Public API (`src/features/auth/index.ts`)
- `loginUserUseCase`: Memvalidasi kredensial, rate limit, dan status aktif.
- `changePasswordUseCase`: Mengubah password pengguna dan mematikan flag `mustChangePassword`.
- `LoginForm`, `ChangePasswordForm`, `loginAction`, `logoutAction`, `changePasswordAction`.

## Aturan Bisnis Utama
1. Maksimal 5 percobaan gagal dalam 15 menit per username sebelum dikunci sementara.
2. Akun yang dinonaktifkan (`isActive = false`) ditolak masuk.
3. Admin hasil seed wajib mengganti password pada login pertama.
