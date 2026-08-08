import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  text?: string;
}

export function LoadingState({ message = 'در حال دریافت اطلاعات...', text }: LoadingStateProps) {
  const label = text || message;
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center my-6">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-500 mb-3" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-4">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-full" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 animate-pulse flex items-center justify-between"
        >
          <div className="flex items-center gap-3 w-2/3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200/60 dark:bg-slate-800 rounded w-1/2" />
            </div>
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-20" />
        </div>
      ))}
    </div>
  );
}

