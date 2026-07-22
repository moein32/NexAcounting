import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { BarChart3, TrendingUp, Scale, Receipt, ArrowLeftRight, ChevronLeft } from 'lucide-react';

export function ReportsPage() {
  const reportCategories = [
    {
      title: 'گزارش‌های مدیریتی و سود زیان',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      items: ['صورت سود و زیان (P&L)', 'تحلیل حاشیه سود ناخالص', 'گزارش سودآوری به تفکیک کالا'],
    },
    {
      title: 'گزارش‌های ترازنامه و مالی',
      icon: <Scale className="w-5 h-5 text-indigo-600" />,
      items: ['ترازنامه مالی شرکت', 'تراز آزمایشی کل و معین', 'گزارش گردش وجوه نقد'],
    },
    {
      title: 'گزارش‌های فروش و مشتریان',
      icon: <Receipt className="w-5 h-5 text-emerald-600" />,
      items: ['گزارش جامع فروش فصلی (ماده ۱۶۹)', 'صورتحساب گردش مشتریان', 'گزارش بدهکاران سن‌رسیده (Aging Report)'],
    },
    {
      title: 'گزارش‌های انبار و خزانه',
      icon: <ArrowLeftRight className="w-5 h-5 text-amber-600" />,
      items: ['کاردکس ریالی و تعدادی کالا', 'گزارش راس‌گیری چک‌ها', 'صورت مغایرت بانک'],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارش‌های جامع مالی"
        description="استخراج انواع صورت‌های مالی، صورت سود و زیان، ترازنامه و گزارش‌های مدیریتی"
        icon={<BarChart3 className="w-6 h-6" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((cat, idx) => (
          <Card key={idx} className="p-2 hover:border-blue-500/50 transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">{cat.icon}</div>
                <CardTitle>{cat.title}</CardTitle>
              </div>
              <Badge variant="primary">آماده گزارش‌گیری</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {cat.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  onClick={() => alert(`تولید گزارش ${item}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors group cursor-pointer"
                >
                  <span>{item}</span>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
