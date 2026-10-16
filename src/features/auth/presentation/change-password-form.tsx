'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { changePasswordAction } from './actions';

function PasswordFields(props: {
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Password Saat Ini</label>
        <input
          type="password" value={props.currentPassword}
          onChange={(e) => props.setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (Min. 8 Karakter)</label>
        <input
          type="password" value={props.newPassword} minLength={8}
          onChange={(e) => props.setNewPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none" required
        />
      </div>
    </div>
  );
}

function PasswordFormHeader({ mustChangePassword }: { mustChangePassword?: boolean }) {
  return (
    <>
      {mustChangePassword && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-bold text-amber-900 flex items-center gap-2">
          <span>⚠️</span>
          <span>Login pertama: wajib mengganti password akun Administrator sebelum beraktivitas.</span>
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
        <h3 className="font-bold text-slate-900 text-sm">Ganti Kata Sandi Akun</h3>
      </div>
    </>
  );
}

export function ChangePasswordForm({
  mustChangePassword,
}: {
  mustChangePassword?: boolean;
}): React.ReactElement {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await changePasswordAction({ currentPassword, newPassword });
    setLoading(false);
    if (!res.ok) return setMsg({ text: res.message, ok: false });
    setMsg({ text: 'Password berhasil diperbarui dengan aman.', ok: true });
    setCurrentPassword('');
    setNewPassword('');
  }

  return (
    <Card className="p-4 sm:p-5 space-y-3.5 shadow-sm border border-slate-200/80">
      <PasswordFormHeader mustChangePassword={mustChangePassword} />
      <form onSubmit={handleSubmit} className="space-y-3">
        <PasswordFields
          currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
          newPassword={newPassword} setNewPassword={setNewPassword}
        />
        {msg && (
          <div className={`p-2.5 rounded-xl text-xs font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
            {msg.ok ? '✓ ' : '✕ '} {msg.text}
          </div>
        )}
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
        </Button>
      </form>
    </Card>
  );
}
