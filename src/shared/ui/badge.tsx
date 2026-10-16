import React from 'react';
import { cn } from './cn';

export function Badge({
  variant = 'default',
  children,
}: {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}): React.ReactElement {
  const styles = {
    default: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}
