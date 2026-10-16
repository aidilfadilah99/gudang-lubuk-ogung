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
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru (Min. 8 Karakter)</label>
        <input
          type="password" value={props.newPassword} minLength={8}
          onChange={(e) => props.setNewPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
        />
      </div>
    </div>
  );
}

export function ChangePasswordForm({
  mustChangePassword,
}: {
  mustChangePassword?: boolean;
}): React.ReactElement {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await changePasswordAction({ currentPassword, newPassword });
    setLoading(false);
    if (!res.ok) return setMsg(`❌ ${res.message}`);
    setMsg('✅ Password berhasil diperbarui.');
    setCurrentPassword('');
    setNewPassword('');
  }

  return (
    <Card className="space-y-3">
      {mustChangePassword && (
        <div className="rounded-xl bg-amber-100 p-3 text-xs font-bold text-amber-900">
          ⚠️ Login pertama terdeteksi: Anda wajib mengganti password bawaan Admin.
        </div>
      )}
      <h3 className="font-bold text-slate-900">Ganti Password Saya</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <PasswordFields
          currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
          newPassword={newPassword} setNewPassword={setNewPassword}
        />
        {msg && <p className="text-xs font-semibold text-slate-800">{msg}</p>}
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Perbarui Password'}
        </Button>
      </form>
    </Card>
  );
}
