import { z } from 'zod';

export const createStaffSchema = z.object({
  username: z.string().min(3).max(30),
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter').max(100),
  initialPassword: z
    .string()
    .min(8, 'Password awal minimal 8 karakter')
    .max(100),
});

export const toggleStaffStatusSchema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
});

export const resetStaffPasswordSchema = z.object({
  userId: z.string().min(1),
  newTemporaryPassword: z.string().min(8, 'Password sementara minimal 8 karakter'),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
