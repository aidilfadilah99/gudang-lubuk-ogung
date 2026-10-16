import { NextRequest, NextResponse } from 'next/server';
import {
  buildReportTableUseCase,
  createReportRepository,
  generateReportSchema,
  renderReportToExcelBuffer,
  renderReportToPdfBuffer,
  ReportTablePayload,
} from '@/features/reports';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin } from '@/shared/security/guard';

async function buildReportBinaryResponse(
  table: ReportTablePayload,
  kind: string,
  format: 'PDF' | 'EXCEL'
): Promise<NextResponse> {
  if (format === 'EXCEL') {
    const excelBuffer = await renderReportToExcelBuffer(table);
    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-${kind.toLowerCase()}.xlsx"`,
      },
    });
  }
  const pdfBuffer = renderReportToPdfBuffer(table);
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="laporan-${kind.toLowerCase()}.pdf"`,
    },
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const parsed = generateReportSchema.parse({
      kind: searchParams.get('kind') ?? 'STOCK_AS_OF',
      format: searchParams.get('format') ?? 'PDF',
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      itemId: searchParams.get('itemId') ?? undefined,
    });

    const table = await buildReportTableUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        actorFullName: session.fullName,
        kind: parsed.kind,
        fromDate: parsed.fromDate ? new Date(parsed.fromDate) : undefined,
        toDate: parsed.toDate
          ? new Date(`${parsed.toDate}T23:59:59.999Z`)
          : undefined,
        itemId: parsed.itemId,
      },
      { reportRepo: createReportRepository() }
    );

    return buildReportBinaryResponse(table, parsed.kind, parsed.format);
  } catch (error) {
    const errPayload = translateDomainError(error);
    return NextResponse.json(errPayload, { status: errPayload.status });
  }
}
