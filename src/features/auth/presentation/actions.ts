'use server';

import {
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAuth } from '@/shared/security/guard';
import { hashPassword, verifyPassword } from '@/shared/security/password';
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from '@/shared/security/session';
import { changePasswordUseCase } from '../application/change-password';
import { loginUserUseCase } from '../application/login-user';
import { createAuthRepository } from '../infrastructure/auth-repository';
import { changePasswordSchema, loginSchema } from '../schemas';

export async function loginAction(rawInput: unknown) {
  try {
    const parsed = loginSchema.parse(rawInput);
    const authRepo = createAuthRepository();
    const user = await loginUserUseCase(parsed, {
      authRepo,
      verifyPasswordFn: verifyPassword,
    });

    const token = createSessionToken({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      warehouseId: user.warehouseId,
      mustChangePassword: user.mustChangePassword,
    });
    await setSessionCookie(token);

    await recordAuditLogUseCase(
      {
        warehouseId: user.warehouseId,
        actorId: user.id,
        actorUsername: user.username,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
      },
      { auditRepo: createAuditRepository() }
    );

    return { ok: true as const, data: user };
  } catch (error) {
    return translateDomainError(error);
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  return { ok: true as const };
}

export async function changePasswordAction(rawInput: unknown) {
  try {
    const session = await requireAuth();
    const parsed = changePasswordSchema.parse(rawInput);
    await changePasswordUseCase(
      {
        userId: session.id,
        currentPassword: parsed.currentPassword,
        newPassword: parsed.newPassword,
      },
      {
        authRepo: createAuthRepository(),
        verifyPasswordFn: verifyPassword,
        hashPasswordFn: hashPassword,
      }
    );

    const newToken = createSessionToken({
      ...session,
      mustChangePassword: false,
    });
    await setSessionCookie(newToken);

    await recordAuditLogUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorUsername: session.username,
        action: 'USER_PASSWORD_CHANGE',
        entityType: 'USER',
        entityId: session.id,
      },
      { auditRepo: createAuditRepository() }
    );

    return { ok: true as const };
  } catch (error) {
    return translateDomainError(error);
  }
}
