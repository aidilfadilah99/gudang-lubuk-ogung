import { NextRequest, NextResponse } from 'next/server';
import { createAuthRepository } from '@/features/auth/infrastructure/auth-repository';
import { verifyPassword } from '@/shared/security/password';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const authRepo = createAuthRepository();
    const user = await authRepo.findByUsername(username.trim());

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Akun tidak ditemukan atau tidak aktif.' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Password salah.' },
        { status: 401 }
      );
    }

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
  } catch (error: any) {
    console.error('Error mobile login:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
