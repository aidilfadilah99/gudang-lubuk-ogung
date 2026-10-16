import { USER_ROLES, UserRole } from '../config/constants';
import { BelumLoginError, TidakBerhakError } from '../lib/errors';
import { getServerSession, SessionUser } from './session';

export function assertAuthenticated(
  session: SessionUser | null
): asserts session is SessionUser {
  if (!session) {
    throw new BelumLoginError();
  }
}

export function assertRole(
  session: SessionUser | null,
  allowedRoles: readonly UserRole[]
): asserts session is SessionUser {
  assertAuthenticated(session);
  if (!allowedRoles.includes(session.role)) {
    throw new TidakBerhakError(
      `Akses ditolak. Peran "${session.role}" tidak diizinkan mengakses fitur ini.`
    );
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getServerSession();
  assertAuthenticated(session);
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getServerSession();
  assertRole(session, [USER_ROLES.ADMIN]);
  return session;
}

export async function requireStaffOrAdmin(): Promise<SessionUser> {
  const session = await getServerSession();
  assertRole(session, [USER_ROLES.ADMIN, USER_ROLES.STAFF]);
  return session;
}
