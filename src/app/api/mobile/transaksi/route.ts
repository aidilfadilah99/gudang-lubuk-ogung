import { NextRequest, NextResponse } from 'next/server';
import { withUnitOfWork } from '@/shared/db/client';
import { createReceiptRepository } from '@/features/receipts/infrastructure/receipt-repository';
import { createIssueRepository } from '@/features/issues/infrastructure/issue-repository';
import { createStockRepository } from '@/features/stock/infrastructure/stock-repository';
import { createReceiptUseCase } from '@/features/receipts/application/create-receipt';
import { createIssueUseCase } from '@/features/issues/application/create-issue';
import { createSupplierRepository } from '@/features/suppliers/infrastructure/supplier-repository';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      type, // 'MASUK' | 'KELUAR'
      warehouseId = 'wh_lubuk_ogung_01',
      actorId = 'usr_admin_01',
      referenceNumber,
      party = 'Petugas Mobile',
      notes,
      lines = [],
    } = body;

    if (!type || lines.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tipe transaksi dan daftar barang wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await withUnitOfWork(async (tx) => {
      const stockRepo = createStockRepository(tx);

      if (type === 'MASUK') {
        const receiptRepo = createReceiptRepository(tx);
        const supplierRepo = createSupplierRepository(tx);

        // Cari atau gunakan supplier pertama
        const supplierList = await supplierRepo.listSuppliers(warehouseId);
        const supplierId = supplierList[0]?.id || 'sup_lubuk_01';

        const doc = await createReceiptUseCase(
          {
            warehouseId,
            actorId,
            supplierId,
            invoiceNumber: referenceNumber || `INV-${Date.now()}`,
            notes,
            lines: lines.map((l: any) => ({
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
      } else if (type === 'KELUAR') {
        const issueRepo = createIssueRepository(tx);

        const doc = await createIssueUseCase(
          {
            warehouseId,
            actorId,
            destinationType: 'ANGGOTA',
            recipientName: party,
            notes,
            lines: lines.map((l: any) => ({
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
      } else {
        throw new Error(`Tipe transaksi tidak valid: ${type}`);
      }
    });

    return NextResponse.json({
      success: true,
      message: `Transaksi ${type} berhasil dicatat ke server cloud.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Error mobile transaksi:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memproses transaksi.' },
      { status: 400 }
    );
  }
}
