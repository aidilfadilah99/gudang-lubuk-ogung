'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { loginAction } from './actions';

function LoginHeader() {
  return (
    <div className="text-center space-y-1">
      <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
        KDKMP LUBUK OGUNG
      </span>
      <h1 className="text-xl font-extrabold text-slate-900">Sistem Pergudangan Barang</h1>
      <p className="text-xs text-slate-600">Masuk dengan akun Admin atau Petugas Gudang</p>
    </div>
  );
}

function LoginInputs(props: {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
        <input
          type="text" autoComplete="username" value={props.username}
          onChange={(e) => props.setUsername(e.target.value)}
          placeholder="Contoh: admin atau petugas1"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
        <input
          type="password" autoComplete="current-password" value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm" required
        />
      </div>
    </>
  );
}

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <Card className="w-full max-w-md mx-auto p-6 space-y-4">
      <LoginHeader />
      <form onSubmit={handleSubmit} className="space-y-3">
        <LoginInputs username={username} setUsername={setUsername} password={password} setPassword={setPassword} />
        {errorMsg && <p className="rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-700">{errorMsg}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? 'Memverifikasi...' : 'Masuk ke Gudang'}
        </Button>
      </form>
    </Card>
  );
}
