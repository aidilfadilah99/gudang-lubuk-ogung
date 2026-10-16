import crypto from 'node:crypto';
import { UserRole } from '@/shared/config/constants';
import {
  assertCanModifyCatalog,
  CatalogItemRecord,
  CatalogRepositoryPort,
  CategoryRecord,
  UnitRecord,
} from '../domain/catalog';

export async function listCatalogOverviewUseCase(
  params: {
    warehouseId: string;
    search?: string;
    categoryId?: string;
    page: number;
    pageSize: number;
  },
  deps: { catalogRepo: CatalogRepositoryPort }
): Promise<{
  items: CatalogItemRecord[];
  total: number;
  categories: CategoryRecord[];
  units: UnitRecord[];
}> {
  const offset = (params.page - 1) * params.pageSize;
  const [list, categories, units] = await Promise.all([
    deps.catalogRepo.listItems({
      warehouseId: params.warehouseId,
      search: params.search,
      categoryId: params.categoryId,
      limit: params.pageSize,
      offset,
    }),
    deps.catalogRepo.listCategories(params.warehouseId),
    deps.catalogRepo.listUnits(params.warehouseId),
  ]);

  return {
    items: list.items,
    total: list.total,
    categories,
    units,
  };
}

export async function createCategoryUseCase(
  params: {
    warehouseId: string;
    actorRole: UserRole;
    code: string;
    name: string;
    description?: string;
  },
  deps: { catalogRepo: CatalogRepositoryPort }
): Promise<CategoryRecord> {
  assertCanModifyCatalog(params.actorRole);
  const cat: CategoryRecord = {
    id: `cat_${crypto.randomUUID()}`,
    warehouseId: params.warehouseId,
    code: params.code.trim().toUpperCase(),
    name: params.name.trim(),
    description: params.description?.trim() || null,
    isActive: true,
  };
  await deps.catalogRepo.saveCategory(cat);
  return cat;
}

export async function createUnitUseCase(
  params: {
    warehouseId: string;
    actorRole: UserRole;
    code: string;
    name: string;
  },
  deps: { catalogRepo: CatalogRepositoryPort }
): Promise<UnitRecord> {
  assertCanModifyCatalog(params.actorRole);
  const unit: UnitRecord = {
    id: `unit_${crypto.randomUUID()}`,
    warehouseId: params.warehouseId,
    code: params.code.trim().toUpperCase(),
    name: params.name.trim(),
    isActive: true,
  };
  await deps.catalogRepo.saveUnit(unit);
  return unit;
}
