import React from 'react';
import { MOCK_RECENT_TRANSACTIONS } from '../../../services/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { History, ArrowUpRight, ArrowDownLeft, Receipt, CreditCard } from 'lucide-react';

interface RecentTransactionsProps {
  transactions?: {
    id: string;
    code: string;
    title: string;
    partyName: string;
    amount: number;
    type: 'sale' | 'receipt' | 'purchase' | 'payment';
    date: string;
    status: string;
  }[];
}

export const RecentTransactions = React.memo(function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const typeIcons = {
    sale: <ArrowUpRight className="w-4 h-4 text-emerald-600" />,
    receipt: <Receipt className="w-4 h-4 text-blue-600" />,
    purchase: <ArrowDownLeft className="w-4 h-4 text-amber-600" />,
    payment: <CreditCard className="w-4 h-4 text-rose-600" />,
  };

  const typeBadges = {
    sale: <Badge variant="success">فروش</Badge>,
    receipt: <Badge variant="primary">دریافت</Badge>,
    purchase: <Badge variant="warning">خرید</Badge>,
    payment: <Badge variant="danger">پرداخت</Badge>,
  };

  const list = transactions && (transactions || []).length > 0 ? transactions : MOCK_RECENT_TRANSACTIONS;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>آخرین تراکنش‌های مالی ثبت‌شده</span>
          </CardTitle>
          <CardDescription>فاکتورها، دریافت‌ها و پرداخت‌های اخیر سیستم</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {(list || []).map((tx) => (
            <div key={tx.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3 truncate">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                  {typeIcons[tx.type]}
                </div>
                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{tx.title}</span>
                    {typeBadges[tx.type]}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{tx.partyName}</span>
                    <span>•</span>
                    <span>{tx.code}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(tx.amount, 'تومان')}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">{formatPersianDate(tx.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
