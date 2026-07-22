import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ className, variant = 'primary', size = 'md', children, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40',
    warning: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] rounded-md font-medium whitespace-nowrap',
    md: 'px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
