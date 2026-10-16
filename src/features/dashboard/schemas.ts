import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  warehouseId: z.string().min(1),
});
