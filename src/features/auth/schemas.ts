import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username wajib diisi').max(50),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
