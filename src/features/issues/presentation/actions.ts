'use server';

import { revalidatePath } from 'next/cache';
import {
  claimIdempotencyKey,
  createAuditRepository,
  recordAuditLogUseCase,
} from '@/features/audit';
import { createStockRepository } from '@/features/stock';
import { DbExecutor, withUnitOfWork } from '@/shared/db/client';
import { translateDomainError } from '@/shared/lib/errors';
import { requireAdmin, requireStaffOrAdmin } from '@/shared/security/guard';
import { assertValidIdempotencyKey } from '@/shared/security/idempotency';
import { SessionUser } from '@/shared/security/session';
import { createIssueUseCase } from '../application/create-issue';
import { voidIssueUseCase } from '../application/void-issue';
import { createIssueRepository } from '../infrastructure/issue-repository';
import {
  CreateIssueInput,
  createIssueSchema,
  VoidIssueInput,
  voidIssueSchema,
} from '../schemas';

async function executeCreateIssueTx(
  tx: DbExecutor,
  session: SessionUser,
  parsed: CreateIssueInput
) {
  await claimIdempotencyKey(tx, {
    key: parsed.idempotencyKey, warehouseId: session.warehouseId,
    actorId: session.id, operation: 'ISSUE_CREATE',
  });
  const doc = await createIssueUseCase(
    {
      warehouseId: session.warehouseId, actorId: session.id,
      destinationType: parsed.destinationType, recipientName: parsed.recipientName,
      notes: parsed.notes, lines: parsed.lines,
    },
    { issueRepo: createIssueRepository(tx), stockRepo: createStockRepository(tx) }
  );
  await recordAuditLogUseCase(
    {
      warehouseId: session.warehouseId, actorId: session.id, actorUsername: session.username,
      action: 'ISSUE_CREATE', entityType: 'STOCK_ISSUE', entityId: doc.id,
      afterData: { issueNumber: doc.issueNumber, destinationType: doc.destinationType, recipientName: doc.recipientName },
    },
    { auditRepo: createAuditRepository(tx) }
  );
  return doc;
}

export async function submitCreateIssueAction(rawInput: unknown) {
  try {
    const session = await requireStaffOrAdmin();
    const parsed = createIssueSchema.parse(rawInput);
    assertValidIdempotencyKey(parsed.idempotencyKey);
    const doc = await withUnitOfWork((tx) =>
      executeCreateIssueTx(tx, session, parsed)
    );
    revalidatePath('/issues');
    revalidatePath('/stock');
    revalidatePath('/dashboard');
    return { ok: true as const, data: doc };
  } catch (error) {
    return translateDomainError(error);
  }
}

async function executeVoidIssueTx(
  tx: DbExecutor,
  session: SessionUser,
  parsed: VoidIssueInput
) {
  await claimIdempotencyKey(tx, {
    key: parsed.idempotencyKey,
    warehouseId: session.warehouseId,
    actorId: session.id,
    operation: 'ISSUE_VOID',
  });
  const doc = await voidIssueUseCase(
    {
      warehouseId: session.warehouseId,
      issueId: parsed.issueId,
      voidReason: parsed.voidReason,
      actorId: session.id,
      actorRole: session.role,
    },
    {
      issueRepo: createIssueRepository(tx),
      stockRepo: createStockRepository(tx),
    }
  );
  await recordAuditLogUseCase(
    {
      warehouseId: session.warehouseId,
      actorId: session.id,
      actorUsername: session.username,
      action: 'ISSUE_VOID',
      entityType: 'STOCK_ISSUE',
      entityId: doc.id,
      beforeData: { status: 'POSTED' },
      afterData: { status: 'VOIDED', voidReason: parsed.voidReason },
    },
    { auditRepo: createAuditRepository(tx) }
  );
  return doc;
}

export async function submitVoidIssueAction(rawInput: unknown) {
  try {
    const session = await requireAdmin();
    const parsed = voidIssueSchema.parse(rawInput);
    assertValidIdempotencyKey(parsed.idempotencyKey);
    const doc = await withUnitOfWork((tx) =>
      executeVoidIssueTx(tx, session, parsed)
    );
    revalidatePath('/issues');
    revalidatePath('/stock');
    revalidatePath('/dashboard');
    return { ok: true as const, data: doc };
  } catch (error) {
    return translateDomainError(error);
  }
}
