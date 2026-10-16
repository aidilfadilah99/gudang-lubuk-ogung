'use server';

import { revalidatePath } from 'next/cache';
import {
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin } from '@/shared/security/guard';
import { previewAndCommitImportUseCase } from '../application/import-items';
import { parseCsvToRawImportRows } from '../domain/import-parser';
import { createImportRepository } from '../infrastructure/import-repository';
import { importCsvRequestSchema } from '../schemas';

export async function processCsvImportAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = importCsvRequestSchema.parse(rawInput);
    const rawRows = parseCsvToRawImportRows(parsed.csvContent);

    const result = await previewAndCommitImportUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        rawRows,
        commit: parsed.commit,
      },
      { importRepo: createImportRepository() }
    );

    if (parsed.commit && result.importedCount > 0) {
      await recordAuditLogUseCase(
        {
          warehouseId: session.warehouseId,
          actorId: session.id,
          actorUsername: session.username,
          action: 'ITEM_IMPORT',
          entityType: 'ITEM_BATCH',
          entityId: `import_${Date.now()}`,
          afterData: { importedCount: result.importedCount },
        },
        { auditRepo: createAuditRepository() }
      );
      revalidatePath('/catalog');
      revalidatePath('/stock');
    }

    return { ok: true as const, data: result };
  } catch (error) {
    return translateDomainError(error);
  }
}
