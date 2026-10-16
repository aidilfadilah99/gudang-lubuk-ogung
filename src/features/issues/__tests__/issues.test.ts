import { describe, expect, it } from 'vitest';
import { StockMovementRecord, StockRepositoryPort } from '@/features/stock';
import { USER_ROLES } from '@/shared/config/constants';
import { StokTidakCukupError } from '@/shared/lib/errors';
import { IssueRepositoryPort, StockIssueDocument } from '../domain/issue';
import { createIssueUseCase } from '../application/create-issue';
import { voidIssueUseCase } from '../application/void-issue';

function createFakeIssueDeps(initialBalance = 10) {
  let balance = initialBalance;
  const issues = new Map<string, StockIssueDocument>();
  const movements: StockMovementRecord[] = [];
  const issueRepo: IssueRepositoryPort = {
    async saveIssue(doc) {
      issues.set(doc.id, doc);
    },
    async findById(_, id) {
      return issues.get(id) ?? null;
    },
    async markVoided({ issueId, voidReason, voidedBy, voidedAt }) {
      const x = issues.get(issueId);
      if (x) Object.assign(x, { status: 'VOIDED', voidReason, voidedBy, voidedAt });
    },
    async listIssues() {
      return { items: Array.from(issues.values()), total: issues.size };
    },
  };
  const stockRepo: StockRepositoryPort = {
    async lockItemAndGetBalance() {
      return { itemName: 'Beras 10 Kg', currentBalance: balance };
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
  return { issueRepo, stockRepo, getBalance: () => balance };
}

describe('Fitur Issues - Barang Keluar & Anti Stok Minus', () => {
  it('menolak barang keluar jika jumlah melebihi stok yang tersedia', async () => {
    const deps = createFakeIssueDeps(5);
    await expect(
      createIssueUseCase(
        {
          warehouseId: 'wh_01',
          actorId: 'usr_staff',
          destinationType: 'ANGGOTA',
          recipientName: 'Pak Ahmad',
          lines: [{ itemId: 'item_01', quantity: 8, unitSellingPrice: 148000 }],
        },
        deps
      )
    ).rejects.toThrow(StokTidakCukupError);
    expect(deps.getBalance()).toBe(5);
  });

  it('mengurangi stok saat barang keluar dan mengembalikan stok saat di-void Admin', async () => {
    const deps = createFakeIssueDeps(10);
    const doc = await createIssueUseCase(
      {
        warehouseId: 'wh_01',
        actorId: 'usr_staff',
        destinationType: 'ANGGOTA',
        recipientName: 'Pak Ahmad',
        lines: [{ itemId: 'item_01', quantity: 4, unitSellingPrice: 148000 }],
      },
      deps
    );
    expect(deps.getBalance()).toBe(6);

    const voided = await voidIssueUseCase(
      {
        warehouseId: 'wh_01',
        issueId: doc.id,
        voidReason: 'Batal ambil oleh anggota',
        actorId: 'usr_admin',
        actorRole: USER_ROLES.ADMIN,
      },
      deps
    );
    expect(voided.status).toBe('VOIDED');
    expect(deps.getBalance()).toBe(10);
  });
});
