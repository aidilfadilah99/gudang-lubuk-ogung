import React from 'react';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/features/auth';
import { getServerSession } from '@/shared/security/session';

export default async function LoginPage(): Promise<React.ReactElement> {
  const session = await getServerSession();
  if (session) {
    redirect('/dashboard');
  }
  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 bg-slate-900 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
