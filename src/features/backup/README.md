# Fitur `backup` (Ekspor Backup Seluruh Data oleh Admin)

## Tujuan
Menyediakan tombol ekspor satu-klik bagi Admin untuk mengunduh seluruh data gudang (`categories`, `units`, `suppliers`, `items`, `stock_receipts`, `stock_issues`, `stock_movements`, `stock_adjustments`) dalam format SQL dump (`.sql`) atau arsip CSV (`.csv`).

## Public API (`src/features/backup/index.ts`)
- `exportWarehouseBackupUseCase`
- `serializeBackupToSqlDump`, `serializeBackupToCsvArchive`
- `BackupView`
