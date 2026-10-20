import { NextRequest, NextResponse } from 'next/server';
import { createAuthRepository } from '@/features/auth';
import { verifyPassword } from '@/shared/security/password';

interface LoginPayload {
  username?: string;
  password?: string;
}

async function verifyCredentials(payload: LoginPayload) {
  const { username, password } = payload;
  if (!username || !password) {
    return { ok: false, status: 400, message: 'Username dan password wajib diisi.' };
  }

  const authRepo = createAuthRepository();
  const user = await authRepo.findByUsername(username.trim());
  if (!user || !user.isActive) {
    return { ok: false, status: 401, message: 'Akun tidak ditemukan atau tidak aktif.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { ok: false, status: 401, message: 'Password salah.' };
  }

  return { ok: true, status: 200, user };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as LoginPayload;
    const authResult = await verifyCredentials(body);

    if (!authResult.ok || !authResult.user) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: authResult.status }
      );
    }

    const { user } = authResult;
    return NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        warehouseId: user.warehouseId,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
