import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DashboardStats, SecondaryDashboardStats } from '../components/DashboardStats';
import { SalesChart } from '../components/SalesChart';
import { IncomeExpenseChart } from '../components/IncomeExpenseChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { SystemAlerts } from '../components/SystemAlerts';
import { QuickActions } from '../components/QuickActions';
import { LayoutDashboard, Download, RefreshCw, Building2, UserCheck, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../stores/authStore';
import { Badge } from '../../../components/ui/Badge';

export function DashboardPage() {
  const { currentBusiness, profile, user, currentRole, isDemoMode } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Dynamic Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 md:p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full text-blue-100 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>خوش آمدید، {profile?.full_name || user?.email || 'کاربر گرامی'}</span>
              </span>
              {isDemoMode && (
                <span className="text-[11px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>حالت دمو</span>
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-200 shrink-0" />
              <span>{currentBusiness?.name || 'کسب‌وکار فعال'}</span>
            </h1>

            <p className="text-xs text-blue-100/80">
              نقش دسترسی: <strong className="text-white font-bold">{currentRole?.name || 'مالک کسب‌وکار'}</strong> • واحد پول: <strong className="text-white font-bold">{currentBusiness?.currency || 'تومان'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              به‌روزرسانی
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              className="bg-white text-blue-700 hover:bg-blue-50 border-0 font-bold"
            >
              گزارش سریع
            </Button>
          </div>
        </div>
      </div>

      {/* Main Stat Cards */}
      <DashboardStats />

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <IncomeExpenseChart />
      </div>

      {/* Secondary Stats */}
      <SecondaryDashboardStats />

      {/* Transactions & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
        <div className="lg:col-span-1">
          <SystemAlerts />
        </div>
      </div>
    </div>
  );
}

