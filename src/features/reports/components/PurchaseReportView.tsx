import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { ArrowDownLeft, ShoppingCart, BarChart3, Users, Printer, FileSpreadsheet } from 'lucide-react';

interface PurchaseReportViewProps {
  data: {
    totalPurchasesAmount: number;
    invoiceCount: number;
    suppliersBreakdown: any[];
    productsBreakdown: any[];
    dailyPurchases: any[];
  } | null;
  onPrint: () => void;
  onExportCSV: (rows: any[], title: string) => void;
}

export function PurchaseReportView({ data, onPrint, onExportCSV }: PurchaseReportViewProps) {
  if (!data) return null;

  const handleExportCSV = () => {
    const csvRows = data.productsBreakdown.map(p => ({
      'کد کالا': p.code,
      'نام کالا': p.name,
      'تعداد تامین': p.qty,
      'مبلغ خرید': p.total
    }));
    onExportCSV(csvRows, 'گزارش_خرید_تامین_کالاها');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs">
          <p className="font-bold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="text-amber-600 font-bold mt-1">خرید: {formatCurrency(payload[0].value, 'تومان')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-amber-50/60 to-amber-100/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-100/50 dark:border-amber-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">کل هزینه خرید و تامین کالا</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalPurchasesAmount, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50/60 to-indigo-100/30 dark:from-indigo-950/20 dark:to-purple-950/10 border-indigo-100/50 dark:border-indigo-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">فاکتورهای خرید ثبت شده</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {data.invoiceCount} فاکتور خرید ورودی
              </p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>نمودار روزانه خرید کالا و تجهیزات</span>
            </CardTitle>
            <CardDescription>بررسی حجم مخارج خرید در فیلتر انتخابی</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="xs" onClick={onPrint} icon={<Printer className="w-3.5 h-3.5" />}>پرینت</Button>
            <Button variant="outline" size="xs" onClick={handleExportCSV} icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>خروجی CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            {data.dailyPurchases.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyPurchases} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purchasesTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" tickFormatter={(v) => formatPersianDate(v).slice(5)} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#purchasesTrendGrad)" />
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

      {/* Supplier Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">بزرگ‌ترین تامین‌کنندگان کسب‌و‌کار</CardTitle>
            <CardDescription>رتبه‌بندی بر اساس بیشترین مبلغ خرید از آن‌ها</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data.suppliersBreakdown || []).length > 0 ? (
                (data.suppliersBreakdown || []).slice(0, 5).map((supp, index) => (
                  <div key={supp.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 flex items-center justify-center font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-md">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{supp.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{supp.count} فاکتور خرید ورودی</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="font-black text-slate-900 dark:text-slate-100 block">{formatCurrency(supp.total, 'تومان')}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">میانگین خرید: {formatCurrency(supp.avg, 'تومان')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">تامین‌کننده فعالی وجود ندارد.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Procurement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">بیشترین کالاهای تامین شده</CardTitle>
            <CardDescription>بر اساس مبالغ و تیراژ خرید از زنجیره تامین</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data.productsBreakdown || []).length > 0 ? (
                (data.productsBreakdown || []).slice(0, 5).map((prod, index) => (
                  <div key={prod.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 flex items-center justify-center font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
                        {index + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{prod.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">کد کالا: {prod.code}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="font-black text-slate-900 dark:text-slate-100 block">{formatCurrency(prod.total, 'تومان')}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{prod.qty} {prod.unit}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">کالای خریداری شده‌ای وجود ندارد.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
