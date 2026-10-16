'use client';

import React, { useState } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { StaffUserSummary } from '../domain/user';
import {
  createStaffAction,
  resetStaffPasswordAction,
  toggleStaffStatusAction,
} from './actions';

function StaffFormInputs(props: {
  username: string; setUsername: (v: string) => void;
  fullName: string; setFullName: (v: string) => void;
  initialPassword: string; setInitialPassword: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Username Login</label>
        <input
          type="text" value={props.username} onChange={(e) => props.setUsername(e.target.value)}
          placeholder="petugas3" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
        <input
          type="text" value={props.fullName} onChange={(e) => props.setFullName(e.target.value)}
          placeholder="Nama Lengkap" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none" required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Password Sementara</label>
        <input
          type="password" value={props.initialPassword} onChange={(e) => props.setInitialPassword(e.target.value)}
          placeholder="Min 8 karakter" minLength={8}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none" required
        />
      </div>
    </div>
  );
}

function AddStaffForm({ onCreated }: { onCreated: (res: { text: string; ok: boolean }) => void }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createStaffAction({ username, fullName, initialPassword });
    setLoading(false);
    if (!res.ok) return onCreated({ text: res.message, ok: false });
    setUsername(''); setFullName(''); setInitialPassword('');
    onCreated({ text: `Akun Petugas "${res.data.username}" berhasil didaftarkan.`, ok: true });
  }

  return (
    <Card className="p-4 sm:p-5 shadow-sm border border-slate-200/80">
      <form onSubmit={handleAdd} className="space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">Registrasi Petugas Gudang Baru</h3>
        </div>
        <StaffFormInputs username={username} setUsername={setUsername} fullName={fullName} setFullName={setFullName} initialPassword={initialPassword} setInitialPassword={setInitialPassword} />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Mendaftarkan...' : 'Daftarkan Petugas'}
        </Button>
      </form>
    </Card>
  );
}

function StaffRowCard({
  u, onReset, onToggle,
}: {
  u: StaffUserSummary; onReset: (u: StaffUserSummary) => void; onToggle: (u: StaffUserSummary) => void;
}) {
  const initials = u.fullName.slice(0, 2).toUpperCase();
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4 hover:shadow-sm transition-all border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
          {initials}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{u.fullName}</span>
            <Badge variant="info">{u.role}</Badge>
            <Badge variant={u.isActive ? 'success' : 'danger'} withDot>{u.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
          </div>
          <p className="text-xs text-slate-500 font-mono">@{u.username}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onReset(u)}>Reset Password</Button>
        {u.role !== 'ADMIN' && (
          <Button variant={u.isActive ? 'danger' : 'primary'} size="sm" onClick={() => onToggle(u)}>
            {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function UserManagementView({ users }: { users: StaffUserSummary[] }): React.ReactElement {
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleToggle(u: StaffUserSummary) {
    const res = await toggleStaffStatusAction({ userId: u.id, isActive: !u.isActive });
    setFeedback({
      text: res.ok ? `Status akun @${u.username} berhasil diubah.` : res.message,
      ok: res.ok,
    });
  }

  async function handleResetPassword(u: StaffUserSummary) {
    const temp = window.prompt(`Masukkan password sementara baru untuk @${u.username} (minimal 8 karakter):`);
    if (!temp) return;
    const res = await resetStaffPasswordAction({ userId: u.id, newTemporaryPassword: temp });
    setFeedback({
      text: res.ok ? `Password @${u.username} berhasil di-reset.` : res.message,
      ok: res.ok,
    });
  }

  return (
    <div className="space-y-4">
      <AddStaffForm onCreated={setFeedback} />
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${feedback.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {feedback.ok ? '✓ ' : '✕ '} {feedback.text}
        </div>
      )}
      <div className="space-y-2.5">
        {users.map((u) => (
          <StaffRowCard key={u.id} u={u} onReset={handleResetPassword} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
