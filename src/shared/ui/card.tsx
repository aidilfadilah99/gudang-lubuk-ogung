import React from 'react';
import { Sparkles } from 'lucide-react';
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
        'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_6px_16px_-4px_rgba(15,23,42,0.03)]',
        'transition-all duration-200 hover:border-slate-300',
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
    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 text-sm text-emerald-950 shadow-sm animate-pulse">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
        <p className="font-bold text-xs sm:text-sm">{message}</p>
      </div>
      <p className="text-[11px] text-emerald-700/90 mt-1 pl-6">
        Mohon tunggu sejenak bila koneksi sinyal sedang lambat atau database baru
        aktif dari mode hemat daya.
      </p>
    </div>
  );
}
