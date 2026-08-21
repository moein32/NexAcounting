import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../../lib/utils';
import { Package, Percent, Warehouse, Flame, Clock, HeartCrack } from 'lucide-react';

interface InventoryAnalyticsViewProps {
  data: {
    items: any[];
    totalInventoryCost: number;
    totalInventorySale: number;
  } | null;
}

export function InventoryAnalyticsView({ data }: InventoryAnalyticsViewProps) {
  if (!data) return null;

  const profitProjection = data.totalInventorySale - data.totalInventoryCost;

  // Group items by turnover speed for Recharts chart
  const speedStats = React.useMemo(() => {
    const fastCount = data.items.filter(i => i.turnoverSpeed === 'fast').length;
    const normalCount = data.items.filter(i => i.turnoverSpeed === 'normal').length;
    const slowCount = data.items.filter(i => i.turnoverSpeed === 'slow').length;
    const deadCount = data.items.filter(i => i.turnoverSpeed === 'dead').length;

    return [
      { name: 'پرفروش (داغ)', count: fastCount, fill: '#ef4444' },
      { name: 'معمولی', count: normalCount, fill: '#3b82f6' },
      { name: 'کم‌فروش', count: slowCount, fill: '#f59e0b' },
      { name: 'بدون حرکت (راکد)', count: deadCount, fill: '#64748b' }
    ];
  }, [data.items]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && (payload || []).length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs">
          <p className="font-bold text-slate-900 dark:text-slate-100">{payload[0].name}</p>
          <p className="text-blue-600 font-bold mt-1">تعداد اقلام: {payload[0].value} کالا</p>
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
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">بهای تمام‌شده انبار (خرید)</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalInventoryCost, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/20 dark:to-teal-950/10 border-emerald-100/50 dark:border-emerald-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">ارزش فروش کل انبار</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(data.totalInventorySale, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50/60 to-indigo-100/30 dark:from-indigo-950/20 dark:to-purple-950/10 border-indigo-100/50 dark:border-indigo-900/30">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">پیش‌بینی سود ناخالص موجودی</span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(profitProjection, 'تومان')}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Percent className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Speed chart */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold">بخش‌بندی سرعت گردش کالا</CardTitle>
              <CardDescription>بررسی نرخ فروش اقلام انبار در ۳۰ روز گذشته</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speedStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status List */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-rose-50/40 dark:bg-rose-950/10 rounded-xl">
                  <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    <span>داغ و پرفروش (فروش بالای ۳۰ عدد)</span>
                  </span>
                  <span className="font-black">{speedStats[0].count} قلم</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl">
                  <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>کند و کم‌فروش (فروش زیر ۵ عدد)</span>
                  </span>
                  <span className="font-black">{speedStats[2].count} قلم</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <HeartCrack className="w-4 h-4" />
                    <span>راکد و بدون معامله</span>
                  </span>
                  <span className="font-black">{speedStats[3].count} قلم</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Valuation inventory items table */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm font-bold">بهای تمام‌شده و ارزش بازار تفکیکی کالاها</CardTitle>
              <CardDescription>محاسبه ارزش موجودی واقعی هر کالا</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3.5">کالا (کد و عنوان)</th>
                      <th className="p-3.5">دسته‌بندی</th>
                      <th className="p-3.5">موجودی فعلی</th>
                      <th className="p-3.5">کل بهای خرید (Cost)</th>
                      <th className="p-3.5">ارزش کل بازار (Market)</th>
                      <th className="p-3.5">گردش کالا</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {(data.items || []).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex flex-col gap-0.5">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">کد: {item.code}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">{item.category}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {item.qty} {item.unit}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.costValue, 'تومان')}
                        </td>
                        <td className="p-3.5 font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(item.saleValue, 'تومان')}
                        </td>
                        <td className="p-3.5">
                          {item.turnoverSpeed === 'fast' ? (
                            <Badge variant="danger">پرفروش (داغ)</Badge>
                          ) : item.turnoverSpeed === 'slow' ? (
                            <Badge variant="warning">کم‌حرکت</Badge>
                          ) : item.turnoverSpeed === 'dead' ? (
                            <Badge variant="neutral">راکد</Badge>
                          ) : (
                            <Badge variant="primary">معمولی</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
