import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportTablePayload } from '../domain/report';

export function renderReportToPdfBuffer(payload: ReportTablePayload): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text(payload.cooperativeName.toUpperCase(), 14, 15);
  doc.setFontSize(11);
  doc.text(payload.title, 14, 22);
  doc.setFontSize(9);
  doc.text(
    `Periode: ${payload.periodLabel}   |   Waktu Cetak: ${payload.printedAtWib}`,
    14,
    28
  );

  autoTable(doc, {
    startY: 33,
    head: [payload.headers],
    body: payload.rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [21, 128, 61] },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 120;
  const sigY = Math.min(finalY + 15, 175);

  doc.setFontSize(9);
  doc.text('Dibuat oleh,', 30, sigY);
  doc.text('Mengetahui,', 210, sigY);
  doc.text(payload.chairmanTitle, 210, sigY + 5);
  doc.text(`( ${payload.preparedBy} )`, 30, sigY + 22);
  doc.text('( ______________________ )', 210, sigY + 22);

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
