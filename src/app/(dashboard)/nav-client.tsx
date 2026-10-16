'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { logoutAction } from '@/features/auth';

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
      className="inline-flex items-center gap-1 rounded-xl bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-950"
    >
      <LogOut className="h-3.5 w-3.5" />
      Keluar
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
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white sm:hidden">
      <div className="grid grid-cols-5 h-16">
        {PRIMARY_MOBILE_LINKS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                active ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AdminMenuLinks() {
  return (
    <>
      <Link href="/reports" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-800 hover:bg-emerald-50">
        <FileSpreadsheet className="h-3.5 w-3.5" /> Laporan
      </Link>
      <Link href="/import" className="px-2.5 py-1 rounded-lg text-emerald-800 hover:bg-emerald-50">Impor CSV/Excel</Link>
      <Link href="/backup" className="px-2.5 py-1 rounded-lg text-emerald-800 hover:bg-emerald-50">Backup</Link>
      <Link href="/audit" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-800 hover:bg-emerald-50">
        <ShieldCheck className="h-3.5 w-3.5" /> Audit Log
      </Link>
    </>
  );
}

export function SecondaryMenuStrip({ isAdmin }: { isAdmin: boolean }): React.ReactElement {
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
      <Link href="/dashboard" className="px-2.5 py-1 rounded-lg hover:bg-slate-100">Dashboard</Link>
      <Link href="/stock" className="px-2.5 py-1 rounded-lg hover:bg-slate-100">Stok & Kartu Stok</Link>
      <Link href="/receipts" className="px-2.5 py-1 rounded-lg hover:bg-slate-100">Barang Masuk</Link>
      <Link href="/issues" className="px-2.5 py-1 rounded-lg hover:bg-slate-100">Barang Keluar</Link>
      <Link href="/catalog" className="px-2.5 py-1 rounded-lg hover:bg-slate-100">Katalog Barang</Link>
      <Link href="/suppliers" className="px-2.5 py-1 rounded-lg hover:bg-slate-100">Supplier</Link>
      {isAdmin && <AdminMenuLinks />}
      <Link href="/users" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100">
        <Users className="h-3.5 w-3.5" /> {isAdmin ? 'Petugas & Akun' : 'Akun Saya'}
      </Link>
    </div>
  );
}
