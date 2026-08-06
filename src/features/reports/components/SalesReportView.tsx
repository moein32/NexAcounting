import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { TrendingUp, ShoppingBag, BarChart3, Users, Printer, FileSpreadsheet, Percent, Coins, DollarSign } from 'lucide-react';

interface SalesReportViewProps {
  data: {
    totalSalesAmount: number;
    invoiceCount: number;
    averageInvoiceValue: number;
    totalCOGS?: number;
    grossProfit?: number;
    profitMargin?: number;
    invoicesWithProfit?: any[];
    customersBreakdown: any[];
    productsBreakdown: any[];
    categoriesBreakdown: any[];
    dailySales: any[];
  } | null;
  onPrint: () => void;
  onExportCSV: (rows: any[], title: string) => void;
}

export function SalesReportView({ data, onPrint, onExportCSV }: SalesReportViewProps) {
  if (!data) return null;

  const handleExportCSV = () => {
    const csvRows = data.productsBreakdown.map(p => ({
      'کد کالا': p.code,
      'نام کالا': p.name,
      'تعداد فروش': p.qty,
      'مبلغ فروش': p.total,
      'بهای تمام‌شده': p.cogs || 0,
      'سود ناخالص': p.profit || 0,
      'حاشیه سود': `${(p.margin || 0).toFixed(1)}%`
    }));
    onExportCSV(csvRows, 'گزارش_فروش_و_سودآوری_کالاها');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs">
          <p className="font-bold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="text-blue-600 font-bold mt-1">فروش: {formatCurrency(payload[0].value, 'تومان')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-blue-50/60 to-blue-100/30 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-100/50 dark:border-blue-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">کل درآمد ناخالص فروش</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalSalesAmount, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total COGS */}
        <Card className="bg-gradient-to-br from-amber-50/60 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-950/10 border-amber-100/50 dark:border-amber-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">کل بهای تمام‌شده کالا (COGS)</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalCOGS || 0, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-100/50 dark:border-emerald-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">سود ناخالص فروش</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.grossProfit || 0, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card className="bg-gradient-to-br from-purple-50/60 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-950/10 border-purple-100/50 dark:border-purple-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">حاشیه سود ناخالص</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {(data.profitMargin || 0).toFixed(1)}٪
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
              <Percent className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>نمودار روند روزانه فروش کالا</span>
            </CardTitle>
            <CardDescription>بررسی حجم فروش در فیلتر انتخابی</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="xs" onClick={onPrint} icon={<Printer className="w-3.5 h-3.5" />}>پرینت</Button>
            <Button variant="outline" size="xs" onClick={handleExportCSV} icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>خروجی CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            {data.dailySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" tickFormatter={(v) => formatPersianDate(v).slice(5)} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#salesTrendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                داده‌ای برای نمایش نمودار وجود ندارد.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">بیشترین سوددهی به تفکیک کالاها</CardTitle>
            <CardDescription>بر اساس مبالغ سود ناخالص به دست آمده (واقعی)</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.productsBreakdown.length > 0 ? (
                data.productsBreakdown.slice(0, 5).map((prod, index) => (
                  <div key={prod.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{prod.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">فروش: {prod.qty} {prod.unit} | درآمد: {formatCurrency(prod.total, 'تومان')}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 block">+{formatCurrency(prod.profit, 'تومان')}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">حاشیه سود: {(prod.margin || 0).toFixed(0)}٪</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">کالای فروخته شده‌ای وجود ندارد.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">بیشترین سوددهی به تفکیک مشتریان</CardTitle>
            <CardDescription>سود واقعی به دست آمده از هر مشتری در فاکتورهای تایید شده</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.customersBreakdown.length > 0 ? (
                data.customersBreakdown.slice(0, 5).map((cust, index) => (
                  <div key={cust.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 flex items-center justify-center font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-md">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{cust.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{cust.count} فاکتور | خرید: {formatCurrency(cust.total, 'تومان')}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 block">+{formatCurrency(cust.profit, 'تومان')}</span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">حاشیه سود: {(cust.margin || 0).toFixed(0)}٪</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">مشتری فعالی وجود ندارد.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Per Invoice Section */}
      {data.invoicesWithProfit && data.invoicesWithProfit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">تحلیل سود فاکتورهای فروش صادر شده</CardTitle>
            <CardDescription>بررسی بهای تمام‌شده و سود خالص فاکتورها به صورت آنلاین و لحظه‌ای</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right text-slate-500 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3">شماره فاکتور</th>
                    <th className="p-3">مشتری</th>
                    <th className="p-3">تاریخ</th>
                    <th className="p-3 text-left">مبلغ کل فروش</th>
                    <th className="p-3 text-left">بهای تمام‌شده (COGS)</th>
                    <th className="p-3 text-left">سود ناخالص</th>
                    <th className="p-3 text-center">حاشیه سود</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.invoicesWithProfit.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{inv.number}</td>
                      <td className="p-3">{inv.customerName}</td>
                      <td className="p-3">{formatPersianDate(inv.date)}</td>
                      <td className="p-3 text-left font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(inv.amount, 'تومان')}</td>
                      <td className="p-3 text-left text-amber-600 dark:text-amber-400">{formatCurrency(inv.cogs, 'تومان')}</td>
                      <td className={`p-3 text-left font-bold ${inv.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                        {formatCurrency(inv.profit, 'تومان')}
                      </td>
                      <td className="p-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${inv.margin >= 30 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : inv.margin >= 15 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}`}>
                          {inv.margin.toFixed(0)}٪
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
