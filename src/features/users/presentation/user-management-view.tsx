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

function AddStaffForm({ onCreated }: { onCreated: (msg: string) => void }) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await createStaffAction({ username, fullName, initialPassword });
    setLoading(false);
    if (!res.ok) return onCreated(`❌ ${res.message}`);
    setUsername(''); setFullName(''); setInitialPassword('');
    onCreated(`✅ Petugas "${res.data.username}" berhasil ditambahkan.`);
  }

  return (
    <Card>
      <form onSubmit={handleAdd} className="space-y-3">
        <h3 className="font-bold text-slate-900">Tambah Petugas Gudang Baru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text" value={username} onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (mis: petugas3)" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
          />
          <input
            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Nama Lengkap Petugas" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
          />
          <input
            type="password" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)}
            placeholder="Password Awal (min 8 kar)" minLength={8}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" required
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Tambah Petugas'}
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
  return (
    <Card className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">{u.fullName}</span>
          <Badge variant="default">{u.role}</Badge>
          <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
        </div>
        <p className="text-xs text-slate-600">Username: @{u.username}</p>
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
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleToggle(u: StaffUserSummary) {
    const res = await toggleStaffStatusAction({ userId: u.id, isActive: !u.isActive });
    setFeedback(res.ok ? `✅ Status akun ${u.username} diperbarui.` : `❌ ${res.message}`);
  }

  async function handleResetPassword(u: StaffUserSummary) {
    const temp = window.prompt(`Masukkan password sementara baru untuk ${u.username} (minimal 8 karakter):`);
    if (!temp) return;
    const res = await resetStaffPasswordAction({ userId: u.id, newTemporaryPassword: temp });
    setFeedback(res.ok ? `✅ Password ${u.username} berhasil di-reset.` : `❌ ${res.message}`);
  }

  return (
    <div className="space-y-4">
      <AddStaffForm onCreated={setFeedback} />
      {feedback && <p className="rounded-xl bg-slate-100 p-3 text-xs font-semibold text-slate-800">{feedback}</p>}
      <div className="space-y-2.5">
        {users.map((u) => (
          <StaffRowCard key={u.id} u={u} onReset={handleResetPassword} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
