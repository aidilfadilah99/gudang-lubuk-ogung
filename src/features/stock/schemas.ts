import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  quantityDelta: z.coerce
    .number()
    .refine((v) => v !== 0, 'Jumlah penyesuaian tidak boleh 0'),
  reasonCategory: z.enum([
    'RUSAK',
    'HILANG',
    'SELISIH_HITUNG',
    'KOREKSI_ADMIN',
  ]),
  reasonDetail: z
    .string()
    .min(5, 'Alasan detail wajib diisi minimal 5 karakter')
    .max(300),
});

export const stockFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  onlyLowStock: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type StockFilterInput = z.infer<typeof stockFilterSchema>;
