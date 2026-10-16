import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';

export interface WarehouseFullBackupData {
  warehouseId: string;
  exportedAtIso: string;
  categories: Record<string, unknown>[];
  units: Record<string, unknown>[];
  suppliers: Record<string, unknown>[];
  items: Record<string, unknown>[];
  receipts: Record<string, unknown>[];
  issues: Record<string, unknown>[];
  movements: Record<string, unknown>[];
  adjustments: Record<string, unknown>[];
}

export interface BackupRepositoryPort {
  fetchAllWarehouseData(warehouseId: string): Promise<WarehouseFullBackupData>;
}

export function assertCanBackup(role: UserRole): void {
  if (role !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError(
      'Hanya Admin yang diizinkan melakukan ekspor Backup seluruh data.'
    );
  }
}

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function convertRowsToCsvSection(
  tableName: string,
  rows: Record<string, unknown>[]
): string {
  if (rows.length === 0) return `# TABEL: ${tableName} (0 baris)\n`;
  const headers = Object.keys(rows[0]!);
  const lines = [
    `# TABEL: ${tableName} (${rows.length} baris)`,
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCsvCell(r[h])).join(',')),
  ];
  return lines.join('\n') + '\n';
}

export function serializeBackupToCsvArchive(
  data: WarehouseFullBackupData
): string {
  return [
    `# BACKUP LENGKAP GUDANG KDKMP LUBUK OGUNG (${data.warehouseId})`,
    `# Waktu Ekspor: ${data.exportedAtIso}`,
    '',
    convertRowsToCsvSection('categories', data.categories),
    convertRowsToCsvSection('units', data.units),
    convertRowsToCsvSection('suppliers', data.suppliers),
    convertRowsToCsvSection('items', data.items),
    convertRowsToCsvSection('stock_receipts', data.receipts),
    convertRowsToCsvSection('stock_issues', data.issues),
    convertRowsToCsvSection('stock_movements', data.movements),
    convertRowsToCsvSection('stock_adjustments', data.adjustments),
  ].join('\n');
}

function escapeSqlVal(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  const str =
    val instanceof Date ? val.toISOString() : String(val).replace(/'/g, "''");
  return `'${str}'`;
}

export function serializeBackupToSqlDump(data: WarehouseFullBackupData): string {
  const sections: Array<[string, Record<string, unknown>[]]> = [
    ['categories', data.categories],
    ['units', data.units],
    ['suppliers', data.suppliers],
    ['items', data.items],
    ['stock_receipts', data.receipts],
    ['stock_issues', data.issues],
    ['stock_movements', data.movements],
    ['stock_adjustments', data.adjustments],
  ];
  const lines = [
    `-- SQL BACKUP KDKMP LUBUK OGUNG (${data.warehouseId})`,
    `-- Exported At: ${data.exportedAtIso}`,
    'BEGIN;',
  ];
  for (const [table, rows] of sections) {
    for (const r of rows) {
      const cols = Object.keys(r).map((c) => `"${c}"`).join(', ');
      const vals = Object.values(r).map(escapeSqlVal).join(', ');
      lines.push(
        `INSERT INTO "${table}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;`
      );
    }
  }
  lines.push('COMMIT;');
  return lines.join('\n');
}
