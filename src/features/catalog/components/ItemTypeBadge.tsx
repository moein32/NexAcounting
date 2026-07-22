import React from 'react';
import { Package, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { ItemType } from '../../../types/catalog';

interface ItemTypeBadgeProps {
  type: ItemType;
  className?: string;
}

export function ItemTypeBadge({ type, className = '' }: ItemTypeBadgeProps) {
  if (type === 'product') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 ${className}`}
      >
        <Package className="w-3.5 h-3.5" />
        <span>کالای فیزیکی</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 ${className}`}
    >
      <Wrench className="w-3.5 h-3.5" />
      <span>خدمات</span>
    </span>
  );
}

interface ItemStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function ItemStatusBadge({ isActive, className = '' }: ItemStatusBadgeProps) {
  if (isActive) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 ${className}`}
      >
        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        <span>فعال</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 ${className}`}
    >
      <XCircle className="w-3 h-3 text-slate-400" />
      <span>غیرفعال</span>
    </span>
  );
}
