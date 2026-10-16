'use client';

import React, { useState } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { SupplierRecord } from '../domain/supplier';
import { createSupplierAction } from './actions';

function SupplierInputsGrid(props: {
  code: string; setCode: (v: string) => void;
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  address: string; setAddress: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input
        type="text" value={props.code} onChange={(e) => props.setCode(e.target.value)}
        placeholder="Kode Supplier (mis: SUP-004)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" required
      />
      <input
        type="text" value={props.name} onChange={(e) => props.setName(e.target.value)}
        placeholder="Nama Perusahaan / Kelompok Tani" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" required
      />
      <input
        type="text" value={props.phone} onChange={(e) => props.setPhone(e.target.value)}
        placeholder="No. HP / WhatsApp" className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        type="text" value={props.address} onChange={(e) => props.setAddress(e.target.value)}
        placeholder="Alamat Lengkap" className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function AddSupplierCard({ onSaved }: { onSaved: (msg: string) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createSupplierAction({ code, name, phone, address });
    setLoading(false);
    if (!res.ok) return onSaved(`❌ ${res.message}`);
    setCode('');
    setName('');
    setPhone('');
    setAddress('');
    onSaved(`✅ Supplier "${res.data.name}" berhasil ditambahkan.`);
  }

  return (
    <Card>
      <form onSubmit={handleAdd} className="space-y-3">
        <h3 className="font-bold text-slate-900">Tambah Supplier Baru</h3>
        <SupplierInputsGrid
          code={code}
          setCode={setCode}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          address={address}
          setAddress={setAddress}
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Supplier'}
        </Button>
      </form>
    </Card>
  );
}

export function SuppliersView({
  suppliers,
  isAdmin,
}: {
  suppliers: SupplierRecord[];
  isAdmin: boolean;
}): React.ReactElement {
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {isAdmin && <AddSupplierCard onSaved={setFeedback} />}
      {feedback && (
        <p className="rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-800">
          {feedback}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suppliers.map((s) => (
          <Card key={s.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-600">{s.code}</span>
              <Badge variant={s.isActive ? 'success' : 'danger'}>
                {s.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <h4 className="font-bold text-slate-900">{s.name}</h4>
            <p className="text-xs text-slate-600">
              Telp: {s.phone || '-'} • Alamat: {s.address || '-'}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
