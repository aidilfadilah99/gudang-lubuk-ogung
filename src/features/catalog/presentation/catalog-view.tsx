'use client';

import React, { useState } from 'react';
import { formatQuantity, formatRupiah } from '@/shared/lib/format';
import { BarcodeScannerButton } from '@/shared/ui/barcode-scanner';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import {
  CatalogItemRecord,
  CategoryRecord,
  UnitRecord,
} from '../domain/catalog';
import { upsertCatalogItemAction } from './actions';

function ItemIdentifierInputs(props: {
  sku: string; setSku: (v: string) => void;
  barcode: string; setBarcode: (v: string) => void;
  name: string; setName: (v: string) => void;
}) {
  return (
    <>
      <div className="sm:col-span-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Kode SKU</label>
        <input
          type="text" value={props.sku} onChange={(e) => props.setSku(e.target.value)}
          placeholder="PPK-004" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
      <div className="sm:col-span-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode (EAN-13 / Code128)</label>
        <input
          type="text" value={props.barcode} onChange={(e) => props.setBarcode(e.target.value)}
          placeholder="Opsional" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
        />
      </div>
      <div className="sm:col-span-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Barang Lengkap</label>
        <input
          type="text" value={props.name} onChange={(e) => props.setName(e.target.value)}
          placeholder="Nama barang" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
    </>
  );
}

function ItemClassificationInputs(props: {
  categoryId: string; setCategoryId: (v: string) => void;
  baseUnitId: string; setBaseUnitId: (v: string) => void;
  categories: CategoryRecord[]; units: UnitRecord[];
}) {
  return (
    <>
      <div className="sm:col-span-6">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Barang</label>
        <select
          value={props.categoryId} onChange={(e) => props.setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
        >
          {props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-6">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan Dasar</label>
        <select
          value={props.baseUnitId} onChange={(e) => props.setBaseUnitId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
        >
          {props.units.map((u) => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
        </select>
      </div>
    </>
  );
}

function ItemBasicInputs(props: {
  sku: string; setSku: (v: string) => void;
  barcode: string; setBarcode: (v: string) => void;
  name: string; setName: (v: string) => void;
  categoryId: string; setCategoryId: (v: string) => void;
  baseUnitId: string; setBaseUnitId: (v: string) => void;
  categories: CategoryRecord[]; units: UnitRecord[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
      <ItemIdentifierInputs sku={props.sku} setSku={props.setSku} barcode={props.barcode} setBarcode={props.setBarcode} name={props.name} setName={props.setName} />
      <ItemClassificationInputs categoryId={props.categoryId} setCategoryId={props.setCategoryId} baseUnitId={props.baseUnitId} setBaseUnitId={props.setBaseUnitId} categories={props.categories} units={props.units} />
    </div>
  );
}

function ItemPricingInputs(props: {
  purchasePrice: string; setPurchasePrice: (v: string) => void;
  sellingPrice: string; setSellingPrice: (v: string) => void;
  minStock: string; setMinStock: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli Standar (Rp)</label>
        <input
          type="number" min="0" value={props.purchasePrice} onChange={(e) => props.setPurchasePrice(e.target.value)}
          placeholder="0" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual Standar (Rp)</label>
        <input
          type="number" min="0" value={props.sellingPrice} onChange={(e) => props.setSellingPrice(e.target.value)}
          placeholder="0" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Minimum Peringatan</label>
        <input
          type="number" min="0" value={props.minStock} onChange={(e) => props.setMinStock(e.target.value)}
          placeholder="10" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
    </div>
  );
}

function CatalogItemCard({ item }: { item: CatalogItemRecord }) {
  return (
    <Card className="p-4 space-y-2.5 hover:shadow-sm transition-all border border-slate-200/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">{item.sku}</span>
          <span className="text-xs text-slate-500 font-medium">{item.categoryName}</span>
        </div>
        <Badge variant={item.isActive ? 'success' : 'danger'} withDot>{item.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
      </div>
      <div>
        <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Satuan: <strong>{item.unitCode}</strong> • Ambang Min: <strong>{formatQuantity(item.minStock)}</strong> {item.unitCode}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2 text-xs border border-slate-100">
        <div>
          <span className="text-[10px] text-slate-400 block">Harga Beli</span>
          <span className="font-semibold text-slate-700">{formatRupiah(item.purchasePrice)}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Harga Jual</span>
          <span className="font-extrabold text-emerald-800">{formatRupiah(item.sellingPrice)}</span>
        </div>
      </div>
    </Card>
  );
}

function AddCatalogItemForm({ categories, units }: { categories: CategoryRecord[]; units: UnitRecord[] }) {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [baseUnitId, setBaseUnitId] = useState(units[0]?.id ?? '');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minStock, setMinStock] = useState('10');
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await upsertCatalogItemAction({
      sku, barcode: barcode || null, name, categoryId, baseUnitId,
      purchasePrice: Number(purchasePrice), sellingPrice: Number(sellingPrice), minStock: Number(minStock), isActive: true,
    });
    if (!res.ok) return setFeedback({ text: res.message, ok: false });
    setFeedback({ text: `Barang "${res.data.name}" berhasil disimpan ke master katalog.`, ok: true });
    setSku(''); setBarcode(''); setName('');
  }

  return (
    <Card className="p-4 sm:p-5 shadow-sm border border-slate-200/80">
      <form onSubmit={handleSave} className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="font-bold text-slate-900 text-sm">Registrasi Master Barang Baru</h3>
          <BarcodeScannerButton onScan={setBarcode} />
        </div>
        <ItemBasicInputs sku={sku} setSku={setSku} barcode={barcode} setBarcode={setBarcode} name={name} setName={setName} categoryId={categoryId} setCategoryId={setCategoryId} baseUnitId={baseUnitId} setBaseUnitId={setBaseUnitId} categories={categories} units={units} />
        <ItemPricingInputs purchasePrice={purchasePrice} setPurchasePrice={setPurchasePrice} sellingPrice={sellingPrice} setSellingPrice={setSellingPrice} minStock={minStock} setMinStock={setMinStock} />
        {feedback && (
          <div className={`p-2.5 rounded-xl text-xs font-semibold ${feedback.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {feedback.ok ? '✓ ' : '✕ '} {feedback.text}
          </div>
        )}
        <Button type="submit" size="sm">Daftarkan Barang</Button>
      </form>
    </Card>
  );
}

export function CatalogView({
  items, categories, units, isAdmin,
}: {
  items: CatalogItemRecord[]; categories: CategoryRecord[]; units: UnitRecord[]; isAdmin: boolean;
}): React.ReactElement {
  return (
    <div className="space-y-4">
      {isAdmin && <AddCatalogItemForm categories={categories} units={units} />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => <CatalogItemCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
