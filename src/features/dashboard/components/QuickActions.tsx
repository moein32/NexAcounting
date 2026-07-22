import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { FilePlus, ShoppingBag, UserPlus, PackagePlus, Receipt, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function QuickActions() {
  const actions = [
    {
      title: 'فاکتور فروش جدید',
      path: '/sales/invoices',
      icon: <FilePlus className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'فاکتور خرید جدید',
      path: '/purchases/invoices',
      icon: <ShoppingBag className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: 'تعریف شخص جدید',
      path: '/parties/customers',
      icon: <UserPlus className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'تعریف کالا/خدمت',
      path: '/products',
      icon: <PackagePlus className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: 'ثبت دریافت/پرداخت',
      path: '/treasury/receipts',
      icon: <Receipt className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50 dark:bg-sky-950/50',
    },
    {
      title: 'ثبت سند حسابداری',
      path: '/accounting/journal',
      icon: <ArrowLeftRight className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50 dark:bg-purple-950/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-4">
      {actions.map((act, idx) => (
        <Link key={idx} to={act.path}>
          <Card className="p-3 hover:border-blue-500/50 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer">
            <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform ${act.bg}`}>
              {act.icon}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
              {act.title}
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
