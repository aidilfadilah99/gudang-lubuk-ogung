import { z } from 'zod';

export const receiptLineSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.coerce.number().positive('Jumlah harus lebih dari 0'),
  unitPurchasePrice: z.coerce.number().min(0, 'Harga beli minimal 0'),
});

export const createReceiptSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  supplierId: z.string().min(1, 'Supplier wajib dipilih'),
  invoiceNumber: z
    .string()
    .min(2, 'Nomor faktur/surat jalan wajib diisi')
    .max(80),
  notes: z.string().max(300).optional(),
  lines: z
    .array(receiptLineSchema)
    .min(1, 'Minimal harus ada 1 item barang masuk'),
});

export const voidReceiptSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  receiptId: z.string().min(1),
  voidReason: z
    .string()
    .min(5, 'Alasan void wajib diisi minimal 5 karakter')
    .max(300),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type VoidReceiptInput = z.infer<typeof voidReceiptSchema>;
