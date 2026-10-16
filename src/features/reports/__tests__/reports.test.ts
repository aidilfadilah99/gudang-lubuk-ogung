import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { ReportDataPort } from '../domain/report';
import { buildReportTableUseCase } from '../application/build-report-table';
import { renderReportToExcelBuffer } from '../infrastructure/excel-exporter';
import { renderReportToPdfBuffer } from '../infrastructure/pdf-exporter';

const fakeReportRepo: ReportDataPort = {
  async fetchStockAsOf() {
    return [
      {
        sku: 'SMB-001',
        name: 'Beras 10 Kg',
        categoryName: 'Sembako',
        unitCode: 'SAK',
        balance: 5,
        minStock: 10,
        sellingPrice: 148000,
      },
    ];
  },
  async fetchReceiptsByPeriod() {
    return [];
  },
  async fetchIssuesByPeriod() {
    return [];
  },
  async fetchStockCard() {
    return [];
  },
};

describe('Fitur Reports - PDF & Excel Generator', () => {
  it('membangun tabel laporan dan mengekspor ke Buffer PDF serta Excel', async () => {
    const table = await buildReportTableUseCase(
      {
        warehouseId: 'wh_01',
        actorRole: USER_ROLES.ADMIN,
        actorFullName: 'Admin KDKMP',
        kind: 'LOW_STOCK',
      },
      { reportRepo: fakeReportRepo }
    );
    expect(table.cooperativeName).toBe('KDKMP Lubuk Ogung');
    expect(table.rows).toHaveLength(1);

    const excelBuf = await renderReportToExcelBuffer(table);
    expect(excelBuf.byteLength).toBeGreaterThan(100);

    const pdfBuf = renderReportToPdfBuffer(table);
    expect(pdfBuf.byteLength).toBeGreaterThan(100);
  });
});
