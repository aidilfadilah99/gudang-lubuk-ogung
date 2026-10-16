import crypto from 'node:crypto';
import { UserRole } from '@/shared/config/constants';
import {
  assertCanManageSupplier,
  normalizeSupplierCode,
  SupplierRecord,
  SupplierRepositoryPort,
} from '../domain/supplier';

export async function listSuppliersUseCase(
  warehouseId: string,
  deps: { supplierRepo: SupplierRepositoryPort }
): Promise<SupplierRecord[]> {
  return deps.supplierRepo.listSuppliers(warehouseId);
}

export async function createSupplierUseCase(
  params: {
    warehouseId: string;
    actorRole: UserRole;
    code: string;
    name: string;
    phone?: string;
    address?: string;
  },
  deps: { supplierRepo: SupplierRepositoryPort; now?: () => Date }
): Promise<SupplierRecord> {
  assertCanManageSupplier(params.actorRole);
  const code = normalizeSupplierCode(params.code);

  const record: SupplierRecord = {
    id: `sup_${crypto.randomUUID()}`,
    warehouseId: params.warehouseId,
    code,
    name: params.name.trim(),
    phone: params.phone?.trim() || null,
    address: params.address?.trim() || null,
    isActive: true,
    createdAt: deps.now ? deps.now() : new Date(),
  };

  await deps.supplierRepo.saveSupplier(record);
  return record;
}
