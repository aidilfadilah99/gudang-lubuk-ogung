import { UserRole } from '@/shared/config/constants';
import {
  assertCanBackup,
  BackupRepositoryPort,
  serializeBackupToCsvArchive,
  serializeBackupToSqlDump,
} from '../domain/backup';

export async function exportWarehouseBackupUseCase(
  params: {
    warehouseId: string;
    actorRole: UserRole;
    format: 'CSV' | 'SQL';
  },
  deps: { backupRepo: BackupRepositoryPort }
): Promise<{ filename: string; mimeType: string; content: string }> {
  assertCanBackup(params.actorRole);
  const data = await deps.backupRepo.fetchAllWarehouseData(params.warehouseId);
  const datePart = data.exportedAtIso.slice(0, 10);

  if (params.format === 'CSV') {
    return {
      filename: `backup-kdkmp-lubuk-ogung-${datePart}.csv`,
      mimeType: 'text/csv; charset=utf-8',
      content: serializeBackupToCsvArchive(data),
    };
  }

  return {
    filename: `backup-kdkmp-lubuk-ogung-${datePart}.sql`,
    mimeType: 'application/sql; charset=utf-8',
    content: serializeBackupToSqlDump(data),
  };
}
