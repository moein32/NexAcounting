import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { AccountingRepository, AccountRepository } from '../../../repositories/accountingRepository';
import { formatCurrency } from '../../../lib/utils';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShieldCheck, 
  Calendar,
  Layers,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AccountingOverviewPage() {
  const { currentBusiness } = useAppStore();
  const navigate = useNavigate();
  const businessId = currentBusiness?.id || 'biz_1';

  const [metrics, setMetrics] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    receivables: 0,
    payables: 0,
  });

  const [period, setPeriod] = useState<any>(null);

  useEffect(() => {
    // 1. Initialize Default Accounts & Periods if not yet created
    AccountRepository.getAccounts(businessId);
    const periods = AccountingRepository.getPeriods(businessId);
    if ((periods || []).length > 0) {
      setPeriod(periods[0]);
    }

    // 2. Fetch Trial Balance to compute real-time accounting metrics
    const trialBalance = AccountingRepository.getTrialBalance(businessId);
    
    // Revenue is credit-normal
    const rev = trialBalance
      .filter(a => a.account_type === 'revenue')
      .reduce((sum, a) => sum + (a.creditBalance - a.debitBalance), 0);

    // Expense is debit-normal
    const exp = trialBalance
      .filter(a => a.account_type === 'expense')
      .reduce((sum, a) => sum + (a.debitBalance - a.creditBalance), 0);

    // Accounts Receivable (1020) is debit-normal
    const rec = trialBalance
      .filter(a => a.code === '1020')
      .reduce((sum, a) => sum + (a.debitBalance - a.creditBalance), 0);

    // Accounts Payable (2010) is credit-normal
    const pay = trialBalance
      .filter(a => a.code === '2010')
      .reduce((sum, a) => sum + (a.creditBalance - a.debitBalance), 0);

    setMetrics({
      revenue: Math.max(0, rev),
      expenses: Math.max(0, exp),
      profit: rev - exp,
      receivables: Math.max(0, rec),
      payables: Math.max(0, pay),
    });
  }, [businessId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="داشبورد هسته مالی و حسابداری"
        description="وضعیت تراز سود و زیان، دارایی‌ها، بدهی‌ها و دوره مالی بر مبنای دفتر معین کالا و خزانه"
        icon={<Calculator className="w-6 h-6 text-indigo-600" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/accounting/journal?action=new')}
          >
            ثبت سند حسابداری دستی
          </Button>
        }
      />

      {/* Financial Period Card */}
      {period && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {period.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                بازه زمانی: {period.start_date} الی {period.end_date}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={period.status === 'open' ? 'success' : 'neutral'}>
              {period.status === 'open' ? 'دوره مالی باز است' : 'بسته شده'}
            </Badge>
            <Badge variant="primary" size="sm">
              سیستم حسابداری دوبل فعال
            </Badge>
          </div>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Total Revenue */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">مجموع درآمد دوره</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {formatCurrency(metrics.revenue, 'تومان')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">فروش‌های نقدی و نسیه تایید شده</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">مجموع هزینه‌های دوره</span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {formatCurrency(metrics.expenses, 'تومان')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">خریدها و پرداخت‌های ثبت شده جاری</p>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">سود تقریبی خالص</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className={`text-2xl font-black ${metrics.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatCurrency(metrics.profit, 'تومان')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">برآورد ناخالص پس از کسر هزینه‌ها</p>
            </div>
          </CardContent>
        </Card>

        {/* Receivables (Customer Debts) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">طلب از مشتریان (دریافتنی)</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {formatCurrency(metrics.receivables, 'تومان')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">تعهدات مشتریان فاکتورهای نسیه فروش</p>
            </div>
          </CardContent>
        </Card>

        {/* Payables (Supplier Debts) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">بدهی به تامین‌کنندگان (پرداختنی)</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {formatCurrency(metrics.payables, 'تومان')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">تعهدات پرداخت فاکتورهای خرید نسیه کالا</p>
            </div>
          </CardContent>
        </Card>

        {/* Offline Protection Indicator */}
        <Card className="hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">حفاظت آفلاین سیستم</span>
              <div className="p-2 bg-sky-50 dark:bg-sky-950/40 text-sky-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">موتور ذخیره‌سازی محلی SQLite</h4>
              <p className="text-xs text-slate-400 mt-1">تمامی اطلاعات مالی درون حافظه .nxb شما محفوظ است.</p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Quick Navigation Cards */}
      <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">
          دسترسی سریع به ماژول‌های حسابداری دوبل
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div 
            onClick={() => navigate('/accounting/chart')}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm transition-all group"
          >
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600">کدینگ و درخت حساب‌ها</h4>
              <p className="text-xs text-slate-400 mt-1">مدیریت حساب‌های دارایی، بدهی، سرمایه و هزینه‌ها</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>

          <div 
            onClick={() => navigate('/accounting/journal')}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm transition-all group"
          >
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600">دفتر روزنامه اسناد</h4>
              <p className="text-xs text-slate-400 mt-1">مشاهده رویدادهای مالی اتوماتیک و ثبت دستی اسناد</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>

          <div 
            onClick={() => navigate('/accounting/ledger')}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-sm transition-all group"
          >
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600">دفتر معین و تراز آزمایشی</h4>
              <p className="text-xs text-slate-400 mt-1">ترازهای ۴ ستونی، کارت گردش حساب‌ها و دفاتر کل مالی</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>

        </div>
      </div>

    </div>
  );
}
