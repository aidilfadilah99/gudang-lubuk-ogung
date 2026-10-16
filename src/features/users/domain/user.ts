import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { DataTidakValidError, TidakBerhakError } from '@/shared/lib/errors';

export interface StaffUserSummary {
  id: string;
  warehouseId: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface UserRepositoryPort {
  listByWarehouse(warehouseId: string): Promise<StaffUserSummary[]>;
  existsByUsername(username: string): Promise<boolean>;
  insertUser(params: {
    id: string;
    warehouseId: string;
    username: string;
    fullName: string;
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
    mustChangePassword: boolean;
  }): Promise<void>;
  setActiveStatus(
    warehouseId: string,
    userId: string,
    isActive: boolean
  ): Promise<void>;
  resetPasswordHash(
    warehouseId: string,
    userId: string,
    passwordHash: string
  ): Promise<void>;
}

export function assertAdminRole(actorRole: UserRole): void {
  if (actorRole !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError(
      'Hanya Admin yang dapat mengelola akun Petugas Gudang.'
    );
  }
}

export function normalizeStaffUsername(rawUsername: string): string {
  const clean = rawUsername.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
    throw new DataTidakValidError(
      'Username hanya boleh berisi huruf kecil, angka, atau garis bawah (3-30 karakter).'
    );
  }
  return clean;
}
