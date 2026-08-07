import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ActionButtonProps extends HTMLMotionProps<'button'> {
  label: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'glass' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95',
    glass:
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 shadow-sm active:scale-95',
    accent:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95',
  };

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5 rounded-xl min-h-[36px]',
    md: 'h-11 px-4 text-xs font-bold gap-2 rounded-xl min-h-[44px]',
    lg: 'h-13 px-5 text-sm font-black gap-2.5 rounded-2xl min-h-[52px]',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-bold transition-all duration-150 touch-manipulation cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{label}</span>
    </motion.button>
  );
};
