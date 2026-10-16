import { z } from 'zod';

export const backupQuerySchema = z.object({
  format: z.enum(['CSV', 'SQL']).default('SQL'),
});
