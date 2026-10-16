import React from 'react';
import { redirect } from 'next/navigation';
import { Warehouse } from 'lucide-react';
import { APP_CONSTANTS, USER_ROLES } from '@/shared/config/constants';
import { getServerSession } from '@/shared/security/session';
import { Badge } from '@/shared/ui/badge';
import {
  BottomMobileNav,
  SecondaryMenuStrip,
  TopLogoutButton,
} from './nav-client';

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm shadow-emerald-800/20">
        <Warehouse className="h-5 w-5" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
            {APP_CONSTANTS.COOPERATIVE_NAME}
          </h1>
          <span className="hidden sm:inline-flex rounded-full bg-red-50 text-red-700 border border-red-200/70 px-2 py-0.5 text-[10px] font-bold">
            KDKMP
          </span>
        </div>
        <p className="text-[11px] font-medium text-slate-500">Sistem Pergudangan & Logistik Mandiri</p>
      </div>
    </div>
  );
}

function BrandHeader({ fullName, role }: { fullName: string; role: string }) {
  const isAdmin = role === USER_ROLES.ADMIN;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md px-4 py-3 shadow-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <BrandLogo />
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-bold text-slate-900">{fullName}</span>
            <Badge variant={isAdmin ? 'success' : 'default'} className="mt-0.5 scale-90 origin-right">
              {isAdmin ? 'ADMINISTRATOR' : 'PETUGAS GUDANG'}
            </Badge>
          </div>
          <TopLogoutButton />
        </div>
      </div>
    </header>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getServerSession();
  if (!session) redirect('/login');

  const isAdmin = session.role === USER_ROLES.ADMIN;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 pb-24 sm:pb-12">
      <BrandHeader fullName={session.fullName} role={session.role} />
      <SecondaryMenuStrip isAdmin={isAdmin} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>
      <BottomMobileNav />
    </div>
  );
}
