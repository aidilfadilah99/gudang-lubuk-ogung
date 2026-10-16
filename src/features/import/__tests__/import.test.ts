import { describe, expect, it } from 'vitest';
import {
  parseCsvToRawImportRows,
  validateImportBatch,
} from '../domain/import-parser';

describe('Fitur Import - Validasi Format Salah & Error Per Baris', () => {
  it('mendeteksi baris salah format (SKU kosong, harga minus, kategori tidak dikenal)', () => {
    const csv = [
      'sku,barcode,name,category_code,unit_code,purchase_price,selling_price,min_stock',
      'PPK-010,8991,Pupuk Bagus,PPK,SAK,400000,450000,10',
      'A,,Nama Pendek,TIDAK_ADA,SAK,-5000,10000,5',
      'PPK-010,8992,Duplikat SKU,PPK,SAK,10000,15000,5',
    ].join('\n');

    const rawRows = parseCsvToRawImportRows(csv);
    const result = validateImportBatch(
      rawRows,
      new Set(['PPK', 'SMB']),
      new Set(['SAK', 'KG'])
    );

    expect(result.totalRows).toBe(3);
    expect(result.validRows).toHaveLength(1);
    expect(result.invalidRows).toHaveLength(2);
    expect(result.invalidRows[0]?.rowNumber).toBe(3);
    expect(result.invalidRows[0]?.errors).toContain(
      'SKU wajib minimal 2 karakter'
    );
    expect(result.invalidRows[0]?.errors).toContain('Harga beli tidak valid');
    expect(result.invalidRows[1]?.rowNumber).toBe(4);
    expect(result.invalidRows[1]?.errors[0]).toContain('SKU duplikat');
  });
});
