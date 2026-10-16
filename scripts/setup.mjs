// Setup otomatis lokal: membuat .env (jika belum ada) lalu migrasi + seed.
// Hanya memakai modul bawaan Node (tanpa dependensi tambahan).
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');

function createEnvFile() {
  const secret = crypto.randomBytes(32).toString('hex');
  const content = [
    '# Dibuat otomatis oleh `npm run setup`. Ganti DATABASE_URL dengan',
    '# connection string Neon (postgresql://...) untuk memakai database cloud.',
    'DATABASE_URL="local-memory"',
    `AUTH_SECRET="${secret}"`,
    'DEFAULT_WAREHOUSE_ID="wh_lubuk_ogung_01"',
    'DEFAULT_WAREHOUSE_NAME="Gudang Utama KDKMP Lubuk Ogung"',
    'SEED_ADMIN_USERNAME="admin"',
    '# SEED_ADMIN_PASSWORD="isi-password-sementara-min-8-karakter"',
    'NEXT_PUBLIC_APP_NAME="Sistem Pergudangan KDKMP Lubuk Ogung"',
    '',
  ].join('\n');
  fs.writeFileSync(envPath, content, { encoding: 'utf8', flag: 'wx' });
  console.log('✅ File .env dibuat (mode local-memory + AUTH_SECRET acak).');
}

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

if (fs.existsSync(envPath)) {
  console.log('ℹ️ File .env sudah ada — tidak diubah.');
} else {
  createEnvFile();
}

run('npm run db:setup');
console.log('\n🎉 Setup selesai. Jalankan `npm run dev` lalu buka http://localhost:3000');
