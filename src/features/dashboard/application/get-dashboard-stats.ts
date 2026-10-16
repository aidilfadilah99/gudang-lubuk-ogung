import {
  DashboardRepositoryPort,
  DashboardSnapshot,
} from '../domain/dashboard';

export async function getDashboardStatsUseCase(
  warehouseId: string,
  deps: { dashboardRepo: DashboardRepositoryPort; now?: () => Date }
): Promise<DashboardSnapshot> {
  const now = deps.now ? deps.now() : new Date();
  return deps.dashboardRepo.fetchSnapshot(warehouseId, now);
}
