import crypto from 'node:crypto';
import {
  recordStockMovementUseCase,
  StockRepositoryPort,
} from '@/features/stock';
import {
  calculateIssueLineSubtotal,
  generateIssueNumber,
  IssueDestinationType,
  IssueItemLine,
  IssueRepositoryPort,
  StockIssueDocument,
} from '../domain/issue';

export interface CreateIssueUseCaseInput {
  warehouseId: string;
  actorId: string;
  destinationType: IssueDestinationType;
  recipientName: string;
  notes?: string;
  lines: Array<{
    itemId: string;
    quantity: number;
    unitSellingPrice: number;
  }>;
}

function buildIssueDocument(
  input: CreateIssueUseCaseInput,
  now: Date
): StockIssueDocument {
  const issueId = `iss_${crypto.randomUUID()}`;
  const issueNumber = generateIssueNumber(now, issueId.slice(-6));
  const builtLines: IssueItemLine[] = input.lines.map((l) => ({
    id: `issi_${crypto.randomUUID()}`,
    itemId: l.itemId,
    quantity: l.quantity,
    unitSellingPrice: l.unitSellingPrice,
    subtotal: calculateIssueLineSubtotal(l.quantity, l.unitSellingPrice),
  }));

  return {
    id: issueId,
    warehouseId: input.warehouseId,
    issueNumber,
    destinationType: input.destinationType,
    recipientName: input.recipientName.trim(),
    issueDate: now,
    status: 'POSTED',
    notes: input.notes?.trim() || null,
    voidReason: null,
    voidedBy: null,
    voidedAt: null,
    createdBy: input.actorId,
    createdAt: now,
    lines: builtLines,
  };
}

export async function createIssueUseCase(
  input: CreateIssueUseCaseInput,
  deps: {
    issueRepo: IssueRepositoryPort;
    stockRepo: StockRepositoryPort;
    now?: () => Date;
  }
): Promise<StockIssueDocument> {
  const now = deps.now ? deps.now() : new Date();
  const doc = buildIssueDocument(input, now);
  await deps.issueRepo.saveIssue(doc);

  for (const line of doc.lines) {
    await recordStockMovementUseCase(
      {
        warehouseId: input.warehouseId,
        itemId: line.itemId,
        movementType: 'ISSUE_OUT',
        referenceType: 'ISSUE',
        referenceId: doc.id,
        referenceNumber: doc.issueNumber,
        quantityChange: -line.quantity,
        unitCost: line.unitSellingPrice,
        notes: `Keluar [${doc.destinationType}] ke ${doc.recipientName}`,
        actorId: input.actorId,
      },
      { stockRepo: deps.stockRepo, now: () => now }
    );
  }
  return doc;
}
