import { Pool } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { getEnv } from '../config/env';
import { isLocalMemoryMode } from './local-store';
import * as schema from './schema';

export type DbClient = NeonDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type DbExecutor = DbClient | DbTransaction;

let globalPool: Pool | null = null;
let globalDb: DbClient | null = null;

export function getDb(): DbClient {
  if (isLocalMemoryMode()) {
    return {} as DbClient;
  }
  if (globalDb) return globalDb;
  const { DATABASE_URL } = getEnv();
  globalPool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 15_000,
    connectionTimeoutMillis: 10_000,
  });
  globalDb = drizzle(globalPool, { schema });
  return globalDb;
}

export async function withUnitOfWork<T>(
  work: (tx: DbExecutor) => Promise<T>
): Promise<T> {
  if (isLocalMemoryMode()) {
    return work({} as DbExecutor);
  }
  const db = getDb();
  return db.transaction(async (tx) => work(tx));
}
