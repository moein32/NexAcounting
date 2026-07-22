import React, { useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAppStore } from '../../../stores/appStore';
import { useUIStore } from '../../../stores/uiStore';
import { Settings, Building2, User, Moon, Sun, Monitor, Smartphone, Save, ShieldCheck } from 'lucide-react';

export function SettingsPage() {
  const { currentBusiness, currentUser, setCurrentBusiness, updateCurrentUser } = useAppStore();
  const { theme, setTheme } = useUIStore();

  const [bizName, setBizName] = useState(currentBusiness.name);
  const [bizTaxId, setBizTaxId] = useState(currentBusiness.taxId || '');
  const [userName, setUserName] = useState(currentUser.name);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setCurrentBusiness({ ...currentBusiness, name: bizName, taxId: bizTaxId });
    updateCurrentUser({ name: userName });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنظیمات سیستم"
        description="مدیریت مشخصات کسب‌وکار، پروفایل کاربر، پوسته ظاهری و تنظیمات PWA"
        icon={<Settings className="w-6 h-6" />}
        actions={
          <Button variant="primary" size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSave}>
            ذخیره تغییرات
          </Button>
        }
      />

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>تنظیمات با موفقیت ذخیره شد.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>مشخصات کسب‌وکار فعال</span>
            </CardTitle>
            <CardDescription>اطلاعات حقوقی و مالی شرکت برای درج روی فاکتورها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="نام شرکت / مجموعه" value={bizName} onChange={(e) => setBizName(e.target.value)} />
            <Input label="شناسه ملی / کد اقتصادی" value={bizTaxId} onChange={(e) => setBizTaxId(e.target.value)} placeholder="۱۰۳۲۰۰..." />
            <Select
              label="واحد پول پایه سیستم"
              value={currentBusiness.currency}
              options={[
                { value: 'تومان', label: 'تومان' },
                { value: 'ریال', label: 'ریال' },
              ]}
              onChange={(e) => setCurrentBusiness({ ...currentBusiness, currency: e.target.value as any })}
            />
            <Input label="سال مالی فعال" value={currentBusiness.fiscalYear} disabled helperText="سال مالی جاری در سیستم" />
          </CardContent>
        </Card>

        {/* User Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <span>پروفایل کاربری شما</span>
            </CardTitle>
            <CardDescription>مشخصات مدیر سیستم و دسترسی‌ها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="نام و نام خانوادگی" value={userName} onChange={(e) => setUserName(e.target.value)} />
            <Input label="پست الکترونیک (ایمیل)" value={currentUser.email} disabled />
            <Input label="نقش کاربری" value={currentUser.role} disabled />
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>پوسته و تم ظاهری</span>
            </CardTitle>
            <CardDescription>انتخاب حالت روشن، تاریک یا هماهنگ با سیستم‌عامل</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>روشن</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span>تاریک</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span>سیستم</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* PWA & Mobile Ready Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>وضعیت برنامه PWA و آماده‌سازی موبایل</span>
            </CardTitle>
            <CardDescription>معماری توسعه چندپلتفرمی (Web / Capacitor / Android / iOS)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
              <span>برنامه وب پیشرونده (PWA)</span>
              <Badge variant="success">فعال (Manifest / Standalone)</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
              <span>آماده‌سازی Capacitor برای Android / iOS</span>
              <Badge variant="primary">آماده بدون بازنویسی logic</Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              تمام لایه منطق مالی، Zustand stores، و مسیرها بر اساس استانداردهای مستقل از پلتفرم پیاده‌سازی شده‌اند.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
