import { z } from 'zod';

export const createSupplierSchema = z.object({
  code: z.string().min(3, 'Kode supplier minimal 3 karakter').max(20),
  name: z.string().min(3, 'Nama supplier minimal 3 karakter').max(120),
  phone: z.string().max(30).optional(),
  address: z.string().max(250).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
