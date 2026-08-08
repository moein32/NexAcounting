import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

type ToastListener = (messages: ToastMessage[]) => void;
let toastListeners: ToastListener[] = [];
let activeToasts: ToastMessage[] = [];

export const showToast = {
  success: (title: string, message?: string) => addToast('success', title, message),
  error: (title: string, message?: string) => addToast('error', title, message),
  info: (title: string, message?: string) => addToast('info', title, message),
  warning: (title: string, message?: string) => addToast('warning', title, message),
};

function addToast(type: ToastMessage['type'], title: string, message?: string) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, type, title, message };
  activeToasts = [...activeToasts, newToast];
  toastListeners.forEach((l) => l(activeToasts));

  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

function removeToast(id: string) {
  activeToasts = activeToasts.filter((t) => t.id !== id);
  toastListeners.forEach((l) => l(activeToasts));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>(activeToasts);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-5 sm:right-auto sm:bottom-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none mx-auto sm:mx-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  key?: React.Key;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500/40',
    error: 'border-rose-500/40',
    warning: 'border-amber-500/40',
    info: 'border-blue-500/40',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 bg-white dark:bg-slate-900 border shadow-lg rounded-xl w-full animate-in slide-in-from-bottom-2 duration-200',
        borderColors[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 text-right">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{toast.title}</h4>
        {toast.message && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
