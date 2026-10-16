import { getLocalStore, LocalItemRow } from '@/shared/db/local-store';
import { DataTidakDitemukanError } from '@/shared/lib/errors';
import {
  evaluateStockAlertStatus,
  MovementType,
  ReferenceType,
  StockRepositoryPort,
  StockSummaryItem,
} from '../domain/ledger';

function mapLocalStockRow(warehouseId: string, i: LocalItemRow): StockSummaryItem {
  const s = getLocalStore();
  const cat = s.categories.find((c) => c.id === i.categoryId);
  const unit = s.units.find((u) => u.id === i.baseUnitId);
  const bal = s.movements
    .filter((m) => m.warehouseId === warehouseId && m.itemId === i.id)
    .reduce((acc, m) => acc + m.quantityChange, 0);
  return {
    itemId: i.id,
    sku: i.sku,
    barcode: i.barcode,
    name: i.name,
    categoryId: i.categoryId,
    categoryName: cat?.name ?? '-',
    unitCode: unit?.code ?? 'PCS',
    purchasePrice: i.purchasePrice,
    sellingPrice: i.sellingPrice,
    minStock: i.minStock,
    currentBalance: bal,
    alertStatus: evaluateStockAlertStatus(bal, i.minStock),
  };
}

function listLocalCurrentStock(params: {
  warehouseId: string;
  search?: string;
  categoryId?: string;
  onlyLowStock?: boolean;
  limit: number;
  offset: number;
}): { items: StockSummaryItem[]; total: number } {
  const q = params.search?.trim().toLowerCase() ?? '';
  const all = getLocalStore()
    .items.filter(
      (i) =>
        i.warehouseId === params.warehouseId &&
        i.isActive &&
        (!params.categoryId || i.categoryId === params.categoryId) &&
        (!q ||
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          (i.barcode ?? '').toLowerCase().includes(q))
    )
    .map((i) => mapLocalStockRow(params.warehouseId, i))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = params.onlyLowStock
    ? all.filter((x) => x.alertStatus !== 'AMAN')
    : all;
  return {
    items: filtered.slice(params.offset, params.offset + params.limit),
    total: filtered.length,
  };
}

function getLocalItemMovements(params: {
  warehouseId: string;
  itemId: string;
  limit: number;
  offset: number;
}) {
  const movs = getLocalStore()
    .movements.filter(
      (m) =>
        m.warehouseId === params.warehouseId && m.itemId === params.itemId
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((r) => ({
      ...r,
      movementType: r.movementType as MovementType,
      referenceType: r.referenceType as ReferenceType,
    }));
  return {
    movements: movs.slice(params.offset, params.offset + params.limit),
    total: movs.length,
  };
}

export function createLocalStockRepository(): StockRepositoryPort {
  return {
    async lockItemAndGetBalance(warehouseId, itemId) {
      const s = getLocalStore();
      const item = s.items.find(
        (i) => i.warehouseId === warehouseId && i.id === itemId
      );
      if (!item) throw new DataTidakDitemukanError('Barang');
      const currentBalance = s.movements
        .filter((m) => m.warehouseId === warehouseId && m.itemId === itemId)
        .reduce((acc, m) => acc + m.quantityChange, 0);
      return { itemName: item.name, currentBalance };
    },
    insertMovement: async (m) => {
      getLocalStore().movements.push({ ...m });
    },
    insertAdjustment: async (p) => {
      getLocalStore().adjustments.push({ ...p });
    },
    listCurrentStock: async (params) => listLocalCurrentStock(params),
    getItemMovements: async (params) => getLocalItemMovements(params),
  };
}
