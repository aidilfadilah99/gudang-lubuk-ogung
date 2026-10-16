import React from 'react';
import { formatDateTimeWib, formatQuantity } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { StockMovementRecord } from '../domain/ledger';

function getMovementMeta(type: StockMovementRecord['movementType']) {
  switch (type) {
    case 'RECEIPT_IN':
      return { label: 'Masuk', variant: 'success' as const };
    case 'ISSUE_OUT':
      return { label: 'Keluar', variant: 'danger' as const };
    case 'REVERSAL_RECEIPT':
      return { label: 'Void Masuk', variant: 'warning' as const };
    case 'REVERSAL_ISSUE':
      return { label: 'Void Keluar', variant: 'warning' as const };
    case 'ADJUSTMENT':
    default:
      return { label: 'Penyesuaian', variant: 'info' as const };
  }
}

function MovementLeadingInfo({ mov }: { mov: StockMovementRecord }) {
  const meta = getMovementMeta(mov.movementType);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={meta.variant} withDot>
          {meta.label}
        </Badge>
        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {mov.referenceNumber}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 font-medium">
        {formatDateTimeWib(mov.createdAt)}
        {mov.notes ? ` • ${mov.notes}` : ''}
      </p>
    </div>
  );
}

function MovementTrailingAmounts({ mov, unitCode }: { mov: StockMovementRecord; unitCode: string }) {
  const isPositive = mov.quantityChange > 0;
  return (
    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
      <p className={`text-sm font-extrabold tracking-tight ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? '+' : ''}{formatQuantity(mov.quantityChange)} {unitCode}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[11px] text-slate-400 font-medium">Saldo:</span>
        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
          {formatQuantity(mov.balanceAfter)} {unitCode}
        </span>
      </div>
    </div>
  );
}

function MovementCardRow({ mov, unitCode }: { mov: StockMovementRecord; unitCode: string }) {
  return (
    <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:shadow-sm transition-all border border-slate-200/80">
      <MovementLeadingInfo mov={mov} />
      <MovementTrailingAmounts mov={mov} unitCode={unitCode} />
    </Card>
  );
}

export function StockCardView({
  movements,
  unitCode,
}: {
  movements: StockMovementRecord[];
  unitCode: string;
}): React.ReactElement {
  if (movements.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed border-2 border-slate-200">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-700">Belum ada riwayat mutasi</p>
        <p className="text-xs text-slate-500 mt-1">Setiap transaksi masuk, keluar, atau penyesuaian akan tercatat otomatis di buku besar ini.</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2.5">
      {movements.map((mov) => (
        <MovementCardRow key={mov.id} mov={mov} unitCode={unitCode} />
      ))}
    </div>
  );
}
