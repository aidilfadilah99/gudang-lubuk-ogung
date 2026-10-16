import { UserRole } from '@/shared/config/constants';
import { DataTidakValidError, TidakBerhakError } from '@/shared/lib/errors';

export interface AuthUserRecord {
  id: string;
  warehouseId: string;
  username: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface AuthRepositoryPort {
  findByUsername(username: string): Promise<AuthUserRecord | null>;
  findById(id: string): Promise<AuthUserRecord | null>;
  updatePassword(userId: string, newPasswordHash: string): Promise<void>;
}

export function assertAccountCanLogin(user: AuthUserRecord | null): asserts user is AuthUserRecord {
  if (!user) {
    throw new DataTidakValidError('Username atau password salah.');
  }
  if (!user.isActive) {
    throw new TidakBerhakError(
      'Akun Anda telah dinonaktifkan oleh Admin. Hubungi pemilik sistem.'
    );
  }
}

export function validateNewPasswordStrength(
  newPassword: string,
  oldPassword?: string
): void {
  if (newPassword.length < 8) {
    throw new DataTidakValidError(
      'Password baru wajib minimal 8 karakter.'
    );
  }
  if (oldPassword && newPassword === oldPassword) {
    throw new DataTidakValidError(
      'Password baru tidak boleh sama dengan password lama.'
    );
  }
}
