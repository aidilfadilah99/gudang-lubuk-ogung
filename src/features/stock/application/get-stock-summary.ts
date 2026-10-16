import { StockRepositoryPort, StockSummaryItem } from '../domain/ledger';
import { StockFilterInput } from '../schemas';

export async function getStockSummaryUseCase(
  warehouseId: string,
  filter: StockFilterInput,
  deps: { stockRepo: StockRepositoryPort }
): Promise<{ items: StockSummaryItem[]; total: number }> {
  const offset = (filter.page - 1) * filter.pageSize;
  return deps.stockRepo.listCurrentStock({
    warehouseId,
    search: filter.search,
    categoryId: filter.categoryId,
    onlyLowStock: filter.onlyLowStock,
    limit: filter.pageSize,
    offset,
  });
}
