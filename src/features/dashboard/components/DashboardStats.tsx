import React from 'react';
import { MOCK_DASHBOARD_STATS } from '../../../services/mockData';
import { StatCard } from '../../../components/ui/StatCard';

interface DashboardStatsProps {
  metrics?: {
    salesToday: number;
    purchasesToday: number;
    totalCashBankBalance: number;
    accountsReceivable: number;
    accountsPayable: number;
    totalInventoryValueCost: number;
    lowStockItems: any[];
  };
}

export function DashboardStats({ metrics }: DashboardStatsProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_DASHBOARD_STATS.slice(0, 4).map((stat) => (
          <StatCard key={stat.id} data={stat} />
        ))}
      </div>
    );
  }

  const primaryStats = [
    {
      id: 'stat_sales_today',
      title: 'فروش امروز',
      value: metrics.salesToday,
      unit: 'تومان',
      type: 'success' as const,
      icon: 'TrendingUp',
    },
    {
      id: 'stat_purchases_today',
      title: 'خرید امروز',
      value: metrics.purchasesToday,
      unit: 'تومان',
      type: 'danger' as const,
      icon: 'HandCoins',
    },
    {
      id: 'stat_cash_bank',
      title: 'موجودی نقد و بانک',
      value: metrics.totalCashBankBalance,
      unit: 'تومان',
      type: 'primary' as const,
      icon: 'Wallet',
    },
    {
      id: 'stat_inventory_value',
      title: 'ارزش کل موجودی انبار (بهای تمام‌شده)',
      value: metrics.totalInventoryValueCost,
      unit: 'تومان',
      type: 'info' as const,
      icon: 'Landmark',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {primaryStats.map((stat) => (
        <StatCard key={stat.id} data={stat} />
      ))}
    </div>
  );
}

export function SecondaryDashboardStats({ metrics }: DashboardStatsProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MOCK_DASHBOARD_STATS.slice(4).map((stat) => (
          <StatCard key={stat.id} data={stat} />
        ))}
      </div>
    );
  }

  const secondaryStats = [
    {
      id: 'stat_receivables',
      title: 'مطالبات (طلب از مشتریان)',
      value: metrics.accountsReceivable,
      unit: 'تومان',
      type: 'warning' as const,
      icon: 'Users',
    },
    {
      id: 'stat_payables',
      title: 'بدهی‌ها (به تامین‌کنندگان)',
      value: metrics.accountsPayable,
      unit: 'تومان',
      type: 'danger' as const,
      icon: 'HandCoins',
    },
    {
      id: 'stat_low_stock_count',
      title: 'کالاهای رو به اتمام (نیاز به خرید)',
      value: metrics.lowStockItems.length,
      unit: 'قلم کالا' as any,
      type: 'warning' as const,
      icon: 'BadgePercent',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {secondaryStats.map((stat) => (
        <StatCard key={stat.id} data={stat} />
      ))}
    </div>
  );
}
