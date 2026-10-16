import React from 'react';
import { cn } from './cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps): React.ReactElement {
  const variants = {
    primary:
      'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    outline:
      'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  };

  const sizes = {
    sm: 'min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'min-h-[46px] px-4 py-2.5 text-sm font-semibold rounded-xl',
    lg: 'min-h-[52px] px-5 py-3 text-base font-bold rounded-xl',
  };

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
