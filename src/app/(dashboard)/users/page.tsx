import React from 'react';
import { ChangePasswordForm } from '@/features/auth';
import {
  createUserRepository,
  listStaffUsersUseCase,
  UserManagementView,
} from '@/features/users';
import { USER_ROLES } from '@/shared/config/constants';
import { requireStaffOrAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function UsersPage(): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const isAdmin = session.role === USER_ROLES.ADMIN;

  const users = isAdmin
    ? await listStaffUsersUseCase(
        { warehouseId: session.warehouseId, actorRole: session.role },
        { userRepo: createUserRepository() }
      )
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">
          {isAdmin ? 'Kelola Petugas Gudang & Keamanan Akun' : 'Keamanan Akun Saya'}
        </h2>
        <p className="text-xs text-slate-600">
          Ganti password akun dan kelola hak akses petugas gudang
        </p>
      </div>
      <ChangePasswordForm mustChangePassword={session.mustChangePassword} />
      {isAdmin && <UserManagementView users={users} />}
    </div>
  );
}
