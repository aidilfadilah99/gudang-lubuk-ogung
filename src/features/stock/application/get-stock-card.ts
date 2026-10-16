import { StockMovementRecord, StockRepositoryPort } from '../domain/ledger';

export async function getStockCardUseCase(
  params: {
    warehouseId: string;
    itemId: string;
    page: number;
    pageSize: number;
  },
  deps: { stockRepo: StockRepositoryPort }
): Promise<{ movements: StockMovementRecord[]; total: number }> {
  const offset = (params.page - 1) * params.pageSize;
  return deps.stockRepo.getItemMovements({
    warehouseId: params.warehouseId,
    itemId: params.itemId,
    limit: params.pageSize,
    offset,
  });
}
