import React from 'react';
import { cn } from './cn';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ColdStartBanner({
  message = 'Memuat data dari server gudang Neon PostgreSQL...',
}: {
  message?: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 animate-pulse">
      <p className="font-semibold">{message}</p>
      <p className="text-xs text-emerald-700 mt-1">
        Mohon tunggu sejenak bila koneksi sinyal sedang lambat atau database baru
        aktif dari mode hemat daya.
      </p>
    </div>
  );
}
