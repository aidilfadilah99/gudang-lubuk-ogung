import ExcelJS from 'exceljs';
import { ReportTablePayload } from '../domain/report';

export async function renderReportToExcelBuffer(
  payload: ReportTablePayload
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = payload.cooperativeName;
  const sheet = workbook.addWorksheet('Laporan');

  sheet.addRow([payload.cooperativeName.toUpperCase()]).font = {
    bold: true,
    size: 14,
  };
  sheet.addRow([payload.title]).font = { bold: true, size: 12 };
  sheet.addRow([
    `Periode: ${payload.periodLabel} | Dicetak: ${payload.printedAtWib}`,
  ]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(payload.headers);
  headerRow.font = { bold: true };
  for (const row of payload.rows) {
    sheet.addRow(row);
  }

  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow(['Dibuat oleh,', '', '', 'Mengetahui,']);
  sheet.addRow(['', '', '', payload.chairmanTitle]);
  sheet.addRow([]);
  sheet.addRow([`( ${payload.preparedBy} )`, '', '', '( __________________ )']);

  const arrayBuf = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuf);
}
