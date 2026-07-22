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
