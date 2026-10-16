import { NextRequest, NextResponse } from 'next/server';
import {
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import {
  backupQuerySchema,
  createBackupRepository,
  exportWarehouseBackupUseCase,
} from '@/features/backup';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin } from '@/shared/security/guard';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireAdmin();
    const { searchParams } = new URL(req.url);
    const parsed = backupQuerySchema.parse({
      format: searchParams.get('format') ?? 'SQL',
    });

    const exported = await exportWarehouseBackupUseCase(
      {
        warehouseId: session.warehouseId,
        actorRole: session.role,
        format: parsed.format,
      },
      { backupRepo: createBackupRepository() }
    );

    await recordAuditLogUseCase(
      {
        warehouseId: session.warehouseId,
        actorId: session.id,
        actorUsername: session.username,
        action: 'DATA_BACKUP',
        entityType: 'WAREHOUSE',
        entityId: session.warehouseId,
        afterData: { format: parsed.format, filename: exported.filename },
      },
      { auditRepo: createAuditRepository() }
    );

    return new NextResponse(exported.content, {
      status: 200,
      headers: {
        'Content-Type': exported.mimeType,
        'Content-Disposition': `attachment; filename="${exported.filename}"`,
      },
    });
  } catch (error) {
    const errPayload = translateDomainError(error);
    return NextResponse.json(errPayload, { status: errPayload.status });
  }
}
