import { getLocalStore } from '@/shared/db/local-store';
import {
  ReceiptRepositoryPort,
  StockReceiptDocument,
} from '../domain/receipt';

function hydrateReceiptDoc(doc: StockReceiptDocument): StockReceiptDocument {
  const s = getLocalStore();
  const sup = s.suppliers.find((x) => x.id === doc.supplierId);
  return {
    ...doc,
    supplierName: sup?.name ?? doc.supplierName ?? '-',
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

export function createLocalReceiptRepository(): ReceiptRepositoryPort {
  return {
    async saveReceipt(doc) {
      getLocalStore().receipts.unshift(hydrateReceiptDoc(doc));
    },
    async findById(warehouseId, receiptId) {
      const found = getLocalStore().receipts.find(
        (r) => r.warehouseId === warehouseId && r.id === receiptId
      );
      return found ? hydrateReceiptDoc(found) : null;
    },
    async markVoided(p) {
      const found = getLocalStore().receipts.find(
        (r) => r.warehouseId === p.warehouseId && r.id === p.receiptId
      );
      if (found) {
        found.status = 'VOIDED';
        found.voidReason = p.voidReason;
        found.voidedBy = p.voidedBy;
        found.voidedAt = p.voidedAt;
      }
    },
    async listReceipts(params) {
      const filtered = getLocalStore()
        .receipts.filter(
          (r) =>
            r.warehouseId === params.warehouseId &&
            (!params.fromDate || r.receiptDate >= params.fromDate) &&
            (!params.toDate || r.receiptDate <= params.toDate)
        )
        .sort((a, b) => b.receiptDate.getTime() - a.receiptDate.getTime())
        .map(hydrateReceiptDoc);
      return {
        items: filtered.slice(params.offset, params.offset + params.limit),
        total: filtered.length,
      };
    },
  };
}
