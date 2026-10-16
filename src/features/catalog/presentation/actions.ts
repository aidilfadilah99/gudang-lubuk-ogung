'use server';

import { revalidatePath } from 'next/cache';
import {
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin } from '@/shared/security/guard';
import { createOrUpdateItemUseCase } from '../application/manage-items';
import {
  createCategoryUseCase,
  createUnitUseCase,
} from '../application/manage-masters';
import { createCatalogRepository } from '../infrastructure/catalog-repository';
import {
  createCategorySchema,
  createUnitSchema,
  upsertItemSchema,
} from '../schemas';

export async function upsertCatalogItemAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = upsertItemSchema.parse(rawInput);
    const { item, before } = await createOrUpdateItemUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        input: parsed,
      },
      { catalogRepo: createCatalogRepository() }
    );

    await recordAuditLogUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorUsername: session.username,
        action: before ? 'ITEM_UPDATE' : 'ITEM_CREATE',
        entityType: 'ITEM',
        entityId: item.id,
        beforeData: before,
        afterData: item,
      },
      { auditRepo: createAuditRepository() }
    );

    revalidatePath('/catalog');
    revalidatePath('/stock');
    return { ok: true as const, data: item };
  } catch (error) {
    return translateDomainError(error);
  }
}

export async function createCategoryAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = createCategorySchema.parse(rawInput);
    const cat = await createCategoryUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        ...parsed,
      },
      { catalogRepo: createCatalogRepository() }
    );
    revalidatePath('/catalog');
    return { ok: true as const, data: cat };
  } catch (error) {
    return translateDomainError(error);
  }
}

export async function createUnitAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = createUnitSchema.parse(rawInput);
    const unit = await createUnitUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        ...parsed,
      },
      { catalogRepo: createCatalogRepository() }
    );
    revalidatePath('/catalog');
    return { ok: true as const, data: unit };
  } catch (error) {
    return translateDomainError(error);
  }
}
