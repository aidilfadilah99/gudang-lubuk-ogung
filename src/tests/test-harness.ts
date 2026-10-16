import { AuthRepositoryPort, AuthUserRecord } from '@/features/auth';
import { IssueRepositoryPort, StockIssueDocument } from '@/features/issues';
import {
  ReceiptRepositoryPort,
  StockReceiptDocument,
} from '@/features/receipts';
import {
  StockMovementRecord,
  StockRepositoryPort,
  StockSummaryItem,
} from '@/features/stock';
import { APP_CONSTANTS, USER_ROLES } from '@/shared/config/constants';
import { DataTidakDitemukanError } from '@/shared/lib/errors';

interface HarnessItemState {
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unitCode: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  currentBalance: number;
}

function createInitialHarnessState() {
  const users = new Map<string, AuthUserRecord>();
  const items = new Map<string, HarnessItemState>();
  users.set('petugas1', {
    id: 'usr_petugas_1',
    warehouseId: APP_CONSTANTS.DEFAULT_WAREHOUSE_ID,
    username: 'petugas1',
    fullName: 'Budi Gudang',
    passwordHash: 'hashed:PasswordLama123',
    role: USER_ROLES.STAFF,
    isActive: true,
    mustChangePassword: false,
  });
  items.set('itm_pupuk_urea', {
    sku: 'PPK-001',
    name: 'Pupuk Urea 50Kg',
    categoryId: 'cat_pupuk',
    categoryName: 'Pupuk & Nutrisi',
    unitCode: 'SAK',
    purchasePrice: 120000,
    sellingPrice: 135000,
    minStock: 10,
    currentBalance: 0,
  });
  return { users, items };
}

function buildStockRepo(
  items: Map<string, HarnessItemState>,
  movements: StockMovementRecord[]
): StockRepositoryPort {
  let lockChain = Promise.resolve();
  let activeRelease: (() => void) | null = null;

  return {
    lockItemAndGetBalance: async (_wId, itemId) => {
      const prev = lockChain;
      let release!: () => void;
      lockChain = new Promise<void>((r) => {
        release = r;
      });
      await prev;
      activeRelease = () => {
        if (activeRelease) {
          const fn = activeRelease;
          activeRelease = null;
          fn();
        }
      };
      activeRelease = release;
      queueMicrotask(() => {
        if (activeRelease === release) {
          activeRelease = null;
          release();
        }
      });
      const item = items.get(itemId);
      if (!item) throw new DataTidakDitemukanError('Barang');
      return { itemName: item.name, currentBalance: item.currentBalance };
    },
    insertMovement: async (movement) => {
      const item = items.get(movement.itemId);
      if (item) item.currentBalance = movement.balanceAfter;
      movements.push(movement);
      if (activeRelease) {
        const fn = activeRelease;
        activeRelease = null;
        fn();
      }
    },
    insertAdjustment: async () => undefined,
    listCurrentStock: async () => {
      const list: StockSummaryItem[] = [];
      for (const [id, it] of items.entries()) {
        list.push({
          itemId: id,
          sku: it.sku,
          barcode: null,
          name: it.name,
          categoryId: it.categoryId,
          categoryName: it.categoryName,
          unitCode: it.unitCode,
          purchasePrice: it.purchasePrice,
          sellingPrice: it.sellingPrice,
          minStock: it.minStock,
          currentBalance: it.currentBalance,
          alertStatus: it.currentBalance <= 0 ? 'HABIS' : 'AMAN',
        });
      }
      return { items: list, total: list.length };
    },
    getItemMovements: async ({ itemId }) => {
      const filtered = movements.filter((m) => m.itemId === itemId);
      return { movements: filtered, total: filtered.length };
    },
  };
}

export function createInMemoryWarehouseHarness() {
  const { users, items } = createInitialHarnessState();
  const movements: StockMovementRecord[] = [];
  const receipts = new Map<string, StockReceiptDocument>();
  const issues = new Map<string, StockIssueDocument>();

  const authRepo: AuthRepositoryPort = {
    findByUsername: async (u) => users.get(u) ?? null,
    findById: async (id) =>
      Array.from(users.values()).find((x) => x.id === id) ?? null,
    updatePassword: async (userId, newPasswordHash) => {
      for (const [k, v] of users.entries()) {
        if (v.id === userId) {
          users.set(k, {
            ...v,
            passwordHash: newPasswordHash,
            mustChangePassword: false,
          });
        }
      }
    },
  };

  const stockRepo = buildStockRepo(items, movements);

  const receiptRepo: ReceiptRepositoryPort = {
    saveReceipt: async (doc) => {
      receipts.set(doc.id, doc);
    },
    findById: async (_wId, id) => receipts.get(id) ?? null,
    markVoided: async ({ receiptId, voidReason, voidedBy, voidedAt }) => {
      const ex = receipts.get(receiptId);
      if (ex) {
        receipts.set(receiptId, {
          ...ex,
          status: 'VOIDED',
          voidReason,
          voidedBy,
          voidedAt,
        });
      }
    },
    listReceipts: async () => ({
      items: Array.from(receipts.values()),
      total: receipts.size,
    }),
  };

  const issueRepo: IssueRepositoryPort = {
    saveIssue: async (doc) => {
      issues.set(doc.id, doc);
    },
    findById: async (_wId, id) => issues.get(id) ?? null,
    markVoided: async ({ issueId, voidReason, voidedBy, voidedAt }) => {
      const ex = issues.get(issueId);
      if (ex) {
        issues.set(issueId, {
          ...ex,
          status: 'VOIDED',
          voidReason,
          voidedBy,
          voidedAt,
        });
      }
    },
    listIssues: async () => ({
      items: Array.from(issues.values()),
      total: issues.size,
    }),
  };

  return { authRepo, stockRepo, receiptRepo, issueRepo, items, movements };
}
