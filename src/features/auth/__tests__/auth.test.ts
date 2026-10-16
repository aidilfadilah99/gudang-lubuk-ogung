import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { DataTidakValidError, TidakBerhakError } from '@/shared/lib/errors';
import { resetLoginAttempts } from '@/shared/security/rate-limit';
import { AuthRepositoryPort, AuthUserRecord } from '../domain/auth';
import { loginUserUseCase } from '../application/login-user';
import { changePasswordUseCase } from '../application/change-password';

function createFakeAuthRepo(initialUser: AuthUserRecord): AuthRepositoryPort {
  let user = { ...initialUser };
  return {
    async findByUsername(u) {
      return u === user.username ? user : null;
    },
    async findById(id) {
      return id === user.id ? user : null;
    },
    async updatePassword(_, newHash) {
      user = { ...user, passwordHash: newHash, mustChangePassword: false };
    },
  };
}

describe('Fitur Auth - Login, Rate Limit & Ganti Password', () => {
  it('berhasil login dengan kredensial valid dan menolak password salah', async () => {
    resetLoginAttempts('login_admin');
    const repo = createFakeAuthRepo({
      id: 'usr_1',
      warehouseId: 'wh_01',
      username: 'admin',
      fullName: 'Admin',
      passwordHash: 'hashed_secret123',
      role: USER_ROLES.ADMIN,
      isActive: true,
      mustChangePassword: true,
    });

    const loggedIn = await loginUserUseCase(
      { username: 'admin', password: 'secret123' },
      {
        authRepo: repo,
        verifyPasswordFn: async (p, h) => h === `hashed_${p}`,
      }
    );
    expect(loggedIn.mustChangePassword).toBe(true);

    await expect(
      loginUserUseCase(
        { username: 'admin', password: 'wrong' },
        {
          authRepo: repo,
          verifyPasswordFn: async (p, h) => h === `hashed_${p}`,
        }
      )
    ).rejects.toThrow(DataTidakValidError);
  });

  it('menolak login akun yang nonaktif dan mengizinkan ganti password', async () => {
    resetLoginAttempts('login_petugas_nonaktif');
    const inactiveRepo = createFakeAuthRepo({
      id: 'usr_2',
      warehouseId: 'wh_01',
      username: 'petugas_nonaktif',
      fullName: 'Petugas Nonaktif',
      passwordHash: 'hashed_12345678',
      role: USER_ROLES.STAFF,
      isActive: false,
      mustChangePassword: false,
    });

    await expect(
      loginUserUseCase(
        { username: 'petugas_nonaktif', password: '12345678' },
        {
          authRepo: inactiveRepo,
          verifyPasswordFn: async (p, h) => h === `hashed_${p}`,
        }
      )
    ).rejects.toThrow(TidakBerhakError);

    await changePasswordUseCase(
      {
        userId: 'usr_2',
        currentPassword: '12345678',
        newPassword: 'PasswordBaruAman99',
      },
      {
        authRepo: inactiveRepo,
        verifyPasswordFn: async (p, h) => h === `hashed_${p}`,
        hashPasswordFn: async (p) => `hashed_${p}`,
      }
    );
  });
});
