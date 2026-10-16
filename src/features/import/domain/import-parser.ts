import { USER_ROLES, UserRole } from '@/shared/config/constants';
import { TidakBerhakError } from '@/shared/lib/errors';

export interface RawImportRow {
  rowNumber: number;
  sku: string;
  barcode?: string;
  name: string;
  categoryCode: string;
  unitCode: string;
  purchasePrice: string | number;
  sellingPrice: string | number;
  minStock?: string | number;
}

export interface ValidatedImportRow {
  rowNumber: number;
  sku: string;
  barcode: string | null;
  name: string;
  categoryCode: string;
  unitCode: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
}

export interface ImportRowError {
  rowNumber: number;
  sku: string;
  errors: string[];
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: ValidatedImportRow[];
  invalidRows: ImportRowError[];
}

export interface ImportRepositoryPort {
  getCategoryAndUnitMaps(warehouseId: string): Promise<{
    categoryByCode: Map<string, string>;
    unitByCode: Map<string, string>;
  }>;
  upsertImportedItems(
    warehouseId: string,
    rows: Array<
      ValidatedImportRow & { categoryId: string; baseUnitId: string }
    >
  ): Promise<number>;
}

export function assertCanImportCatalog(role: UserRole): void {
  if (role !== USER_ROLES.ADMIN) {
    throw new TidakBerhakError(
      'Hanya Admin yang diizinkan melakukan impor master barang.'
    );
  }
}

function collectRowFieldErrors(
  sku: string,
  name: string,
  catCode: string,
  unitCode: string,
  pPrice: number,
  sPrice: number,
  minStock: number,
  seenSkus: Set<string>,
  knownCategoryCodes?: Set<string>,
  knownUnitCodes?: Set<string>
): string[] {
  const errs: string[] = [];
  if (sku.length < 2) errs.push('SKU wajib minimal 2 karakter');
  if (seenSkus.has(sku)) errs.push(`SKU duplikat pada file (${sku})`);
  if (sku) seenSkus.add(sku);
  if (name.length < 2) errs.push('Nama barang wajib minimal 2 karakter');
  if (!catCode) errs.push('Kode kategori wajib diisi');
  if (knownCategoryCodes && catCode && !knownCategoryCodes.has(catCode)) {
    errs.push(`Kode kategori "${catCode}" tidak terdaftar`);
  }
  if (!unitCode) errs.push('Kode satuan wajib diisi');
  if (knownUnitCodes && unitCode && !knownUnitCodes.has(unitCode)) {
    errs.push(`Kode satuan "${unitCode}" tidak terdaftar`);
  }
  if (Number.isNaN(pPrice) || pPrice < 0) errs.push('Harga beli tidak valid');
  if (Number.isNaN(sPrice) || sPrice < 0) errs.push('Harga jual tidak valid');
  if (Number.isNaN(minStock) || minStock < 0) errs.push('Stok minimum tidak valid');
  return errs;
}

function validateSingleRow(
  raw: RawImportRow,
  seenSkus: Set<string>,
  knownCategoryCodes?: Set<string>,
  knownUnitCodes?: Set<string>
): { valid?: ValidatedImportRow; error?: ImportRowError } {
  const sku = String(raw.sku ?? '').trim().toUpperCase();
  const name = String(raw.name ?? '').trim();
  const catCode = String(raw.categoryCode ?? '').trim().toUpperCase();
  const unitCode = String(raw.unitCode ?? '').trim().toUpperCase();
  const pPrice = Number(raw.purchasePrice);
  const sPrice = Number(raw.sellingPrice);
  const minStock = raw.minStock !== undefined && raw.minStock !== '' ? Number(raw.minStock) : 0;

  const errs = collectRowFieldErrors(
    sku, name, catCode, unitCode, pPrice, sPrice, minStock,
    seenSkus, knownCategoryCodes, knownUnitCodes
  );
  if (errs.length > 0) {
    return { error: { rowNumber: raw.rowNumber, sku: sku || '-', errors: errs } };
  }
  return {
    valid: {
      rowNumber: raw.rowNumber, sku,
      barcode: raw.barcode ? String(raw.barcode).trim() : null,
      name, categoryCode: catCode, unitCode,
      purchasePrice: pPrice, sellingPrice: sPrice, minStock,
    },
  };
}

export function validateImportBatch(
  rawRows: RawImportRow[],
  knownCategoryCodes?: Set<string>,
  knownUnitCodes?: Set<string>
): ImportPreviewResult {
  const validRows: ValidatedImportRow[] = [];
  const invalidRows: ImportRowError[] = [];
  const seenSkus = new Set<string>();

  for (const raw of rawRows) {
    const res = validateSingleRow(
      raw,
      seenSkus,
      knownCategoryCodes,
      knownUnitCodes
    );
    if (res.valid) validRows.push(res.valid);
    if (res.error) invalidRows.push(res.error);
  }
  return { totalRows: rawRows.length, validRows, invalidRows };
}

export function parseCsvToRawImportRows(csvContent: string): RawImportRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length <= 1) return [];

  return lines.slice(1).map((line, idx) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      rowNumber: idx + 2,
      sku: cols[0] ?? '',
      barcode: cols[1] ?? '',
      name: cols[2] ?? '',
      categoryCode: cols[3] ?? '',
      unitCode: cols[4] ?? '',
      purchasePrice: cols[5] ?? '',
      sellingPrice: cols[6] ?? '',
      minStock: cols[7] ?? '0',
    };
  });
}
