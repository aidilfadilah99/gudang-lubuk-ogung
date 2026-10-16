import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';
import { StaffUserSummary, UserRepositoryPort } from '../domain/user';
import { createStaffUseCase } from '../application/create-staff';

function createFakeUserRepo(): UserRepositoryPort & {
  store: StaffUserSummary[];
} {
  const store: StaffUserSummary[] = [];
  return {
    store,
    async listByWarehouse() {
      return store;
    },
    async existsByUsername(u) {
      return store.some((x) => x.username === u);
    },
    async insertUser(p) {
      store.push({ ...p, createdAt: new Date() });
    },
    async setActiveStatus() {},
    async resetPasswordHash() {},
  };
}

describe('Fitur Users - Kelola Petugas Gudang', () => {
  it('mengizinkan Admin menambah Petugas Gudang dan menolak Petugas', async () => {
    const repo = createFakeUserRepo();
    await expect(
      createStaffUseCase(
        {
          warehouseId: 'wh_01',
          actorRole: USER_ROLES.STAFF,
          username: 'petugas_baru',
          fullName: 'Petugas Baru',
          initialPassword: 'Password123',
        },
        { userRepo: repo, hashPasswordFn: async (p) => `hash_${p}` }
      )
    ).rejects.toThrow(TidakBerhakError);

    const created = await createStaffUseCase(
      {
        warehouseId: 'wh_01',
        actorRole: USER_ROLES.ADMIN,
        username: 'petugas_baru',
        fullName: 'Petugas Baru',
        initialPassword: 'Password123',
      },
      { userRepo: repo, hashPasswordFn: async (p) => `hash_${p}` }
    );
    expect(created.username).toBe('petugas_baru');
    expect(repo.store).toHaveLength(1);
  });
});
