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
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Supplier</label>
        <input
          type="text" value={props.code} onChange={(e) => props.setCode(e.target.value)}
          placeholder="SUP-004" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Perusahaan / Supplier</label>
        <input
          type="text" value={props.name} onChange={(e) => props.setName(e.target.value)}
          placeholder="PT Pupuk Nusantara / UD Hasil Makmur" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">No. Kontak / WhatsApp</label>
        <input
          type="text" value={props.phone} onChange={(e) => props.setPhone(e.target.value)}
          placeholder="0812-xxxx-xxxx" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Gudang / Kantor</label>
        <input
          type="text" value={props.address} onChange={(e) => props.setAddress(e.target.value)}
          placeholder="Jl. Raya Lubuk Ogung Km 2" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
        />
      </div>
    </div>
  );
}

function AddSupplierCard({ onSaved }: { onSaved: (res: { text: string; ok: boolean }) => void }) {
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
    if (!res.ok) return onSaved({ text: res.message, ok: false });
    setCode(''); setName(''); setPhone(''); setAddress('');
    onSaved({ text: `Supplier "${res.data.name}" berhasil didaftarkan.`, ok: true });
  }

  return (
    <Card className="p-4 sm:p-5 shadow-sm border border-slate-200/80">
      <form onSubmit={handleAdd} className="space-y-3.5">
        <h3 className="font-bold text-slate-900 text-sm">Registrasi Supplier Baru</h3>
        <SupplierInputsGrid code={code} setCode={setCode} name={name} setName={setName} phone={phone} setPhone={setPhone} address={address} setAddress={setAddress} />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Mendaftarkan...' : 'Daftarkan Supplier'}
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
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  return (
    <div className="space-y-4">
      {isAdmin && <AddSupplierCard onSaved={setFeedback} />}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${feedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.ok ? '✓ ' : '✕ '} {feedback.text}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suppliers.map((s) => (
          <Card key={s.id} className="p-4 space-y-2 hover:shadow-sm transition-all border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">{s.code}</span>
              <Badge variant={s.isActive ? 'success' : 'danger'} withDot>
                {s.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
            <div className="text-xs text-slate-500 space-y-0.5">
              <p>📞 {s.phone || 'Tidak ada nomor telepon'}</p>
              <p className="truncate">📍 {s.address || 'Alamat belum diatur'}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
