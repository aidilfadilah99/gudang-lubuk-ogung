import { z } from 'zod';

export const upsertItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(2, 'Kode SKU wajib diisi').max(40),
  barcode: z.string().max(50).optional().nullable(),
  name: z.string().min(2, 'Nama barang wajib diisi').max(150),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  baseUnitId: z.string().min(1, 'Satuan dasar wajib dipilih'),
  secondaryUnitName: z.string().max(20).optional().nullable(),
  conversionFactor: z.coerce.number().positive().default(1),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const createCategorySchema = z.object({
  code: z.string().min(2).max(15),
  name: z.string().min(2).max(80),
  description: z.string().max(200).optional(),
});

export const createUnitSchema = z.object({
  code: z.string().min(1).max(10),
  name: z.string().min(2).max(50),
});

export type UpsertItemInput = z.infer<typeof upsertItemSchema>;
