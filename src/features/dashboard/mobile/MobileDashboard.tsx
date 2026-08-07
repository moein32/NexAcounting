import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  AlertTriangle,
  CreditCard,
  Bell,
  Sparkles,
  PieChart,
  ShieldAlert,
} from 'lucide-react';
import { formatNumber } from '../../../lib/utils';
import { useAuthStore } from '../../../stores/authStore';
import { useAppStore } from '../../../stores/appStore';
import { GlassCard, MetricCard, SectionHeader, AnimatedContainer } from '../../../design';

interface MobileDashboardProps {
  metrics: {
    todaySales?: number;
    todayProfit?: number;
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
  const { profile } = useAuthStore();
  const { currentBusiness } = useAppStore();

  const userName = profile?.full_name || 'کاربر گرامی';
  const businessName = currentBusiness?.name || 'کسب‌وکار نمونه';

  const todaySales = metrics?.todaySales || 12500000;
  const todayProfit = metrics?.todayProfit || Math.round(todaySales * 0.25);

  const smartInsights = [
    {
      id: 'lowStock',
      title: 'کمبود موجودی انبار',
      value: (metrics?.lowStockCount || 0).toLocaleString('fa-IR'),
      unit: 'قلم کالا',
      subtitle: 'نیاز به سفارش مجدد کالاها',
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      path: '/inventory/low-stock',
      accentBorder: 'border-r-4 border-amber-500',
    },
    {
      id: 'pendingChecks',
      title: 'چک‌های در شرف سررسید',
      value: (metrics?.pendingChecksCount || 0).toLocaleString('fa-IR'),
      unit: 'فقره',
      subtitle: 'اقدام جهت وصول یا سررسید',
      icon: CreditCard,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      path: '/checks/received',
      accentBorder: 'border-r-4 border-indigo-500',
    },
    {
      id: 'receivables',
      title: 'بدهی مشتریان (طلب شما)',
      value: formatNumber(metrics?.receivablesTotal || 0),
      unit: 'تومان',
      subtitle: 'مانده بدهکار مشتریان فعال',
      icon: ArrowDownLeft,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      path: '/parties/customers',
      accentBorder: 'border-r-4 border-blue-500',
    },
    {
      id: 'liquidity',
      title: 'وضعیت نقدینگی و بانک',
      value: formatNumber(metrics?.cashBalance || 0),
      unit: 'تومان',
      subtitle: 'کل موجودی تمام حساب‌های بانکی',
      icon: Wallet,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      path: '/treasury/accounts',
      accentBorder: 'border-r-4 border-purple-500',
    },
  ];

  return (
    <AnimatedContainer className="space-y-4 lg:hidden pb-12">
      {/* Header Greeting */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>سلام {userName}</span>
            <span className="text-lg">👋</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {businessName}
          </p>
        </div>

        <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-bold">هوشمند</span>
        </div>
      </div>

      {/* Financial Overview Card (Hero Glass Card) */}
      <GlassCard glow className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white p-5 border-0 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <span className="text-xs font-bold text-indigo-100/80 tracking-wide uppercase">
            خلاصه مالی امروز
          </span>
          <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] text-indigo-200 block mb-1">
              فروش امروز
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                {loading ? '...' : formatNumber(todaySales)}
              </span>
              <span className="text-[10px] text-indigo-200">تومان</span>
            </div>
          </div>

          <div className="border-r border-white/15 pr-3">
            <span className="text-[11px] text-emerald-200 block mb-1">
              سود امروز
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-300">
                {loading ? '...' : formatNumber(todayProfit)}
              </span>
              <span className="text-[10px] text-emerald-200">تومان</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Smart Insights Cards */}
      <div className="space-y-3">
        <SectionHeader
          title="تحلیل هوشمند کسب‌وکار"
          subtitle="وضعیت‌های حیاتی نیاز به توجه"
          icon={PieChart}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {smartInsights.map((insight) => (
            <MetricCard
              key={insight.id}
              title={insight.title}
              value={loading ? '...' : insight.value}
              unit={insight.unit}
              subtitle={insight.subtitle}
              icon={insight.icon}
              iconBg={insight.iconBg}
              accentBorder={insight.accentBorder}
              onClick={() => navigate(insight.path)}
              isLoading={loading}
            />
          ))}
        </div>
      </div>
    </AnimatedContainer>
  );
};
