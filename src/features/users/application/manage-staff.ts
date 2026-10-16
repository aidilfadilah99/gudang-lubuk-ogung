import { UserRole } from '@/shared/config/constants';
import { DataTidakValidError } from '@/shared/lib/errors';
import {
  assertAdminRole,
  StaffUserSummary,
  UserRepositoryPort,
} from '../domain/user';

export async function listStaffUsersUseCase(
  params: { warehouseId: string; actorRole: UserRole },
  deps: { userRepo: UserRepositoryPort }
): Promise<StaffUserSummary[]> {
  assertAdminRole(params.actorRole);
  return deps.userRepo.listByWarehouse(params.warehouseId);
}

export async function toggleStaffStatusUseCase(
  params: {
    warehouseId: string;
    actorId: string;
    actorRole: UserRole;
    targetUserId: string;
    isActive: boolean;
  },
  deps: { userRepo: UserRepositoryPort }
): Promise<void> {
  assertAdminRole(params.actorRole);
  if (params.actorId === params.targetUserId && !params.isActive) {
    throw new DataTidakValidError(
      'Admin tidak dapat menonaktifkan akunnya sendiri.'
    );
  }
  await deps.userRepo.setActiveStatus(
    params.warehouseId,
    params.targetUserId,
    params.isActive
  );
}

export async function resetStaffPasswordUseCase(
  params: {
    warehouseId: string;
    actorRole: UserRole;
    targetUserId: string;
    newTemporaryPassword: string;
  },
  deps: {
    userRepo: UserRepositoryPort;
    hashPasswordFn: (plain: string) => Promise<string>;
  }
): Promise<void> {
  assertAdminRole(params.actorRole);
  if (params.newTemporaryPassword.length < 8) {
    throw new DataTidakValidError('Password sementara minimal 8 karakter.');
  }
  const hash = await deps.hashPasswordFn(params.newTemporaryPassword);
  await deps.userRepo.resetPasswordHash(
    params.warehouseId,
    params.targetUserId,
    hash
  );
}
