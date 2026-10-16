import {
  ReceiptRepositoryPort,
  StockReceiptDocument,
} from '../domain/receipt';

export async function listReceiptsUseCase(
  params: {
    warehouseId: string;
    fromDate?: Date;
    toDate?: Date;
    page: number;
    pageSize: number;
  },
  deps: { receiptRepo: ReceiptRepositoryPort }
): Promise<{ items: StockReceiptDocument[]; total: number }> {
  const offset = (params.page - 1) * params.pageSize;
  return deps.receiptRepo.listReceipts({
    warehouseId: params.warehouseId,
    fromDate: params.fromDate,
    toDate: params.toDate,
    limit: params.pageSize,
    offset,
  });
}
