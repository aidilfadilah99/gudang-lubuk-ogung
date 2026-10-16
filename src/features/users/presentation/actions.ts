'use server';

import { revalidatePath } from 'next/cache';
import {
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin } from '@/shared/security/guard';
import { hashPassword } from '@/shared/security/password';
import { createStaffUseCase } from '../application/create-staff';
import {
  resetStaffPasswordUseCase,
  toggleStaffStatusUseCase,
} from '../application/manage-staff';
import { createUserRepository } from '../infrastructure/user-repository';
import {
  createStaffSchema,
  resetStaffPasswordSchema,
  toggleStaffStatusSchema,
} from '../schemas';

export async function createStaffAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = createStaffSchema.parse(rawInput);
    const created = await createStaffUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        username: parsed.username,
        fullName: parsed.fullName,
        initialPassword: parsed.initialPassword,
      },
      {
        userRepo: createUserRepository(),
        hashPasswordFn: hashPassword,
      }
    );

    await recordAuditLogUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorUsername: session.username,
        action: 'USER_CREATE',
        entityType: 'USER',
        entityId: created.id,
        afterData: { username: created.username, fullName: parsed.fullName },
      },
      { auditRepo: createAuditRepository() }
    );

    revalidatePath('/users');
    return { ok: true as const, data: created };
  } catch (error) {
    return translateDomainError(error);
  }
}

export async function toggleStaffStatusAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = toggleStaffStatusSchema.parse(rawInput);
    await toggleStaffStatusUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorRole: session.role,
        targetUserId: parsed.userId,
        isActive: parsed.isActive,
      },
      { userRepo: createUserRepository() }
    );

    await recordAuditLogUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorUsername: session.username,
        action: 'USER_STATUS_CHANGE',
        entityType: 'USER',
        entityId: parsed.userId,
        afterData: { isActive: parsed.isActive },
      },
      { auditRepo: createAuditRepository() }
    );

    revalidatePath('/users');
    return { ok: true as const };
  } catch (error) {
    return translateDomainError(error);
  }
}

export async function resetStaffPasswordAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = resetStaffPasswordSchema.parse(rawInput);
    await resetStaffPasswordUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        targetUserId: parsed.userId,
        newTemporaryPassword: parsed.newTemporaryPassword,
      },
      {
        userRepo: createUserRepository(),
        hashPasswordFn: hashPassword,
      }
    );

    await recordAuditLogUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorUsername: session.username,
        action: 'USER_PASSWORD_RESET',
        entityType: 'USER',
        entityId: parsed.userId,
      },
      { auditRepo: createAuditRepository() }
    );

    revalidatePath('/users');
    return { ok: true as const };
  } catch (error) {
    return translateDomainError(error);
  }
}
