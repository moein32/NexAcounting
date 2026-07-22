import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MOCK_INCOME_EXPENSE_DATA } from '../../../services/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { formatCurrency } from '../../../lib/utils';
import { Scale } from 'lucide-react';

export function IncomeExpenseChart() {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-slate-100">{label}</p>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <span>ورودی نقد:</span>
            <span className="font-bold">{formatCurrency(payload[0].value, 'تومان')}</span>
          </div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <span>خروجی نقد:</span>
            <span className="font-bold">{formatCurrency(payload[1].value, 'تومان')}</span>
          </div>
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
            <Scale className="w-5 h-5 text-emerald-600" />
            <span>ورودی و خروجی جریان نقدینگی هفته</span>
          </CardTitle>
          <CardDescription>بررسی جریان وجوه نقد دریافت‌ها و پرداخت‌های روزانه</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_INCOME_EXPENSE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={14} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
