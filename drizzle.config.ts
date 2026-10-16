import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/shared/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/gudang_lubuk_ogung',
  },
  verbose: true,
  strict: true,
});
