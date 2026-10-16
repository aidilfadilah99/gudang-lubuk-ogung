import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { DataTidakValidError, TidakBerhakError } from '@/shared/lib/errors';

export interface CategoryRecord {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface UnitRecord {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CatalogItemRecord {
  id: string;
  warehouseId: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryId: string;
  categoryName?: string;
  baseUnitId: string;
  unitCode?: string;
  secondaryUnitName: string | null;
  conversionFactor: number;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  isActive: boolean;
}

export interface CatalogRepositoryPort {
  listCategories(warehouseId: string): Promise<CategoryRecord[]>;
  listUnits(warehouseId: string): Promise<UnitRecord[]>;
  listItems(params: {
    warehouseId: string;
    search?: string;
    categoryId?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: CatalogItemRecord[]; total: number }>;
  findItemById(
    warehouseId: string,
    itemId: string
  ): Promise<CatalogItemRecord | null>;
  saveItem(item: CatalogItemRecord): Promise<void>;
  updateItem(item: CatalogItemRecord): Promise<void>;
  saveCategory(cat: CategoryRecord): Promise<void>;
  saveUnit(unit: UnitRecord): Promise<void>;
}

export function assertCanModifyCatalog(role: UserRole): void {
  if (role !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError(
      'Hanya Admin yang diizinkan menambah/mengubah master barang atau harga.'
    );
  }
}

export function validateItemPricingAndConversion(params: {
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  conversionFactor: number;
}): void {
  if (params.purchasePrice < 0 || params.sellingPrice < 0) {
    throw new DataTidakValidError('Harga beli dan harga jual tidak boleh negatif.');
  }
  if (params.minStock < 0) {
    throw new DataTidakValidError('Stok minimum tidak boleh negatif.');
  }
  if (params.conversionFactor <= 0) {
    throw new DataTidakValidError('Faktor konversi satuan harus lebih dari 0.');
  }
}
