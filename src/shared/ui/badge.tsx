import React from 'react';
import { cn } from './cn';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  showDot?: boolean;
  withDot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dot: 'bg-slate-500',
  },
  success: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  warning: {
    container: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500 animate-pulse',
  },
  danger: {
    container: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
  info: {
    container: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
  },
  outline: {
    container: 'bg-white text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export function Badge({
  variant = 'default',
  children,
  className,
  showDot,
  withDot,
}: BadgeProps): React.ReactElement {
  const isDotVisible = showDot ?? withDot ?? false;
  const { container, dot } = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight shadow-xs',
        container,
        className
      )}
    >
      {isDotVisible && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />}
      <span>{children}</span>
    </span>
  );
}
