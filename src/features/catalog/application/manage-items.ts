import crypto from 'node:crypto';
import { UserRole } from '@/shared/config/constants';
import { DataTidakDitemukanError } from '@/shared/lib/errors';
import {
  assertCanModifyCatalog,
  CatalogItemRecord,
  CatalogRepositoryPort,
  validateItemPricingAndConversion,
} from '../domain/catalog';
import { UpsertItemInput } from '../schemas';

function buildCatalogItemRecord(
  itemId: string,
  warehouseId: string,
  input: UpsertItemInput
): CatalogItemRecord {
  return {
    id: itemId,
    warehouseId,
    sku: input.sku.trim().toUpperCase(),
    barcode: input.barcode?.trim() || null,
    name: input.name.trim(),
    categoryId: input.categoryId,
    baseUnitId: input.baseUnitId,
    secondaryUnitName: input.secondaryUnitName?.trim() || null,
    conversionFactor: input.conversionFactor,
    purchasePrice: input.purchasePrice,
    sellingPrice: input.sellingPrice,
    minStock: input.minStock,
    isActive: input.isActive,
  };
}

export async function createOrUpdateItemUseCase(
  params: {
    warehouseId: string;
    actorRole: UserRole;
    input: UpsertItemInput;
  },
  deps: { catalogRepo: CatalogRepositoryPort }
): Promise<{ item: CatalogItemRecord; before: CatalogItemRecord | null }> {
  assertCanModifyCatalog(params.actorRole);
  validateItemPricingAndConversion(params.input);

  const itemId = params.input.id || `item_${crypto.randomUUID()}`;
  const before = params.input.id
    ? await deps.catalogRepo.findItemById(params.warehouseId, params.input.id)
    : null;
  if (params.input.id && !before) throw new DataTidakDitemukanError('Barang');

  const record = buildCatalogItemRecord(itemId, params.warehouseId, params.input);
  if (before) {
    await deps.catalogRepo.updateItem(record);
  } else {
    await deps.catalogRepo.saveItem(record);
  }
  return { item: record, before };
}
