import React from 'react';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Sparkles, ArrowRight, Construction, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  moduleName: string;
  plannedFeatures?: string[];
}

export function PlaceholderPage({
  title,
  description,
  icon,
  moduleName,
  plannedFeatures = [
    'ثبت و ویرایش سریع اطلاعات با فرم‌های هوشمند',
    'امکان دریافت خروجی اکسل و PDF معتبر',
    'اتصال خودکار به موتور حسابداری دوبل و اسناد دفتر روزنامه',
    'پشتیبانی از جستجو و فیلتر پیشرفته',
  ],
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        badge={<Badge variant="warning">بخش در حال توسعه</Badge>}
        actions={
          <Link to="/dashboard">
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              بازگشت به داشبورد
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status Hero */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between space-y-6 border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-slate-900/80">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>فاز توسعه معماری پایه - به زودی</span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              ماژول {moduleName} آماده آماده‌سازی زیرساخت
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              این بخش در فازهای بعدی پس از اتصال زیرساخت Supabase و موتور محاسبه‌گر به صورت کامل فعال خواهد شد.
              تمامی کامپوننت‌های UI و مسیریابی این ماژول بر اساس آخرین استانداردهای PWA و چندپلتفرمی پیاده‌سازی شده‌اند.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md" icon={<Sparkles className="w-4 h-4" />}>
              پیش‌نمایش قابلیت‌ها
            </Button>
            <Button variant="outline" size="md" onClick={() => alert('درخواست دمو دریافت شد.')}>
              ثبت بازخورد یا درخواست ویژه
            </Button>
          </div>
        </Card>

        {/* Planned Features List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="w-5 h-5 text-blue-600" />
              <span>ویژگی‌های برنامه‌ریزی‌شده</span>
            </CardTitle>
            <CardDescription>نقشه راه توسعه ماژول {moduleName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {plannedFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{feat}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
