import React from 'react';
import { StatCardData } from '../../types';
import { formatCurrency } from '../../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BadgePercent,
  Users,
  HandCoins,
  Wallet,
  Landmark,
} from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BadgePercent,
  Users,
  HandCoins,
  Wallet,
  Landmark,
};

export interface StatCardProps {
  data: StatCardData;
  className?: string;
  key?: React.Key;
}

export function StatCard({ data, className }: StatCardProps) {
  const IconComponent = iconMap[data.icon] || Wallet;

  const colorStyles = {
    primary: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200/50 dark:border-blue-800/40',
    },
    success: {
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200/50 dark:border-emerald-800/40',
    },
    warning: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200/50 dark:border-amber-800/40',
    },
    danger: {
      bg: 'bg-rose-50/80 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200/50 dark:border-rose-800/40',
    },
    info: {
      bg: 'bg-sky-50/80 dark:bg-sky-950/40',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200/50 dark:border-sky-800/40',
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
    },
  };

  const currentStyle = colorStyles[data.type] || colorStyles.primary;

  return (
    <Card className={cn('p-4 transition-all duration-150 hover:shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{data.title}</span>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(data.value, data.unit as any)}
            </span>
          </div>
        </div>

        <div className={cn('p-2.5 rounded-xl border shrink-0', currentStyle.bg, currentStyle.text, currentStyle.border)}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>

      {data.changePercent !== undefined && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md text-[11px]',
              data.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
            )}
          >
            {data.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>%{Math.abs(data.changePercent)}</span>
          </span>
          <span className="text-slate-400 text-[11px]">نسبت به دوره قبل</span>
        </div>
      )}
    </Card>
  );
}
