import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Home, FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-3xl border border-blue-200/50 dark:border-blue-800/40">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100">404</h1>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">صفحه مورد نظر یافت نشد</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        آدرسی که وارد کرده‌اید وجود ندارد یا منتقل شده است. لطفاً به صفحه اصلی بازگردید.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="md" icon={<Home className="w-4 h-4" />}>
          بازگشت به داشبورد اصلی
        </Button>
      </Link>
    </div>
  );
}
