'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, ShieldCheck, User, Warehouse, Zap } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { loginAction } from './actions';

function LoginHeader() {
  return (
    <div className="text-center space-y-2">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white shadow-lg shadow-emerald-700/20">
        <Warehouse className="h-7 w-7" />
      </div>
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] font-bold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          KDKMP LUBUK OGUNG
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-2">
          Sistem Pergudangan Barang
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Pengelolaan stok & buku besar logistik terpercaya Koperasi Desa Merah Putih
        </p>
      </div>
    </div>
  );
}

function DemoQuickFill({
  onSelect,
}: {
  onSelect: (u: string, p: string) => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs">
      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-2">
        <Zap className="h-3.5 w-3.5 text-amber-500" />
        <span>Akses Cepat Pengujian (Pilih Akun):</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelect('admin', 'qwerty12345')}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors text-left"
        >
          <p className="font-bold">Akun Admin</p>
          <p className="text-[10px] text-slate-400">admin • qwerty12345</p>
        </button>
        <button
          type="button"
          onClick={() => onSelect('petugas1', 'PetugasGudang123!')}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors text-left"
        >
          <p className="font-bold">Petugas Gudang</p>
          <p className="text-[10px] text-slate-400">petugas1 • PetugasGudang123!</p>
        </button>
      </div>
    </div>
  );
}

function UsernameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <User className="h-4 w-4" />
        </div>
        <input
          type="text"
          autoComplete="username"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="admin atau petugas1"
          className="w-full rounded-xl border border-slate-300 bg-white pl-9.5 pr-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
          required
        />
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  showPassword,
  toggleShow,
}: {
  value: string;
  onChange: (v: string) => void;
  showPassword: boolean;
  toggleShow: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Lock className="h-4 w-4" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 bg-white pl-9.5 pr-10 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-3 focus:ring-emerald-500/15"
          required
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function LoginSecurityBadge() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
      <span>Sesi Aman Terenkripsi • KDKMP Lubuk Ogung</span>
    </div>
  );
}

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const res = await loginAction({ username, password });
    setLoading(false);
    if (!res.ok) return setErrorMsg(res.message);
    router.push(res.data.mustChangePassword ? '/users?mustChange=1' : '/dashboard');
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6 sm:p-8 space-y-5 bento-card">
      <LoginHeader />
      <DemoQuickFill onSelect={(u, p) => { setUsername(u); setPassword(p); }} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <UsernameField value={username} onChange={setUsername} />
        <PasswordField value={password} onChange={setPassword} showPassword={showPassword} toggleShow={() => setShowPassword(!showPassword)} />
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700">
            {errorMsg}
          </div>
        )}
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Memverifikasi...' : 'Masuk ke Gudang'}
        </Button>
      </form>
      <LoginSecurityBadge />
    </Card>
  );
}
