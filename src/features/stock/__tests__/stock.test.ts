import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/shared/config/constants';
import { StokTidakCukupError, TidakBerhakError } from '@/shared/lib/errors';
import {
  calculateNextBalance,
  convertToBaseQuantity,
  evaluateStockAlertStatus,
  StockMovementRecord,
  StockRepositoryPort,
  validateVoidEligibility,
} from '../domain/ledger';
import { recordStockMovementUseCase } from '../application/record-movement';
import { createStockAdjustmentUseCase } from '../application/create-adjustment';

function createInMemoryStockRepo(initialBalance = 10): StockRepositoryPort & {
  movements: StockMovementRecord[];
} {
  let balance = initialBalance;
  const movements: StockMovementRecord[] = [];
  return {
    movements,
    async lockItemAndGetBalance() {
      return { itemName: 'Pupuk NPK 50 Kg', currentBalance: balance };
    },
    async insertMovement(m) {
      balance = m.balanceAfter;
      movements.push(m);
    },
    async insertAdjustment() {},
    async listCurrentStock() {
      return { items: [], total: 0 };
    },
    async getItemMovements() {
      return { movements, total: movements.length };
    },
  };
}

describe('Fitur Stock - Domain & Application Tests', () => {
  it('menghitung saldo berikutnya dan menolak stok minus (StokTidakCukupError)', () => {
    expect(calculateNextBalance(15, 5, 'Beras')).toBe(20);
    expect(calculateNextBalance(15, -15, 'Beras')).toBe(0);
    expect(() => calculateNextBalance(10, -12, 'Beras')).toThrow(
      StokTidakCukupError
    );
  });

  it('mengonversi satuan sekunder ke satuan dasar dengan benar', () => {
    expect(convertToBaseQuantity(2, 24)).toBe(48);
  });

  it('mengevaluasi status stok menipis dan habis serta kelayakan void', () => {
    expect(evaluateStockAlertStatus(0, 10)).toBe('HABIS');
    expect(evaluateStockAlertStatus(8, 10)).toBe('MENIPIS');
    expect(evaluateStockAlertStatus(25, 10)).toBe('AMAN');
    expect(
      validateVoidEligibility('POSTED', 'Salah input jumlah faktur')
    ).toBe('Salah input jumlah faktur');
  });

  it('mencatat mutasi ledger dan menolak penyesuaian stok oleh Petugas Gudang', async () => {
    const repo = createInMemoryStockRepo(20);
    const mov = await recordStockMovementUseCase(
      {
        warehouseId: 'wh_01',
        itemId: 'item_01',
        movementType: 'ISSUE_OUT',
        referenceType: 'ISSUE',
        referenceId: 'iss_01',
        referenceNumber: 'BK-001',
        quantityChange: -5,
        actorId: 'usr_1',
      },
      { stockRepo: repo }
    );
    expect(mov.balanceAfter).toBe(15);

    await expect(
      createStockAdjustmentUseCase(
        {
          warehouseId: 'wh_01',
          actorId: 'usr_staff',
          actorUsername: 'petugas1',
          actorRole: USER_ROLES.STAFF,
          itemId: 'item_01',
          quantityDelta: -2,
          reasonCategory: 'RUSAK',
          reasonDetail: 'Kemasan robek saat bongkar muat',
        },
        { stockRepo: repo }
      )
    ).rejects.toThrow(TidakBerhakError);
  });
});
