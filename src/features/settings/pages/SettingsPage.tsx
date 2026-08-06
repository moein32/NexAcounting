import React, { useState, useRef } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAppStore } from '../../../stores/appStore';
import { useUIStore } from '../../../stores/uiStore';
import {
  Settings,
  Building2,
  User,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Save,
  ShieldCheck,
  Download,
  Upload,
  Database,
  Lock,
  RefreshCw,
  AlertCircle,
  Boxes,
  Printer,
} from 'lucide-react';
import { BackupRepository } from '../../../repositories';
import { inventoryService } from '../../../services/inventoryService';
import { CostEngine } from '../../../services/costEngine';
import { printService } from '../../../services/printService';
import { PrintSettings, PageSize, InvoiceTemplateId } from '../../../types/print';

export function SettingsPage() {
  const { currentBusiness, currentUser, setCurrentBusiness, updateCurrentUser } = useAppStore();
  const { theme, setTheme } = useUIStore();

  const [bizName, setBizName] = useState(currentBusiness.name);
  const [bizTaxId, setBizTaxId] = useState(currentBusiness.taxId || '');
  const [userName, setUserName] = useState(currentUser.name);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Inventory & Costing Policy States
  const [negativePolicy, setNegativePolicy] = useState<'block' | 'warn' | 'allow'>(
    inventoryService.getNegativeStockPolicy(currentBusiness.id)
  );
  const [costingMethod, setCostingMethod] = useState<'fifo' | 'weighted_average'>(
    CostEngine.getCostMethod(currentBusiness.id)
  );
  const isCostLocked = CostEngine.isCostMethodLocked(currentBusiness.id);

  // Print Settings State
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() =>
    printService.getPrintSettings(currentBusiness.id)
  );

  // Backup States
  const [backupPassword, setBackupPassword] = useState('nexaccounting-secure-pass');
  const [restorePassword, setRestorePassword] = useState('nexaccounting-secure-pass');
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setCurrentBusiness({ ...currentBusiness, name: bizName, taxId: bizTaxId });
    updateCurrentUser({ name: userName });

    inventoryService.setNegativeStockPolicy(currentBusiness.id, negativePolicy);
    if (!isCostLocked) {
      CostEngine.setCostMethod(currentBusiness.id, costingMethod);
    }

    printService.savePrintSettings(currentBusiness.id, printSettings);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Securely export and download local SQLite database as an AES-encrypted .nxb file
  const handleExportBackup = () => {
    setBackupStatus(null);
    try {
      const encryptedData = BackupRepository.exportBackup();
      
      const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      
      link.href = url;
      link.download = `nexaccounting_backup_${dateStr}.nxb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setBackupStatus({
        type: 'success',
        message: 'نسخه پشتیبان با موفقیت ایجاد و فایل رمزگذاری شده (.nxb) دانلود شد.',
      });
    } catch (e: any) {
      setBackupStatus({
        type: 'error',
        message: e.message || 'خطا در ایجاد فایل پشتیبان.',
      });
    }
  };

  // Upload and decrypt a .nxb file, verifying checksum, and restoring local SQLite database
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        if (!fileContent) throw new Error('فایل پشتیبان خالی است.');

        const success = BackupRepository.importBackup(fileContent);
        if (success) {
          setBackupStatus({
            type: 'success',
            message: 'دیتابیس با موفقیت بازیابی شد. لطفاً چند لحظه صبر کنید تا برنامه مجدداً بارگذاری شود...',
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setBackupStatus({
            type: 'error',
            message: 'کلمه عبور اشتباه است یا ساختار فایل پشتیبان معتبر نیست.',
          });
        }
      } catch (err: any) {
        setBackupStatus({
          type: 'error',
          message: err.message || 'خطا در خواندن فایل پشتیبان.',
        });
      }
    };
    reader.readAsText(file);
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

      {backupStatus && (
        <div
          className={`p-3 border rounded-xl text-xs font-bold flex items-center gap-2 ${
            backupStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          {backupStatus.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{backupStatus.message}</span>
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

        {/* Inventory & Costing Policy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-emerald-600" />
              <span>تنظیمات انبار، ارزش‌گذاری و موجودی منفی</span>
            </CardTitle>
            <CardDescription>تعیین روش ارزیابی کالا و سیاست کنترلی موجودی منفی</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>روش ارزش‌گذاری موجودی انبار</span>
                {isCostLocked && (
                  <Badge variant="warning" className="text-[10px]">
                    قفل شده (اسناد صادر شده)
                  </Badge>
                )}
              </label>
              <Select
                value={costingMethod}
                disabled={isCostLocked}
                options={[
                  { value: 'weighted_average', label: 'میانگین موزون (Weighted Average)' },
                  { value: 'fifo', label: 'اولین صادره از اولین وارده (FIFO)' },
                ]}
                onChange={(e) => setCostingMethod(e.target.value as any)}
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {isCostLocked
                  ? 'به دلیل ثبت اسناد مالی و مصرف Layer در این سال مالی، روش ارزش‌گذاری قفل شده است تا سود و COGS دگرگون نشود.'
                  : 'روش ارزش‌گذاری جهت محاسبه بهای تمام‌شده و Layerهای انبار.'}
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                سیاست خروج کالا و فروش با موجودی منفی
              </label>
              <Select
                value={negativePolicy}
                options={[
                  { value: 'block', label: '۱. کاملاً جلوگیری کن و مانع صدور فاکتور شو (پیش‌فرض امن)' },
                  { value: 'warn', label: '۲. فقط هشدار بده ولی اجازه صدور فاکتور بده' },
                  { value: 'allow', label: '۳. اجازه فروش با موجودی منفی (تأیید خودکار Deficit Layer)' },
                ]}
                onChange={(e) => setNegativePolicy(e.target.value as any)}
              />
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                در حالت اجازه فروش، سیستم Layer منفی (Deficit) با قیمت مبنا ایجاد کرده و با اولین فاکتور خرید بعدی به صورت خودکار تسویه می‌شود.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Print Engine & Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <span>تنظیمات پیش‌فرض چاپ و قالب فاکتورها</span>
            </CardTitle>
            <CardDescription>تعیین سایز کاغذ، قالب پیش‌فرض، حاشیه‌ها و فیلدهای نمایشی فاکتور</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  قالب پیش‌فرض فاکتور
                </label>
                <Select
                  value={printSettings.templateId}
                  options={[
                    { value: 'official', label: '۱. قالب رسمی (استاندارد مودیان/دارایی)' },
                    { value: 'simple', label: '۲. قالب ساده و مینیمال' },
                    { value: 'modern', label: '۳. قالب فروشگاهی مدرن' },
                    { value: 'compact', label: '۴. قالب فشرده (A5/حرارتی)' },
                  ]}
                  onChange={(e) => setPrintSettings({ ...printSettings, templateId: e.target.value as InvoiceTemplateId })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  سایز پیش‌فرض کاغذ
                </label>
                <Select
                  value={printSettings.pageSize}
                  options={[
                    { value: 'A4', label: 'کاغذ A4 (استاندارد)' },
                    { value: 'A5', label: 'کاغذ A5' },
                    { value: 'thermal', label: 'رول پرینتر حرارتی (80mm)' },
                  ]}
                  onChange={(e) => setPrintSettings({ ...printSettings, pageSize: e.target.value as PageSize })}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                تنظیمات پیش‌فرض نمایش فیلدها
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  { key: 'showLogo', label: 'نمایش لوگو' },
                  { key: 'showEconomicDetails', label: 'شناسه اقتصادی' },
                  { key: 'showWarehouse', label: 'نام انبار' },
                  { key: 'showDiscount', label: 'تخفیفات' },
                  { key: 'showTax', label: 'مالیات' },
                  { key: 'showSignatures', label: 'کادر امضا و مهر' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(printSettings[item.key as keyof PrintSettings])}
                      onChange={(e) =>
                        setPrintSettings({ ...printSettings, [item.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA & Mobile Ready Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span>وضعیت برنامه PWA و آماده‌سازی موبایل</span>
            </CardTitle>
            <CardDescription>معماری توسعه چندپلتفرمی (Web / Capacitor / Android / iOS)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
              <span>برنامه وب پیشرونده (PWA)</span>
              <Badge variant="primary">فعال (Manifest / Standalone)</Badge>
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

        {/* SQLite Database Backups (.nxb format) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>پشتیبان‌گیری و بازیابی دیتابیس مالی آفلاین</span>
            </CardTitle>
            <CardDescription>تهیه خروجی رمزنگاری شده و فوق‌العاده امن از کلیه فاکتورها، تراکنش‌ها، مشتریان و کالاها</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Area */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                <span>تهیه نسخه پشتیبان (خروجی دیتابیس)</span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                کل ساختار و داده‌های حسابداری شما با الگوریتم رمزنگاری پیشرفته به صورت یک فایل با پسوند <code className="font-bold">.nxb</code> صادر می‌شود که می‌توانید آن را روی سیستم خود یا گوگل درایو ذخیره کنید.
              </p>
              <Input
                label="کلمه عبور رمزنگاری (جهت امنیت فایل)"
                type="password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleExportBackup}
                icon={<Download className="w-4 h-4" />}
                className="w-full bg-blue-600 hover:bg-blue-700 border-none text-white shadow-sm"
              >
                ایجاد و دانلود فایل پشتیبان (.nxb)
              </Button>
            </div>

            {/* Import Area */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>بازیابی اطلاعات از فایل پشتیبان</span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                با انتخاب یک فایل پشتیبان با پسوند <code className="font-bold">.nxb</code> و وارد کردن کلمه عبور صحیح آن، کلیه اطلاعات مالی جاری جایگزین شده و بازنویسی خواهند شد.
              </p>
              <Input
                label="کلمه عبور رمزگشایی فایل پشتیبان"
                type="password"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportBackup}
                accept=".nxb"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-4 h-4 text-indigo-600" />}
                className="w-full border-dashed border-slate-300 dark:border-slate-700"
              >
                انتخاب فایل و بازیابی اطلاعات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
