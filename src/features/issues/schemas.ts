import { z } from 'zod';

export const issueLineSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  quantity: z.coerce.number().positive('Jumlah keluar harus lebih dari 0'),
  unitSellingPrice: z.coerce.number().min(0).default(0),
});

export const createIssueSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  destinationType: z.enum(['ANGGOTA', 'UMUM', 'INTERNAL']),
  recipientName: z
    .string()
    .min(2, 'Nama penerima wajib diisi minimal 2 karakter')
    .max(100),
  notes: z.string().max(300).optional(),
  lines: z
    .array(issueLineSchema)
    .min(1, 'Minimal harus ada 1 item barang keluar'),
});

export const voidIssueSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  issueId: z.string().min(1),
  voidReason: z
    .string()
    .min(5, 'Alasan void wajib diisi minimal 5 karakter')
    .max(300),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type VoidIssueInput = z.infer<typeof voidIssueSchema>;
