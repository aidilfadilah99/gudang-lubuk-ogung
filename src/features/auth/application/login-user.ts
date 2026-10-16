import { DataTidakValidError } from '@/shared/lib/errors';
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginAttempts,
} from '@/shared/security/rate-limit';
import {
  assertAccountCanLogin,
  AuthRepositoryPort,
  AuthUserRecord,
} from '../domain/auth';

export interface LoginUseCaseDeps {
  authRepo: AuthRepositoryPort;
  verifyPasswordFn: (plain: string, hash: string) => Promise<boolean>;
}

export async function loginUserUseCase(
  input: { username: string; password: string },
  deps: LoginUseCaseDeps
): Promise<Omit<AuthUserRecord, 'passwordHash'>> {
  const normalizedUsername = input.username.trim().toLowerCase();
  const rateKey = `login_${normalizedUsername}`;
  checkLoginRateLimit(rateKey);

  const user = await deps.authRepo.findByUsername(normalizedUsername);
  if (!user) {
    recordLoginFailure(rateKey);
    throw new DataTidakValidError('Username atau password salah.');
  }

  const isPasswordValid = await deps.verifyPasswordFn(
    input.password,
    user.passwordHash
  );
  if (!isPasswordValid) {
    recordLoginFailure(rateKey);
    throw new DataTidakValidError('Username atau password salah.');
  }

  assertAccountCanLogin(user);
  resetLoginAttempts(rateKey);

  return {
    id: user.id,
    warehouseId: user.warehouseId,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
}
