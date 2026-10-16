import React from 'react';
import { cn } from './cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-700/20 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 border border-emerald-500/30',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:bg-slate-300 border border-slate-200/60 shadow-xs',
  danger:
    'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm shadow-rose-700/20 hover:from-rose-700 hover:to-red-700 active:from-rose-800 active:to-red-800 border border-rose-500/30',
  outline:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-xs',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100/80 active:bg-slate-200/60 border border-transparent',
};

const sizes = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'min-h-[44px] px-4 py-2.5 text-sm font-semibold rounded-xl',
  lg: 'min-h-[50px] px-5 py-3 text-base font-bold rounded-xl',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-150',
        'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30',
        'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
