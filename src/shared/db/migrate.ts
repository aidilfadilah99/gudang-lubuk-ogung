import fs from 'node:fs';
import path from 'node:path';
import { Pool } from '@neondatabase/serverless';

async function runMigration(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      'DATABASE_URL belum diatur. Pastikan variabel environment DATABASE_URL sudah diset.'
    );
  }

  const sqlPath = path.resolve(
    process.cwd(),
    'drizzle/migrations/0000_initial_schema.sql'
  );
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  const pool = new Pool({ connectionString: dbUrl });
  try {
    console.log('🚀 Menjalankan migrasi database ke Neon PostgreSQL...');
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
