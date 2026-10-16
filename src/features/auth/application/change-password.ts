import {
  DataTidakDitemukanError,
  DataTidakValidError,
} from '@/shared/lib/errors';
import {
  AuthRepositoryPort,
  validateNewPasswordStrength,
} from '../domain/auth';

export interface ChangePasswordDeps {
  authRepo: AuthRepositoryPort;
  verifyPasswordFn: (plain: string, hash: string) => Promise<boolean>;
  hashPasswordFn: (plain: string) => Promise<string>;
}

export async function changePasswordUseCase(
  input: { userId: string; currentPassword: string; newPassword: string },
  deps: ChangePasswordDeps
): Promise<void> {
  validateNewPasswordStrength(input.newPassword, input.currentPassword);

  const user = await deps.authRepo.findById(input.userId);
  if (!user) {
    throw new DataTidakDitemukanError('Pengguna');
  }

  const matches = await deps.verifyPasswordFn(
    input.currentPassword,
    user.passwordHash
  );
  if (!matches) {
    throw new DataTidakValidError('Password saat ini tidak sesuai.');
  }

  const newHash = await deps.hashPasswordFn(input.newPassword);
  await deps.authRepo.updatePassword(user.id, newHash);
}
