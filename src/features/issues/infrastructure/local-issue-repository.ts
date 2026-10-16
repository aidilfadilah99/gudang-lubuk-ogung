import { getLocalStore } from '@/shared/db/local-store';
import {
  IssueRepositoryPort,
  StockIssueDocument,
} from '../domain/issue';

function hydrateIssueDoc(doc: StockIssueDocument): StockIssueDocument {
  const s = getLocalStore();
  return {
    ...doc,
    lines: doc.lines.map((l) => {
      const item = s.items.find((i) => i.id === l.itemId);
      return {
        ...l,
        itemName: item?.name ?? l.itemName,
        sku: item?.sku ?? l.sku,
      };
    }),
  };
}

export function createLocalIssueRepository(): IssueRepositoryPort {
  return {
    async saveIssue(doc) {
      getLocalStore().issues.unshift(hydrateIssueDoc(doc));
    },
    async findById(warehouseId, issueId) {
      const found = getLocalStore().issues.find(
        (i) => i.warehouseId === warehouseId && i.id === issueId
      );
      return found ? hydrateIssueDoc(found) : null;
    },
    async markVoided(p) {
      const found = getLocalStore().issues.find(
        (i) => i.warehouseId === p.warehouseId && i.id === p.issueId
      );
      if (found) {
        found.status = 'VOIDED';
        found.voidReason = p.voidReason;
        found.voidedBy = p.voidedBy;
        found.voidedAt = p.voidedAt;
      }
    },
    async listIssues(params) {
      const filtered = getLocalStore()
        .issues.filter(
          (i) =>
            i.warehouseId === params.warehouseId &&
            (!params.fromDate || i.issueDate >= params.fromDate) &&
            (!params.toDate || i.issueDate <= params.toDate)
        )
        .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())
        .map(hydrateIssueDoc);
      return {
        items: filtered.slice(params.offset, params.offset + params.limit),
        total: filtered.length,
      };
    },
  };
}
