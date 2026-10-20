import { NextRequest, NextResponse } from 'next/server';
import { DbExecutor, withUnitOfWork } from '@/shared/db/client';
import { createReceiptRepository, createReceiptUseCase } from '@/features/receipts';
import { createIssueRepository, createIssueUseCase } from '@/features/issues';
import { createStockRepository } from '@/features/stock';
import { createSupplierRepository } from '@/features/suppliers';

interface MobileLineInput {
  itemId: string;
  quantity: number | string;
  price?: number | string;
}

interface MobileTransactionPayload {
  type?: 'MASUK' | 'KELUAR';
  warehouseId?: string;
  actorId?: string;
  referenceNumber?: string;
  party?: string;
  notes?: string;
  lines?: MobileLineInput[];
}

async function handleReceipt(tx: DbExecutor, payload: MobileTransactionPayload) {
  const {
    warehouseId = 'wh_lubuk_ogung_01',
    actorId = 'usr_admin_01',
    referenceNumber,
    notes,
    lines = [],
  } = payload;
  const receiptRepo = createReceiptRepository(tx);
  const stockRepo = createStockRepository(tx);
  const supplierRepo = createSupplierRepository(tx);

  const supplierList = await supplierRepo.listSuppliers(warehouseId);
  const supplierId = supplierList[0]?.id || 'sup_lubuk_01';

  const doc = await createReceiptUseCase(
    {
      warehouseId,
      actorId,
      supplierId,
      invoiceNumber: referenceNumber || `INV-${Date.now()}`,
      notes,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        quantity: Number(l.quantity),
        unitPurchasePrice: Number(l.price || 0),
      })),
    },
    { receiptRepo, stockRepo }
  );

  return {
    type: 'MASUK',
    documentNumber: doc.receiptNumber,
    totalLines: doc.lines.length,
    totalAmount: doc.lines.reduce((acc, l) => acc + l.subtotal, 0),
  };
}

async function handleIssue(tx: DbExecutor, payload: MobileTransactionPayload) {
  const {
    warehouseId = 'wh_lubuk_ogung_01',
    actorId = 'usr_admin_01',
    party = 'Petugas Mobile',
    notes,
    lines = [],
  } = payload;
  const issueRepo = createIssueRepository(tx);
  const stockRepo = createStockRepository(tx);

  const doc = await createIssueUseCase(
    {
      warehouseId,
      actorId,
      destinationType: 'ANGGOTA',
      recipientName: party,
      notes,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        quantity: Number(l.quantity),
        unitSellingPrice: Number(l.price || 0),
      })),
    },
    { issueRepo, stockRepo }
  );

  return {
    type: 'KELUAR',
    documentNumber: doc.issueNumber,
    totalLines: doc.lines.length,
    totalAmount: doc.lines.reduce((acc, l) => acc + l.subtotal, 0),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as MobileTransactionPayload;
    const { type, lines } = body;

    if (!type || !lines || lines.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tipe transaksi dan daftar barang wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await withUnitOfWork(async (tx) => {
      if (type === 'MASUK') return handleReceipt(tx, body);
      if (type === 'KELUAR') return handleIssue(tx, body);
      throw new Error(`Tipe transaksi tidak valid: ${type}`);
    });

    return NextResponse.json({
      success: true,
      message: `Transaksi ${type} berhasil dicatat ke server cloud.`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses transaksi.';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
