import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL wajib diisi dengan connection string Neon PostgreSQL'),
  AUTH_SECRET: z
    .string()
    .min(32, 'AUTH_SECRET wajib minimal 32 karakter acak'),
  DEFAULT_WAREHOUSE_ID: z.string().min(1).default('wh_lubuk_ogung_01'),
  DEFAULT_WAREHOUSE_NAME: z
    .string()
    .min(1)
    .default('Gudang Utama KDKMP Lubuk Ogung'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .default('Sistem Pergudangan KDKMP Lubuk Ogung'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const isBuildOrTest =
    process.env.NODE_ENV === 'test' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.CI);

  const raw = {
    DATABASE_URL:
      process.env.DATABASE_URL ??
      (isBuildOrTest
        ? 'postgresql://build:build@ep-build.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
        : undefined),
    AUTH_SECRET:
      process.env.AUTH_SECRET ??
      (isBuildOrTest
        ? 'fallback-build-or-test-secret-minimum-32-chars-safe'
        : undefined),
    DEFAULT_WAREHOUSE_ID:
      process.env.DEFAULT_WAREHOUSE_ID ?? 'wh_lubuk_ogung_01',
    DEFAULT_WAREHOUSE_NAME:
      process.env.DEFAULT_WAREHOUSE_NAME ?? 'Gudang Utama KDKMP Lubuk Ogung',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME ??
      'Sistem Pergudangan KDKMP Lubuk Ogung',
  };

  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Konfigurasi environment tidak valid: ${messages}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
