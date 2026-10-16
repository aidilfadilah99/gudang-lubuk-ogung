import { getLocalStore } from '@/shared/db/local-store';
import { ReportDataPort } from '../domain/report';

function fetchLocalStockAsOf(warehouseId: string, asOfDate: Date) {
  const s = getLocalStore();
  return s.items
    .filter((i) => i.warehouseId === warehouseId && i.isActive)
    .sort((a, b) => a.sku.localeCompare(b.sku))
    .map((i) => {
      const cat = s.categories.find((c) => c.id === i.categoryId);
      const unit = s.units.find((u) => u.id === i.baseUnitId);
      const balance = s.movements
        .filter(
          (m) =>
            m.warehouseId === warehouseId &&
            m.itemId === i.id &&
            m.createdAt <= asOfDate
        )
        .reduce((acc, m) => acc + m.quantityChange, 0);
      return {
        sku: i.sku,
        name: i.name,
        categoryName: cat?.name ?? '-',
        unitCode: unit?.code ?? 'PCS',
        balance,
        minStock: i.minStock,
        sellingPrice: i.sellingPrice,
      };
    });
}

function fetchLocalReceiptsPeriod(warehouseId: string, from: Date, to: Date) {
  const s = getLocalStore();
  return s.receipts
    .filter(
      (r) =>
        r.warehouseId === warehouseId &&
        r.receiptDate >= from &&
        r.receiptDate <= to
    )
    .flatMap((r) => {
      const sup = s.suppliers.find((x) => x.id === r.supplierId);
      return r.lines.map((l) => {
        const item = s.items.find((i) => i.id === l.itemId);
        return {
          receiptNumber: r.receiptNumber,
          receiptDate: r.receiptDate,
          supplierName: sup?.name ?? '-',
          invoiceNumber: r.invoiceNumber,
          sku: item?.sku ?? '-',
          itemName: item?.name ?? '-',
          quantity: l.quantity,
          unitPrice: l.unitPurchasePrice,
          subtotal: l.subtotal,
          status: r.status,
        };
      });
    });
}

function fetchLocalIssuesPeriod(warehouseId: string, from: Date, to: Date) {
  const s = getLocalStore();
  return s.issues
    .filter(
      (i) =>
        i.warehouseId === warehouseId &&
        i.issueDate >= from &&
        i.issueDate <= to
    )
    .flatMap((iss) =>
      iss.lines.map((l) => {
        const item = s.items.find((x) => x.id === l.itemId);
        return {
          issueNumber: iss.issueNumber,
          issueDate: iss.issueDate,
          destinationType: iss.destinationType,
          recipientName: iss.recipientName,
          sku: item?.sku ?? '-',
          itemName: item?.name ?? '-',
          quantity: l.quantity,
          unitPrice: l.unitSellingPrice,
          subtotal: l.subtotal,
          status: iss.status,
        };
      })
    );
}

export function createLocalReportRepository(): ReportDataPort {
  return {
    fetchStockAsOf: async (whId, asOf) => fetchLocalStockAsOf(whId, asOf),
    fetchReceiptsByPeriod: async (whId, from, to) =>
      fetchLocalReceiptsPeriod(whId, from, to),
    fetchIssuesByPeriod: async (whId, from, to) =>
      fetchLocalIssuesPeriod(whId, from, to),
    async fetchStockCard(warehouseId, itemId) {
      return getLocalStore()
        .movements.filter(
          (m) => m.warehouseId === warehouseId && m.itemId === itemId
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((r) => ({
          createdAt: r.createdAt,
          movementType: r.movementType,
          referenceNumber: r.referenceNumber,
          quantityChange: r.quantityChange,
          balanceAfter: r.balanceAfter,
          notes: r.notes,
        }));
    },
  };
}
