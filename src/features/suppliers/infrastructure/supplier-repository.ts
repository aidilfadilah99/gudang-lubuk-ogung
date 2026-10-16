import { asc, eq } from 'drizzle-orm';
import { DbExecutor, getDb } from '@/shared/db/client';
import { SupplierRecord, SupplierRepositoryPort } from '../domain/supplier';
import { suppliers } from './schema';

export function createSupplierRepository(
  executor: DbExecutor = getDb()
): SupplierRepositoryPort {
  return {
    async listSuppliers(warehouseId: string): Promise<SupplierRecord[]> {
      return executor
        .select()
        .from(suppliers)
        .where(eq(suppliers.warehouseId, warehouseId))
        .orderBy(asc(suppliers.name));
    },
    async saveSupplier(supplier: SupplierRecord): Promise<void> {
      await executor.insert(suppliers).values(supplier);
    },
  };
}
