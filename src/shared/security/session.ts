import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { APP_CONSTANTS, UserRole } from '../config/constants';
import { getEnv } from '../config/env';

export interface SessionUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  warehouseId: string;
  mustChangePassword: boolean;
  exp: number;
}

function signPayload(payloadB64: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
}

export function createSessionToken(
  user: Omit<SessionUser, 'exp'>,
  nowMs = Date.now()
): string {
  const { AUTH_SECRET } = getEnv();
  const payload: SessionUser = {
    ...user,
    exp: Math.floor(nowMs / 1000) + APP_CONSTANTS.SESSION_MAX_AGE_SECONDS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const signature = signPayload(payloadB64, AUTH_SECRET);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(
  token: string,
  nowMs = Date.now()
): SessionUser | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const { AUTH_SECRET } = getEnv();
  const expectedSig = signPayload(payloadB64, AUTH_SECRET);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as SessionUser;
    if (decoded.exp < Math.floor(nowMs / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(APP_CONSTANTS.SESSION_COOKIE_NAME)?.value;
  if (!rawToken) return null;
  return verifySessionToken(rawToken);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const { NODE_ENV } = getEnv();
  cookieStore.set(APP_CONSTANTS.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: APP_CONSTANTS.SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(APP_CONSTANTS.SESSION_COOKIE_NAME);
}
