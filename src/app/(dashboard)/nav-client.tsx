'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Database,
  FileSpreadsheet,
  FileUp,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { logoutAction } from '@/features/auth';
import { cn } from '@/shared/ui/cn';

export function TopLogoutButton(): React.ReactElement {
  const router = useRouter();
  async function handleLogout() {
    await logoutAction();
    router.push('/login');
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
      title="Keluar dari akun"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Keluar</span>
    </button>
  );
}

const PRIMARY_MOBILE_LINKS = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/stock', label: 'Stok', icon: Boxes },
  { href: '/receipts', label: 'Masuk', icon: ArrowDownToLine },
  { href: '/issues', label: 'Keluar', icon: ArrowUpFromLine },
  { href: '/catalog', label: 'Barang', icon: Package },
] as const;

export function BottomMobileNav(): React.ReactElement {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md sm:hidden shadow-lg">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        {PRIMARY_MOBILE_LINKS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all',
                active ? 'text-emerald-700 scale-105' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div className={cn('p-1 rounded-lg', active && 'bg-emerald-50 text-emerald-700')}>
                <Icon className="h-5 w-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stock', label: 'Stok & Kartu Stok', icon: Boxes },
  { href: '/receipts', label: 'Barang Masuk', icon: ArrowDownToLine },
  { href: '/issues', label: 'Barang Keluar', icon: ArrowUpFromLine },
  { href: '/catalog', label: 'Katalog Barang', icon: Package },
  { href: '/suppliers', label: 'Supplier', icon: Truck },
];

const ADMIN_ITEMS = [
  { href: '/reports', label: 'Laporan', icon: FileSpreadsheet },
  { href: '/import', label: 'Impor Excel', icon: FileUp },
  { href: '/backup', label: 'Backup Data', icon: Database },
  { href: '/audit', label: 'Audit Log', icon: ShieldCheck },
  { href: '/users', label: 'Kelola Petugas', icon: Users },
];

export function SecondaryMenuStrip({ isAdmin }: { isAdmin: boolean }): React.ReactElement {
  const pathname = usePathname();
  const allItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <div className="border-b border-slate-200/90 bg-white/70 backdrop-blur-xs">
      <div className="max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none">
        {allItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                active
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
