import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';
import { elevation } from '../theme/elevation';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'default' | 'card' | 'interactive';
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  glow = false,
  ...props
}) => {
  const baseClass = variant === 'card' ? elevation.glassCard : elevation.glassLight;

  return (
    <motion.div
      whileTap={variant === 'interactive' ? { scale: 0.98 } : undefined}
      className={cn(
        'rounded-2xl p-4 transition-all duration-200',
        baseClass,
        glow && 'shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/20',
        variant === 'interactive' && 'cursor-pointer hover:border-indigo-400/50 dark:hover:border-indigo-500/50',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
