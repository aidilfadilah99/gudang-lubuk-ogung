import crypto from 'node:crypto';
import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { DataTidakValidError } from '@/shared/lib/errors';
import {
  assertAdminRole,
  normalizeStaffUsername,
  UserRepositoryPort,
} from '../domain/user';

export interface CreateStaffUseCaseInput {
  warehouseId: string;
  actorRole: UserRole;
  username: string;
  fullName: string;
  initialPassword: string;
}

export async function createStaffUseCase(
  input: CreateStaffUseCaseInput,
  deps: {
    userRepo: UserRepositoryPort;
    hashPasswordFn: (plain: string) => Promise<string>;
  }
): Promise<{ id: string; username: string }> {
  assertAdminRole(input.actorRole);
  const username = normalizeStaffUsername(input.username);

  const taken = await deps.userRepo.existsByUsername(username);
  if (taken) {
    throw new DataTidakValidError(
      `Username "${username}" sudah terdaftar. Gunakan username lain.`
    );
  }

  const passwordHash = await deps.hashPasswordFn(input.initialPassword);
  const id = `usr_${crypto.randomUUID()}`;

  await deps.userRepo.insertUser({
    id,
    warehouseId: input.warehouseId,
    username,
    fullName: input.fullName.trim(),
    passwordHash,
    role: USER_ROLES.STAFF,
    isActive: true,
    mustChangePassword: true,
  });

  return { id, username };
}
