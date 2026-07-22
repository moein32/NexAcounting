import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ShieldAlert, Home, ArrowRight } from 'lucide-react';

export function ForbiddenPage({ requiredPermission }: { requiredPermission?: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-5">
      <div className="p-4 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-3xl border border-amber-200/60 dark:border-amber-800/50">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100">403</h1>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">عدم دسترسی مجاز (Forbidden)</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
        شما مجوز لازم برای ورود به این بخش را ندارید.
        {requiredPermission && (
          <span className="block mt-1 dir-ltr text-amber-600 font-mono text-[11px]">
            [مجوز مورد نیاز: {requiredPermission}]
          </span>
        )}
      </p>
      <div className="flex items-center gap-3 pt-2">
        <Link to="/dashboard">
          <Button variant="primary" size="md" icon={<Home className="w-4 h-4" />}>
            بازگشت به داشبورد
          </Button>
        </Link>
      </div>
    </div>
  );
}
