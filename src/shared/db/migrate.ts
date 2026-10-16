import fs from 'node:fs';
import path from 'node:path';
import { Pool } from '@neondatabase/serverless';

function loadDotEnvIfNeeded(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

async function runMigration(): Promise<void> {
  loadDotEnvIfNeeded();
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl === 'local-memory') {
    console.log('ℹ️ Mode local-memory aktif — melewati migrasi SQL eksternal.');
    return;
  }

  const sqlPath = path.resolve(
    process.cwd(),
    'drizzle/migrations/0000_initial_schema.sql'
  );
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  const pool = new Pool({ connectionString: dbUrl });
  try {
    console.log('🚀 Menjalankan migrasi database otomatis ke Neon PostgreSQL...');
    await pool.query(sqlContent);
    console.log('✅ Migrasi database selesai dengan sukses.');
  } finally {
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error('❌ Gagal menjalankan migrasi:', err);
  process.exit(1);
});
