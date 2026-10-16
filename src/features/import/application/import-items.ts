import { UserRole } from '@/shared/config/constants';
import { DataTidakValidError } from '@/shared/lib/errors';
import {
  assertCanImportCatalog,
  ImportPreviewResult,
  ImportRepositoryPort,
  RawImportRow,
  validateImportBatch,
} from '../domain/import-parser';

export async function previewAndCommitImportUseCase(
  params: {
    warehouseId: string;
    actorRole: UserRole;
    rawRows: RawImportRow[];
    commit: boolean;
  },
  deps: { importRepo: ImportRepositoryPort }
): Promise<ImportPreviewResult & { importedCount: number }> {
  assertCanImportCatalog(params.actorRole);
  if (params.rawRows.length === 0) {
    throw new DataTidakValidError(
      'File impor kosong atau format header tidak sesuai.'
    );
  }

  const maps = await deps.importRepo.getCategoryAndUnitMaps(params.warehouseId);
  const preview = validateImportBatch(
    params.rawRows,
    new Set(maps.categoryByCode.keys()),
    new Set(maps.unitByCode.keys())
  );

  if (!params.commit || preview.invalidRows.length > 0) {
    return { ...preview, importedCount: 0 };
  }

  const mappedRows = preview.validRows.map((r) => ({
    ...r,
    categoryId: maps.categoryByCode.get(r.categoryCode)!,
    baseUnitId: maps.unitByCode.get(r.unitCode)!,
  }));

  const importedCount = await deps.importRepo.upsertImportedItems(
    params.warehouseId,
    mappedRows
  );

  return { ...preview, importedCount };
}
