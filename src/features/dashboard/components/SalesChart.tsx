import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MOCK_SALES_CHART_DATA } from '../../../services/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { formatCurrency } from '../../../lib/utils';
import { TrendingUp } from 'lucide-react';

interface SalesChartProps {
  data?: {
    month: string;
    revenue: number;
    expense: number;
    profit: number;
  }[];
}

export const SalesChart = React.memo(function SalesChart({ data }: SalesChartProps) {
  const chartData = data && data.length > 0 
    ? data.map(d => ({
        name: d.month,
        sales: d.revenue,
        purchases: d.expense,
        profit: d.profit
      }))
    : MOCK_SALES_CHART_DATA;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-slate-100">{label}</p>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <span>فروش:</span>
            <span className="font-bold">{formatCurrency(payload[0].value, 'تومان')}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span>خرید:</span>
            <span className="font-bold">{formatCurrency(payload[1].value, 'تومان')}</span>
          </div>
          {payload[2] && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5">
              <span>سود ناخالص:</span>
              <span className="font-bold">{formatCurrency(payload[2].value, 'تومان')}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>روند فروش و خرید ۶ ماه گذشته</span>
          </CardTitle>
          <CardDescription>مقایسه عملکرد فروش و تأمین کالا (مبالغ به تومان)</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="purchases" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#purchasesGrad)" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
