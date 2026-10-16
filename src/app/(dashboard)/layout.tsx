import React from 'react';
import { redirect } from 'next/navigation';
import { APP_CONSTANTS, USER_ROLES } from '@/shared/config/constants';
import { getServerSession } from '@/shared/security/session';
import {
  BottomMobileNav,
  SecondaryMenuStrip,
  TopLogoutButton,
} from './nav-client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getServerSession();
  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.role === USER_ROLES.ADMIN;

  return (
    <div className="min-h-screen flex flex-col pb-20 sm:pb-8">
      <header className="bg-emerald-700 text-white px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div>
            <h1 className="text-sm sm:text-base font-extrabold leading-tight">
              {APP_CONSTANTS.COOPERATIVE_NAME}
            </h1>
            <p className="text-[11px] text-emerald-100">
              {session.fullName} ({session.role})
            </p>
          </div>
          <TopLogoutButton />
        </div>
      </header>
      <SecondaryMenuStrip isAdmin={isAdmin} />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">{children}</main>
      <BottomMobileNav />
    </div>
  );
}
