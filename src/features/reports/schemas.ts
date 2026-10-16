import { z } from 'zod';

export const generateReportSchema = z.object({
  kind: z.enum([
    'STOCK_AS_OF',
    'RECEIPTS_PERIOD',
    'ISSUES_PERIOD',
    'STOCK_CARD',
    'LOW_STOCK',
  ]),
  format: z.enum(['PDF', 'EXCEL']).default('PDF'),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  itemId: z.string().optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
