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
    <main className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-slate-100">
      <LoginForm />
    </main>
  );
}
