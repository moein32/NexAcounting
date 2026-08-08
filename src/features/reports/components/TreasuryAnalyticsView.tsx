import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { Landmark, LandmarkIcon, CheckSquare, Calendar, ChevronLeft, CreditCard } from 'lucide-react';

interface TreasuryAnalyticsViewProps {
  data: {
    cashAccounts: any[];
    totalBalance: number;
    dailyFlow: any[];
    pendingChecksReceived: any[];
    pendingChecksIssued: any[];
    totalChecksReceivedAmount: number;
    totalChecksIssuedAmount: number;
  } | null;
}

export function TreasuryAnalyticsView({ data }: TreasuryAnalyticsViewProps) {
  if (!data) return null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="text-emerald-600 font-bold">ورودی نقد: {formatCurrency(payload[0].value, 'تومان')}</p>
          <p className="text-rose-600 font-bold">خروجی نقد: {formatCurrency(payload[1].value, 'تومان')}</p>
          {payload[2] && (
            <p className="text-slate-600 dark:text-slate-300 font-bold border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
              خالص جریان نقد: {formatCurrency(payload[2].value, 'تومان')}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50/60 to-blue-100/30 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-100/50 dark:border-blue-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">کل وجوه نقد در صندوق و بانک‌ها</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalBalance, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-100/50 dark:border-emerald-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">چک‌های دریافتی درجریان وصول</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalChecksReceivedAmount, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50/60 to-rose-100/30 dark:from-rose-950/20 dark:to-pink-950/10 border-rose-100/50 dark:border-rose-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">تعهد چک‌های عهده صادره</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalChecksIssuedAmount, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Accounts List & Daily flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Accounts detailed balance */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">حساب‌های خزانه و موجودی واقعی</CardTitle>
              <CardDescription>جزئیات مانده نقدی صندوق و بانک‌ها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {(data.cashAccounts || []).map((acc) => (
                <div key={acc.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>{acc.name}</span>
                    </span>
                    <Badge variant={acc.account_type === 'bank' ? 'primary' : 'success'}>
                      {acc.account_type === 'bank' ? 'بانک' : 'صندوق'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-slate-400 text-[10px]">شماره حساب: {acc.account_number || 'بدون شماره'}</span>
                    <span className="font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(acc.current_balance, 'تومان')}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Daily cash flow chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold">جریان نقدینگی هفته اخیر (روزانه)</CardTitle>
              <CardDescription>بررسی ورود و خروج مستقیم نقدینگی صندوق‌ها</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                {(data.dailyFlow || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailyFlow || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="date" tickFormatter={(v) => formatPersianDate(v).slice(5)} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} name="ورودی" />
                      <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={14} name="خروجی" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    داده‌ای برای نمایش نمودار وجود ندارد.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checks Ledger Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Checks Received */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-emerald-600">
              <LandmarkIcon className="w-4 h-4" />
              <span>چک‌های دریافتی در انتظار وصول</span>
            </CardTitle>
            <CardDescription>اسناد تجاری دریافت شده نیازمند واگذاری به بانک</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data.pendingChecksReceived || []).length > 0 ? (
                (data.pendingChecksReceived || []).map((check) => (
                  <div key={check.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">چک شماره {check.check_number}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">صادرکننده: {check.party_name} • بانک: {check.bank_name || 'نامشخص'}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-black text-slate-900 dark:text-slate-100 block">{formatCurrency(check.amount, 'تومان')}</span>
                      <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">سررسید: {formatPersianDate(check.due_date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">چک دریافتی معلقی وجود ندارد.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Checks Issued */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-rose-600">
              <Calendar className="w-4 h-4" />
              <span>چک‌های صادره در انتظار پرداخت</span>
            </CardTitle>
            <CardDescription>تعهدهای صادره عهده بانک‌های کسب‌و‌کار</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data.pendingChecksIssued || []).length > 0 ? (
                (data.pendingChecksIssued || []).map((check) => (
                  <div key={check.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">چک شماره {check.check_number}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">گیرنده: {check.party_name} • از حساب: {check.bank_name || 'نامشخص'}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-black text-slate-900 dark:text-slate-100 block">{formatCurrency(check.amount, 'تومان')}</span>
                      <span className="text-[10px] text-rose-600 font-bold block mt-0.5">سررسید: {formatPersianDate(check.due_date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">چک صادره معلقی وجود ندارد.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
