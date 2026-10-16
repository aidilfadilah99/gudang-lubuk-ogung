import { eq } from 'drizzle-orm';
import { UserRole } from '@/shared/config/constants';
import { DbExecutor, getDb } from '@/shared/db/client';
import { getLocalStore, isLocalMemoryMode } from '@/shared/db/local-store';
import { AuthRepositoryPort, AuthUserRecord } from '../domain/auth';
import { users } from './schema';

function createLocalAuthRepository(): AuthRepositoryPort {
  return {
    async findByUsername(username: string): Promise<AuthUserRecord | null> {
      const store = getLocalStore();
      return store.users.find((u) => u.username === username) ?? null;
    },
    async findById(id: string): Promise<AuthUserRecord | null> {
      const store = getLocalStore();
      return store.users.find((u) => u.id === id) ?? null;
    },
    async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
      const store = getLocalStore();
      const user = store.users.find((u) => u.id === userId);
      if (user) {
        user.passwordHash = newPasswordHash;
        user.mustChangePassword = false;
      }
    },
  };
}

export function createAuthRepository(
  executor: DbExecutor = getDb()
): AuthRepositoryPort {
  if (isLocalMemoryMode()) return createLocalAuthRepository();
  return {
    async findByUsername(username: string): Promise<AuthUserRecord | null> {
      const rows = await executor
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      return { ...r, role: r.role as UserRole };
    },
    async findById(id: string): Promise<AuthUserRecord | null> {
      const rows = await executor
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      return { ...r, role: r.role as UserRole };
    },
    async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
      await executor
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    },
  };
}
