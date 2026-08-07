import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBg?: string;
  accentBorder?: string;
  onClick?: () => void;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = 'تومان',
  subtitle,
  icon: Icon,
  iconBg = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  accentBorder,
  onClick,
  trend,
  isLoading = false,
}) => {
  return (
    <GlassCard
      variant={onClick ? 'interactive' : 'default'}
      onClick={onClick}
      className={cn('relative overflow-hidden flex flex-col justify-between gap-3', accentBorder)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        {Icon && (
          <div className={cn('p-2.5 rounded-xl shrink-0', iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        {isLoading ? (
          <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg my-1" />
        ) : (
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {unit}
              </span>
            )}
          </div>
        )}

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1.5">
            {trend && (
              <span
                className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-md dir-ltr',
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
