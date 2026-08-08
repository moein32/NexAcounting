import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileCardProps extends HTMLMotionProps<'div'> {
  title: string;
  subtitle?: string;
  avatar?: string;
  icon?: LucideIcon;
  iconBg?: string;
  badge?: {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  };
  amount?: string;
  amountUnit?: string;
  amountColor?: string;
  tags?: string[];
  details?: { label: string; value: string }[];
  onClick?: () => void;
  actions?: React.ReactNode;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  avatar,
  icon: Icon,
  iconBg = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  badge,
  amount,
  amountUnit = 'تومان',
  amountColor = 'text-slate-900 dark:text-slate-100',
  tags,
  details,
  onClick,
  actions,
  className,
  ...props
}) => {
  const badgeColors = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-150',
        onClick && 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/60',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Right Info Section */}
        <div className="flex items-center gap-3 overflow-hidden">
          {avatar ? (
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 shadow-xs text-sm">
              {avatar}
            </div>
          ) : Icon ? (
            <div className={cn('p-2.5 rounded-2xl shrink-0', iconBg)}>
              <Icon className="w-5 h-5" />
            </div>
          ) : null}

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                {title}
              </h4>
              {badge && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0',
                    badgeColors[badge.variant || 'neutral']
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Left Amount / Arrow */}
        <div className="flex items-center gap-1.5 shrink-0 text-left">
          {amount && (
            <div className="text-left">
              <div className="flex items-baseline gap-1 justify-end">
                <span className={cn('text-sm sm:text-base font-black font-mono tracking-tight', amountColor)}>
                  {amount}
                </span>
                {amountUnit && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    {amountUnit}
                  </span>
                )}
              </div>
            </div>
          )}
          {onClick && <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />}
        </div>
      </div>

      {/* Detail Rows if exists */}
      {details && details.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
          {details.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-slate-400">{d.label}:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{d.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tags if exists */}
      {tags && tags.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {tags.map((t, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">{actions}</div>}
    </motion.div>
  );
};
