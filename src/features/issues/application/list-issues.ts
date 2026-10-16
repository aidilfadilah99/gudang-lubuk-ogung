import { IssueRepositoryPort, StockIssueDocument } from '../domain/issue';

export async function listIssuesUseCase(
  params: {
    warehouseId: string;
    fromDate?: Date;
    toDate?: Date;
    page: number;
    pageSize: number;
  },
  deps: { issueRepo: IssueRepositoryPort }
): Promise<{ items: StockIssueDocument[]; total: number }> {
  const offset = (params.page - 1) * params.pageSize;
  return deps.issueRepo.listIssues({
    warehouseId: params.warehouseId,
    fromDate: params.fromDate,
    toDate: params.toDate,
    limit: params.pageSize,
    offset,
  });
}
