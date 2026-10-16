import { and, asc, eq } from 'drizzle-orm';
import { UserRole } from '@/shared/config/constants';
import { DbExecutor, getDb } from '@/shared/db/client';
import { getLocalStore, isLocalMemoryMode } from '@/shared/db/local-store';
import { StaffUserSummary, UserRepositoryPort } from '../domain/user';
import { users } from './schema';

function createLocalUserRepository(): UserRepositoryPort {
  return {
    async listByWarehouse(whId) {
      return getLocalStore()
        .users.filter((u) => u.warehouseId === whId)
        .sort((a, b) => a.username.localeCompare(b.username));
    },
    async existsByUsername(username) {
      return getLocalStore().users.some((u) => u.username === username);
    },
    async insertUser(p) {
      getLocalStore().users.push({ ...p, createdAt: new Date() });
    },
    async setActiveStatus(whId, userId, isActive) {
      const u = getLocalStore().users.find(
        (x) => x.warehouseId === whId && x.id === userId
      );
      if (u) u.isActive = isActive;
    },
    async resetPasswordHash(whId, userId, passwordHash) {
      const u = getLocalStore().users.find(
        (x) => x.warehouseId === whId && x.id === userId
      );
      if (u) {
        u.passwordHash = passwordHash;
        u.mustChangePassword = true;
      }
    },
  };
}

async function queryWarehouseUsers(
  executor: DbExecutor,
  warehouseId: string
): Promise<StaffUserSummary[]> {
  const rows = await executor
    .select({
      id: users.id,
      warehouseId: users.warehouseId,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.warehouseId, warehouseId))
    .orderBy(asc(users.username));
  return rows.map((r) => ({ ...r, role: r.role as UserRole }));
}

export function createUserRepository(
  executor: DbExecutor = getDb()
): UserRepositoryPort {
  if (isLocalMemoryMode()) return createLocalUserRepository();
  return {
    listByWarehouse: (whId) => queryWarehouseUsers(executor, whId),
    async existsByUsername(username: string): Promise<boolean> {
      const rows = await executor
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      return rows.length > 0;
    },
    async insertUser(p): Promise<void> {
      await executor.insert(users).values(p);
    },
    async setActiveStatus(warehouseId, userId, isActive): Promise<void> {
      await executor
        .update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(and(eq(users.warehouseId, warehouseId), eq(users.id, userId)));
    },
    async resetPasswordHash(warehouseId, userId, passwordHash): Promise<void> {
      await executor
        .update(users)
        .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
        .where(and(eq(users.warehouseId, warehouseId), eq(users.id, userId)));
    },
  };
}
