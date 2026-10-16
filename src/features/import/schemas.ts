import { z } from 'zod';

export const importCsvRequestSchema = z.object({
  csvContent: z.string().min(5, 'Isi data CSV/Excel tidak boleh kosong'),
  commit: z.boolean().default(false),
});

export type ImportCsvRequestInput = z.infer<typeof importCsvRequestSchema>;
