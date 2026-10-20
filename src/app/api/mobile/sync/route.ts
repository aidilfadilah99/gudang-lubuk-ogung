import { NextRequest, NextResponse } from 'next/server';
import { createStockRepository } from '@/features/stock';
import { createCatalogRepository } from '@/features/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId') || 'wh_lubuk_ogung_01';

    const stockRepo = createStockRepository();
    const catalogRepo = createCatalogRepository();

    const [stockData, categories, units] = await Promise.all([
      stockRepo.listCurrentStock({
        warehouseId,
        limit: 1000,
        offset: 0,
      }),
      catalogRepo.listCategories(warehouseId),
      catalogRepo.listUnits(warehouseId),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      warehouseId,
      items: stockData.items,
      totalItems: stockData.total,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
      })),
      units: units.map((u) => ({
        id: u.id,
        name: u.name,
        code: u.code,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal sinkronisasi data.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
