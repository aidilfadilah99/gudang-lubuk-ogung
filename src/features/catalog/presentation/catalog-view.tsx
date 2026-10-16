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

function ItemBasicInputs(props: {
  sku: string; setSku: (v: string) => void;
  barcode: string; setBarcode: (v: string) => void;
  name: string; setName: (v: string) => void;
  categoryId: string; setCategoryId: (v: string) => void;
  baseUnitId: string; setBaseUnitId: (v: string) => void;
  categories: CategoryRecord[]; units: UnitRecord[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <input
        type="text" value={props.sku} onChange={(e) => props.setSku(e.target.value)}
        placeholder="Kode SKU (mis: PPK-004)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" required
      />
      <input
        type="text" value={props.barcode} onChange={(e) => props.setBarcode(e.target.value)}
        placeholder="Barcode (Opsional)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="text" value={props.name} onChange={(e) => props.setName(e.target.value)}
        placeholder="Nama Barang" className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2" required
      />
      <select
        value={props.categoryId} onChange={(e) => props.setCategoryId(e.target.value)}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
      >
        {props.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select
        value={props.baseUnitId} onChange={(e) => props.setBaseUnitId(e.target.value)}
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
      >
        {props.units.map((u) => <option key={u.id} value={u.id}>{u.code} - {u.name}</option>)}
      </select>
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
      <input
        type="number" min="0" value={props.purchasePrice} onChange={(e) => props.setPurchasePrice(e.target.value)}
        placeholder="Harga Beli (Rp)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" required
      />
      <input
        type="number" min="0" value={props.sellingPrice} onChange={(e) => props.setSellingPrice(e.target.value)}
        placeholder="Harga Jual (Rp)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" required
      />
      <input
        type="number" min="0" value={props.minStock} onChange={(e) => props.setMinStock(e.target.value)}
        placeholder="Stok Minimum" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" required
      />
    </div>
  );
}

function CatalogItemCard({ item }: { item: CatalogItemRecord }) {
  return (
    <Card className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-500">{item.sku} {item.barcode ? `• ${item.barcode}` : ''}</span>
        <Badge variant={item.isActive ? 'success' : 'danger'}>{item.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
      </div>
      <h4 className="font-bold text-slate-900">{item.name}</h4>
      <p className="text-xs text-slate-600">
        Kategori: {item.categoryName} • Satuan: {item.unitCode} • Min Stok: {formatQuantity(item.minStock)}
      </p>
      <p className="text-xs font-semibold text-emerald-800">
        Beli: {formatRupiah(item.purchasePrice)} • Jual: {formatRupiah(item.sellingPrice)}
      </p>
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
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await upsertCatalogItemAction({
      sku, barcode: barcode || null, name, categoryId, baseUnitId,
      purchasePrice: Number(purchasePrice), sellingPrice: Number(sellingPrice), minStock: Number(minStock), isActive: true,
    });
    if (!res.ok) return setFeedback(`❌ ${res.message}`);
    setFeedback(`✅ Barang "${res.data.name}" berhasil disimpan.`);
    setSku(''); setBarcode(''); setName('');
  }

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Tambah Master Barang Baru</h3>
          <BarcodeScannerButton onScan={setBarcode} />
        </div>
        <ItemBasicInputs sku={sku} setSku={setSku} barcode={barcode} setBarcode={setBarcode} name={name} setName={setName} categoryId={categoryId} setCategoryId={setCategoryId} baseUnitId={baseUnitId} setBaseUnitId={setBaseUnitId} categories={categories} units={units} />
        <ItemPricingInputs purchasePrice={purchasePrice} setPurchasePrice={setPurchasePrice} sellingPrice={sellingPrice} setSellingPrice={setSellingPrice} minStock={minStock} setMinStock={setMinStock} />
        {feedback && <p className="text-xs font-semibold text-slate-800">{feedback}</p>}
        <Button type="submit" size="sm">Simpan Barang</Button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item) => <CatalogItemCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
