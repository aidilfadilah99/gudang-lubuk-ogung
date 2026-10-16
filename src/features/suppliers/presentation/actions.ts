'use server';

import { revalidatePath } from 'next/cache';
import {
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin } from '@/shared/security/guard';
import { createSupplierUseCase } from '../application/manage-suppliers';
import { createSupplierRepository } from '../infrastructure/supplier-repository';
import { createSupplierSchema } from '../schemas';

export async function createSupplierAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = createSupplierSchema.parse(rawInput);
    const created = await createSupplierUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        ...parsed,
      },
      { supplierRepo: createSupplierRepository() }
    );

    await recordAuditLogUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorUsername: session.username,
        action: 'SUPPLIER_CREATE',
        entityType: 'SUPPLIER',
        entityId: created.id,
        afterData: created,
      },
      { auditRepo: createAuditRepository() }
    );

    revalidatePath('/suppliers');
    revalidatePath('/receipts');
    return { ok: true as const, data: created };
  } catch (error) {
    return translateDomainError(error);
  }
}
