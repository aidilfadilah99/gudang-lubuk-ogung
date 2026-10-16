import React from 'react';
import { formatDateTimeWib, formatQuantity } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { StockMovementRecord } from '../domain/ledger';

function renderMovementLabel(type: StockMovementRecord['movementType']) {
  const labels: Record<StockMovementRecord['movementType'], string> = {
    RECEIPT_IN: 'Barang Masuk',
    ISSUE_OUT: 'Barang Keluar',
    REVERSAL_RECEIPT: 'Void Barang Masuk',
    REVERSAL_ISSUE: 'Void Barang Keluar',
    ADJUSTMENT: 'Penyesuaian Admin',
  };
  return labels[type];
}

function MovementCardRow({ mov, unitCode }: { mov: StockMovementRecord; unitCode: string }) {
  const isPositive = mov.quantityChange > 0;
  return (
    <Card className="flex flex-wrap items-center justify-between gap-2">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Badge variant={isPositive ? 'success' : 'danger'}>
            {renderMovementLabel(mov.movementType)}
          </Badge>
          <span className="text-xs font-mono font-semibold text-slate-700">{mov.referenceNumber}</span>
        </div>
        <p className="text-xs text-slate-500">
          {formatDateTimeWib(mov.createdAt)}{mov.notes ? ` • ${mov.notes}` : ''}
        </p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{formatQuantity(mov.quantityChange)} {unitCode}
        </p>
        <p className="text-xs text-slate-600">
          Saldo: <strong>{formatQuantity(mov.balanceAfter)}</strong> {unitCode}
        </p>
      </div>
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
      <Card>
        <p className="text-sm text-slate-600">Belum ada riwayat mutasi pada Kartu Stok barang ini.</p>
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
