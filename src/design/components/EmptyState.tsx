import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, FileX, BellOff, FolderOpen, Sparkles } from 'lucide-react';
import { ActionButton } from './ActionButton';
import { GlassCard } from './GlassCard';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'invoice' | 'notification' | 'general';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  type = 'general',
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'invoice':
        return FileX;
      case 'notification':
        return BellOff;
      default:
        return FolderOpen;
    }
  };

  const IconComponent = icon || getDefaultIcon();

  return (
    <GlassCard className="flex flex-col items-center justify-center p-8 text-center my-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner"
      >
        <IconComponent className="w-8 h-8" />
      </motion.div>

      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
        {title}
      </h4>

      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-4">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <ActionButton
          label={actionLabel}
          icon={Sparkles}
          variant="primary"
          size="sm"
          onClick={onAction}
        />
      )}
    </GlassCard>
  );
};
