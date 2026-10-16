import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { DataTidakValidError, TidakBerhakError } from '@/shared/lib/errors';

export interface SupplierRecord {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface SupplierRepositoryPort {
  listSuppliers(warehouseId: string): Promise<SupplierRecord[]>;
  saveSupplier(supplier: SupplierRecord): Promise<void>;
}

export function assertCanManageSupplier(role: UserRole): void {
  if (role !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError(
      'Hanya Admin yang diizinkan menambah atau mengubah data Supplier.'
    );
  }
}

export function normalizeSupplierCode(rawCode: string): string {
  const clean = rawCode.trim().toUpperCase();
  if (clean.length < 3 || clean.length > 20) {
    throw new DataTidakValidError(
      'Kode supplier wajib antara 3 hingga 20 karakter.'
    );
  }
  return clean;
}
