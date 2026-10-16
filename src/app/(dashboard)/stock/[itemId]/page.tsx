import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createCatalogRepository } from '@/features/catalog';
import {
  createStockRepository,
  getStockCardUseCase,
  StockCardView,
} from '@/features/stock';
import { requireStaffOrAdmin } from '@/shared/security/guard';

export const dynamic = 'force-dynamic';

export default async function StockCardPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}): Promise<React.ReactElement> {
  const session = await requireStaffOrAdmin();
  const { itemId } = await params;

  const catalogRepo = createCatalogRepository();
  const stockRepo = createStockRepository();

  const [item, card] = await Promise.all([
    catalogRepo.findItemById(session.warehouseId, itemId),
    getStockCardUseCase(
      { warehouseId: session.warehouseId, itemId, page: 1, pageSize: 100 },
      { stockRepo }
    ),
  ]);

  if (!item) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono text-slate-500">{item.sku}</span>
          <h2 className="text-lg font-extrabold text-slate-900">
            Kartu Stok: {item.name}
          </h2>
        </div>
        <Link
          href="/stock"
          className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
        >
          ← Kembali ke Daftar Stok
        </Link>
      </div>
      <StockCardView
        movements={card.movements}
        unitCode={item.unitCode ?? ''}
      />
    </div>
  );
}
