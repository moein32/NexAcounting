import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { TreasuryRepository, ReceiptRepository, PaymentRepository, CashAccount, TreasuryTransaction } from '../../../repositories/treasuryRepository';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Plus, 
  Landmark, 
  CreditCard,
  User,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';

export function TreasuryOverviewPage() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    cashCount: 0,
    bankCount: 0,
    todayInflow: 0,
    todayOutflow: 0,
  });

  const loadData = () => {
    if (businessId) {
      const accList = TreasuryRepository.getAccounts(businessId);
      const txList = TreasuryRepository.getTransactions(businessId);
      setAccounts(accList);
      
      // Sort transactions by date/time (newest first)
      const sortedTxs = [...txList].sort((a, b) => {
        const dateA = a.created_at || a.transaction_date;
        const dateB = b.created_at || b.transaction_date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
      setTransactions(sortedTxs);

      // Calculations
      const totalBalance = accList.reduce((sum, acc) => sum + acc.current_balance, 0);
      const cashCount = accList.filter((a) => a.account_type === 'cash').length;
      const bankCount = accList.filter((a) => a.account_type === 'bank' || a.account_type === 'card').length;

      // Filter receipts & payments for today
      const todayStr = new Date().toISOString().split('T')[0];
      const receipts = ReceiptRepository.getAll(businessId);
      const payments = PaymentRepository.getAll(businessId);

      const todayInflow = receipts
        .filter((r) => r.created_at?.startsWith(todayStr) && r.status === 'confirmed')
        .reduce((sum, r) => sum + r.amount, 0);

      const todayOutflow = payments
        .filter((p) => p.created_at?.startsWith(todayStr) && p.status === 'confirmed')
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalBalance,
        cashCount,
        bankCount,
        todayInflow,
        todayOutflow,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const getAccountIcon = (type: CashAccount['account_type']) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-5 h-5 text-amber-600" />;
      case 'bank':
        return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-indigo-600" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-600" />;
    }
  };

  const getAccountName = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    return acc ? acc.name : 'حساب ناآشنا';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="داشبورد و خزانه مرکزی"
        description="وضعیت نقدینگی، حساب‌های بانکی، رصد صندوق‌ها، چک‌های دریافتی و پرداختی"
        icon={<Wallet className="w-6 h-6 text-blue-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRightLeft className="w-4 h-4" />}
              onClick={() => navigate('/treasury/accounts')}
            >
              انتقال و حساب‌ها
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/treasury/receipts')}
            >
              ثبت دریافت جدید
            </Button>
          </div>
        }
      />

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Liquidity */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[11px] font-bold text-blue-100 flex items-center gap-1.5">
            <Wallet className="w-4 h-4" />
            <span>کل نقدینگی موجود (بانک + صندوق)</span>
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-black font-mono leading-none">
              {formatCurrency(stats.totalBalance)}
            </h2>
            <span className="text-[10px] text-blue-200 mt-1 block">تومان</span>
          </div>
        </div>

        {/* Today's Inflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-[120px]">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
            <span>مجموع دریافتی‌های امروز</span>
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-black font-mono text-emerald-600 leading-none">
              {formatCurrency(stats.todayInflow)}
            </h2>
            <span className="text-[10px] text-slate-400 mt-1 block">تومان • {stats.cashCount} صندوق فعال</span>
          </div>
        </div>

        {/* Today's Outflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between h-[120px]">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            <span>مجموع پرداختی‌های امروز</span>
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-black font-mono text-rose-600 leading-none">
              {formatCurrency(stats.todayOutflow)}
            </h2>
            <span className="text-[10px] text-slate-400 mt-1 block">تومان • {stats.bankCount} حساب جاری</span>
          </div>
        </div>
      </div>

      {/* Interactive Links Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/treasury/accounts')}
          className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-right space-y-1 shadow-xs transition-all"
        >
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 w-fit rounded-lg mb-2">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">تعریف حساب‌ها</div>
          <div className="text-[10px] text-slate-400">بانک، صندوق، کارتخوان</div>
        </button>

        <button 
          onClick={() => navigate('/treasury/receipts')}
          className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-right space-y-1 shadow-xs transition-all"
        >
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 w-fit rounded-lg mb-2">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">ثبت دریافت نقد</div>
          <div className="text-[10px] text-slate-400">ورود پول از طرف حساب</div>
        </button>

        <button 
          onClick={() => navigate('/treasury/payments')}
          className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-right space-y-1 shadow-xs transition-all"
        >
          <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 w-fit rounded-lg mb-2">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">ثبت پرداخت وجه</div>
          <div className="text-[10px] text-slate-400">خروج وجه به تأمین‌کننده</div>
        </button>

        <button 
          onClick={() => navigate('/checks')}
          className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-right space-y-1 shadow-xs transition-all"
        >
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 w-fit rounded-lg mb-2">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">مدیریت چک‌ها</div>
          <div className="text-[10px] text-slate-400">چک‌های صادر و دریافت شده</div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Status Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm lg:col-span-1">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span>موجودی صندوق و بانک‌ها</span>
            </h3>
            <button 
              onClick={() => navigate('/treasury/accounts')} 
              className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
            >
              <span>تعریف جدید</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {(accounts || []).map((acc) => (
              <div 
                key={acc.id} 
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 transition-all cursor-pointer"
                onClick={() => navigate('/treasury/accounts')}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700">
                    {getAccountIcon(acc.account_type)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{acc.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      {acc.account_type === 'cash' ? 'صندوق نقد' : acc.account_type === 'bank' ? 'بانک جاری' : 'کارتخوان'}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-black text-xs text-slate-700 dark:text-slate-200">
                  {formatCurrency(acc.current_balance)} تومان
                </span>
              </div>
            ))}

            {(accounts || []).length === 0 && (
              <div className="text-center p-8 text-slate-400 text-xs">حسابی پیدا نشد.</div>
            )}
          </div>
        </div>

        {/* Recent Ledger Transactions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>آخرین تراکنش‌ها و گردش وجوه</span>
            </h3>
            <Badge variant="success">کاردکس زنده</Badge>
          </div>

          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {transactions.slice(0, 8).map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-50 dark:border-slate-800/40 hover:border-slate-100 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    tx.transaction_type === 'IN' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : tx.transaction_type === 'OUT' 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {tx.transaction_type === 'IN' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.transaction_type === 'OUT' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 block">{tx.description}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      حساب: <strong className="text-slate-600">{getAccountName(tx.account_id)}</strong> • تاریخ: {formatPersianDate(tx.transaction_date).split(' ')[0]}
                    </span>
                  </div>
                </div>

                <span className={`font-mono font-black text-xs ${
                  tx.transaction_type === 'IN' 
                    ? 'text-emerald-600' 
                    : tx.transaction_type === 'OUT' 
                    ? 'text-rose-600' 
                    : 'text-indigo-600'
                }`}>
                  {tx.transaction_type === 'IN' ? '+' : tx.transaction_type === 'OUT' ? '-' : '⇌'} {formatCurrency(tx.amount)} تومان
                </span>
              </div>
            ))}

            {(transactions || []).length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto text-slate-200 mb-2" />
                <p className="text-xs">تاکنون هیچ گردش مالی در کاردکس ثبت نشده است.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
