import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  AlertTriangle,
  CreditCard,
  Bell,
  ChevronLeft,
  Plus,
  FilePlus,
  UserPlus,
  BarChart2,
} from 'lucide-react';
import { formatNumber } from '../../../lib/utils';

interface MobileDashboardProps {
  metrics: {
    todaySales?: number;
    receivablesTotal?: number;
    payablesTotal?: number;
    cashBalance?: number;
    lowStockCount?: number;
    pendingChecksCount?: number;
    unreadNotificationsCount?: number;
  };
  loading?: boolean;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({ metrics, loading }) => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 'sales',
      title: 'فروش امروز',
      value: formatNumber(metrics?.todaySales || 0),
      subtitle: 'تومان',
      icon: TrendingUp,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      path: '/sales/invoices',
      accentColor: 'border-r-4 border-emerald-500',
    },
    {
      id: 'receivables',
      title: 'طلب از مشتریان',
      value: formatNumber(metrics?.receivablesTotal || 0),
      subtitle: 'تومان (مانده بدهکار)',
      icon: ArrowDownLeft,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      path: '/parties/customers',
      accentColor: 'border-r-4 border-blue-500',
    },
    {
      id: 'payables',
      title: 'بدهی به تامین‌کنندگان',
      value: formatNumber(metrics?.payablesTotal || 0),
      subtitle: 'تومان (مانده بستانکار)',
      icon: ArrowUpRight,
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      path: '/parties/suppliers',
      accentColor: 'border-r-4 border-rose-500',
    },
    {
      id: 'cash',
      title: 'موجودی نقد و بانک',
      value: formatNumber(metrics?.cashBalance || 0),
      subtitle: 'تومان کل صندوق و بانک‌ها',
      icon: Wallet,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      path: '/treasury/accounts',
      accentColor: 'border-r-4 border-purple-500',
    },
    {
      id: 'lowStock',
      title: 'کالاهای رو به اتمام',
      value: (metrics?.lowStockCount || 0).toLocaleString('fa-IR'),
      subtitle: 'قلم کالا نیاز به سفارش',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      path: '/inventory/low-stock',
      accentColor: 'border-r-4 border-amber-500',
      isWarning: (metrics?.lowStockCount || 0) > 0,
    },
    {
      id: 'pendingChecks',
      title: 'چک‌های در شرف سررسید',
      value: (metrics?.pendingChecksCount || 0).toLocaleString('fa-IR'),
      subtitle: 'فقره چک نزد صندوق',
      icon: CreditCard,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      path: '/checks/received',
      accentColor: 'border-r-4 border-indigo-500',
    },
    {
      id: 'unreadNotifs',
      title: 'اعلان‌های خوانده‌نشده',
      value: (metrics?.unreadNotificationsCount || 0).toLocaleString('fa-IR'),
      subtitle: 'پیام خودکار سیستم',
      icon: Bell,
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      path: '#notifications',
      accentColor: 'border-r-4 border-sky-500',
    },
  ];

  return (
    <div className="space-y-4 lg:hidden">
      {/* Mobile Quick Action Buttons Bar */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => navigate('/sales/invoices')}
          className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md active:scale-98 transition-transform touch-manipulation min-h-[52px]"
        >
          <div className="p-2 rounded-xl bg-white/20">
            <FilePlus className="w-4 h-4" />
          </div>
          <span>ثبت فاکتور فروش</span>
        </button>

        <button
          onClick={() => navigate('/parties')}
          className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs shadow-xs active:scale-98 transition-transform touch-manipulation min-h-[52px]"
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <UserPlus className="w-4 h-4" />
          </div>
          <span>ثبت طرف حساب</span>
        </button>
      </div>

      {/* Metrics Touch Cards */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 px-1 uppercase tracking-wider">
          خلاصه وضعیت مالی و انبار (موبایل)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => {
                  if (card.path !== '#notifications') {
                    navigate(card.path);
                  }
                }}
                className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer touch-manipulation flex items-center justify-between ${card.accentColor}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl ${card.iconBg} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="truncate">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                      {card.title}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {loading ? '...' : card.value}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {card.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
