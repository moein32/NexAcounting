import React, { useState, useRef, useEffect } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
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
  Bell,
  CreditCard,
  Key,
  CheckCircle2,
  Sliders,
  Activity,
  Play,
  Trash2,
  RotateCcw,
  FileCheck,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { BackupRepository } from '../../../repositories';
import { inventoryService } from '../../../services/inventoryService';
import { CostEngine } from '../../../services/costEngine';
import { printService } from '../../../services/printService';
import { PrintSettings, PageSize, InvoiceTemplateId } from '../../../types/print';
import { NotificationManager } from '../../../notifications/NotificationManager';
import { NotificationSettingsModal } from '../../../notifications/ui/NotificationSettingsModal';
import { LicenseService } from '../../../services/licenseService';
import { demoDataService, DemoSummary } from '../../../services/demoDataService';
import { systemDiagnosticService, DiagnosticReport } from '../../../services/systemDiagnosticService';
import {
  testEnvironmentService,
  TestEnvironmentSummary,
  TestEnvironmentReport,
  LiveDbStats,
} from '../../../services/testEnvironmentService';

type SettingTab = 'business' | 'printing' | 'backup' | 'notification' | 'subscription' | 'security' | 'demo_data';

export function SettingsPage() {
  const { currentBusiness, currentUser, setCurrentBusiness, updateCurrentUser } = useAppStore();
  const { theme, setTheme } = useUIStore();

  const [activeTab, setActiveTab] = useState<SettingTab>('business');

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
  const [backupPassword, setBackupPassword] = useState('nexjib-secure-pass');
  const [restorePassword, setRestorePassword] = useState('nexjib-secure-pass');
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification States
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() => NotificationManager.getPreferences(currentBusiness.id));

  // Subscription State
  const licenseInfo = LicenseService.getCachedLicense();
  const plans = LicenseService.getPlans();

  const handleSave = () => {
    setCurrentBusiness({ ...currentBusiness, name: bizName, taxId: bizTaxId });
    updateCurrentUser({ name: userName });

    inventoryService.setNegativeStockPolicy(currentBusiness.id, negativePolicy);
    if (!isCostLocked) {
      CostEngine.setCostMethod(currentBusiness.id, costingMethod);
    }

    printService.savePrintSettings(currentBusiness.id, printSettings);
    NotificationManager.savePreferences(notifPrefs);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export backup
  const handleExportBackup = () => {
    setBackupStatus(null);
    try {
      const encryptedData = BackupRepository.exportBackup();
      
      const blob = new Blob([encryptedData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      
      link.href = url;
      link.download = `nexjib_backup_${dateStr}.nxb`;
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
        message: e.message || 'خطا در ایجاد نسخه پشتیبان',
      });
    }
  };

  // Import backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupStatus(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = BackupRepository.importBackup(content);
        if (success) {
          setBackupStatus({
            type: 'success',
            message: 'اطلاعات با موفقیت بازیابی شد. لطفاً صفحه را بازنشانی کنید.',
          });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setBackupStatus({
            type: 'error',
            message: 'فرمت فایل پشتیبان معتبر نیست یا فایل آسیب دیده است.',
          });
        }
      } catch (err: any) {
        setBackupStatus({
          type: 'error',
          message: err.message || 'خطا در بازیابی فایل پشتیبان.',
        });
      }
    };
    reader.readAsText(file);
  };

  // Demo & Test Environment States
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [demoSummary, setDemoSummary] = useState<DemoSummary | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearStep, setClearStep] = useState<1 | 2>(1);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Health Check Diagnostics & Test Suite State
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);

  // New Real Test Environment & Integrity Suite States
  const [isGeneratingTestEnv, setIsGeneratingTestEnv] = useState(false);
  const [testEnvSummary, setTestEnvSummary] = useState<TestEnvironmentSummary | null>(null);
  const [isRunningTestEnvSuite, setIsRunningTestEnvSuite] = useState(false);
  const [testEnvReport, setTestEnvReport] = useState<TestEnvironmentReport | null>(null);
  const [liveStats, setLiveStats] = useState<LiveDbStats | null>(() =>
    testEnvironmentService.getLiveStats(testEnvSummary?.business_id || currentBusiness.id)
  );

  // Update liveStats when testEnvSummary changes
  useEffect(() => {
    setLiveStats(testEnvironmentService.getLiveStats(testEnvSummary?.business_id || currentBusiness.id));
  }, [testEnvSummary, currentBusiness.id]);

  const tabs: { id: SettingTab; label: string; icon: React.ReactNode }[] = [
    { id: 'business', label: 'کسب‌وکار', icon: <Building2 className="w-4 h-4" /> },
    { id: 'printing', label: 'چاپ و فاکتور', icon: <Printer className="w-4 h-4" /> },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: <Database className="w-4 h-4" /> },
    { id: 'notification', label: 'اعلان‌ها', icon: <Bell className="w-4 h-4" /> },
    { id: 'subscription', label: 'اشتراک و لایسنس', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'security', label: 'امنیت و دسترسی', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'demo_data', label: 'محیط تست و داده‌ها', icon: <Activity className="w-4 h-4" /> },
  ];

  const handleCreateDemoData = async () => {
    setIsGeneratingDemo(true);
    try {
      const res = await demoDataService.createDemoData(currentBusiness.id);
      setDemoSummary(res.summary);
      setLiveStats(testEnvironmentService.getLiveStats(currentBusiness.id));
      setBackupStatus({
        type: 'success',
        message: 'داده‌های تستی با موفقیت ایجاد گردید.',
      });
    } catch (e: any) {
      setBackupStatus({
        type: 'error',
        message: 'خطا در ایجاد داده‌های تستی: ' + e.message,
      });
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleCreateRealTestEnv = async () => {
    setIsGeneratingTestEnv(true);
    try {
      const res = await testEnvironmentService.createRealTestData();
      setTestEnvSummary(res.summary);
      setBackupStatus({
        type: 'success',
        message: `محیط تست واقعی با موفقیت ایجاد گردید (${res.session_id}).`,
      });
    } catch (e: any) {
      setBackupStatus({
        type: 'error',
        message: 'خطا در ایجاد محیط تست واقعی: ' + e.message,
      });
    } finally {
      setIsGeneratingTestEnv(false);
    }
  };

  const handleRunTestEnvSuite = async () => {
    if (!testEnvSummary) return;
    setIsRunningTestEnvSuite(true);
    try {
      const report = await testEnvironmentService.runIntegrityTestSuite(testEnvSummary.business_id);
      setTestEnvReport(report);
      setBackupStatus({
        type: report.overallStatus === 'PASS' ? 'success' : 'error',
        message:
          report.overallStatus === 'PASS'
            ? `کلیه ۱۲ آزمون درستی‌سنجی یکپارچه با موفقیت قبول شدند (PASS).`
            : `تعدادی از آزمون‌های درستی‌سنجی با خطا مواجه شدند.`,
      });
    } catch (e: any) {
      setBackupStatus({
        type: 'error',
        message: 'خطا در اجرای آزمون‌های یکپارچگی: ' + e.message,
      });
    } finally {
      setIsRunningTestEnvSuite(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!testEnvSummary) return;
    setIsResettingDemo(true);
    try {
      await testEnvironmentService.resetTestData(testEnvSummary.business_id);
      setTestEnvSummary(null);
      setTestEnvReport(null);
      setBackupStatus({
        type: 'success',
        message: `محیط تست پاکسازی شد.`,
      });
    } catch (e: any) {
      setBackupStatus({
        type: 'error',
        message: 'خطا در پاکسازی محیط تست: ' + e.message,
      });
    } finally {
      setIsResettingDemo(false);
    }
  };

  const handleClearBusinessData = async () => {
    setIsClearingData(true);
    try {
      await demoDataService.clearBusinessData(currentBusiness.id);
      setShowClearConfirm(false);
      setClearStep(1);
      setDemoSummary(null);
      setTestEnvSummary(null);
      setTestEnvReport(null);
      setDiagnosticReport(null);
      setLiveStats(testEnvironmentService.getLiveStats(currentBusiness.id));
      setBackupStatus({
        type: 'success',
        message: 'تمام اطلاعات تراکنشی کسب‌وکار با موفقیت پاکسازی شد.',
      });
    } catch (e: any) {
      setBackupStatus({
        type: 'error',
        message: 'خطا در پاکسازی داده‌های کسب‌وکار: ' + e.message,
      });
    } finally {
      setIsClearingData(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const report = await systemDiagnosticService.runFullDiagnostics(currentBusiness.id);
      setDiagnosticReport(report);
      setLiveStats(testEnvironmentService.getLiveStats(currentBusiness.id));
    } catch (e: any) {
      setBackupStatus({
        type: 'error',
        message: 'خطا در اجرای تست سلامت سیستم: ' + e.message,
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنظیمات سیستم"
        description="مدیریت پیکربندی‌های کلی کسب‌وکار، چاپ، پشتیبان‌گیری، اعلان‌ها و دسترسی‌ها"
        icon={<Settings className="w-6 h-6 text-blue-600" />}
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

      {/* Reorganized Category Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
        {(tabs || []).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Category Content Area */}
      {activeTab === 'business' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>مشخصات کسب‌وکار فعال</span>
              </CardTitle>
              <CardDescription>اطلاعات حقوقی و مالی شرکت جهت درج در فاکتورها</CardDescription>
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

          {/* Inventory & Costing Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                <span>سیاست ارزش‌گذاری و انبار</span>
              </CardTitle>
              <CardDescription>ارزیابی کالا و کنترل موجودی منفی</CardDescription>
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
                    ? 'به دلیل ثبت اسناد مالی و مصرف Layer در این سال مالی، روش ارزش‌گذاری قفل شده است.'
                    : 'روش ارزش‌گذاری جهت محاسبه بهای تمام‌شده.'}
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
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'printing' && (
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
      )}

      {activeTab === 'backup' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>پشتیبان‌گیری و بازیابی دیتابیس مالی (.nxb)</span>
            </CardTitle>
            <CardDescription>خروجی رمزگذاری‌شده از کلیه فاکتورها، تراکنش‌ها و مشتریان در حافظه محلی SQLite</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Area */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                <span>تهیه نسخه پشتیبان (خروجی دیتابیس)</span>
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                کل ساختار و داده‌های حسابداری شما با الگوریتم رمزنگاری پیشرفته به صورت یک فایل با پسوند <code className="font-bold">.nxb</code> صادر می‌شود.
              </p>
              <Input
                label="کلمه عبور رمزنگاری"
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
                با انتخاب یک فایل پشتیبان با پسوند <code className="font-bold">.nxb</code> و وارد کردن کلمه عبور صحیح، کلیه اطلاعات مالی بازنویسی خواهند شد.
              </p>
              <Input
                label="کلمه عبور رمزگشایی"
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
      )}

      {activeTab === 'notification' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>تنظیمات هشدارها و اعلان‌های هوشمند</span>
            </CardTitle>
            <CardDescription>مدیریت هشدارهای سررسید چک، کمبود موجودی کالا و یادآوری پشتیبان‌گیری</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 cursor-pointer">
                <span>هشدار سررسید دریافت و پرداخت چک‌ها</span>
                <input
                  type="checkbox"
                  checked={notifPrefs.enable_checks}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, enable_checks: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 cursor-pointer">
                <span>هشدار کمبود موجودی کالای انبار</span>
                <input
                  type="checkbox"
                  checked={notifPrefs.enable_inventory}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, enable_inventory: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 cursor-pointer">
                <span>یادآوری دوره‌ای تهیه پشتیبان</span>
                <input
                  type="checkbox"
                  checked={notifPrefs.enable_backup}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, enable_backup: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 cursor-pointer">
                <span>هشدار صورتحساب‌های سررسید گذشته</span>
                <input
                  type="checkbox"
                  checked={notifPrefs.enable_documents}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, enable_documents: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                icon={<Sliders className="w-4 h-4" />}
                onClick={() => setShowNotificationModal(true)}
              >
                تنظیمات پیشرفته اعلان‌ها
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>وضعیت لایسنس و اشتراک فعال</span>
              </CardTitle>
              <CardDescription>مدیریت لایسنس مرکزی، دستگاه‌های مجاز و سطح دسترسی امکانات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">پلن فعال</span>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1 uppercase">
                    {licenseInfo.tier}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">اعتبار لایسنس</span>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                    {new Date(licenseInfo.expiresAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">دستگاه‌های فعال</span>
                  <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                    {licenseInfo.activeDevicesCount} از {licenseInfo.maxDevices} دستگاه
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                اطلاعات مالی شما به صورت ۱۰۰٪ آفلاین درون حافظه SQLite ذخیره می‌شود. سرور Supabase صرفاً جهت استعلام اعتبار لایسنس و کنترل دسترسی کاربران استفاده می‌گردد.
              </p>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(plans || []).map((p) => (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  p.code === licenseInfo.tier
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</h4>
                    {p.code === licenseInfo.tier && (
                      <Badge variant="primary" className="text-[10px]">فعال</Badge>
                    )}
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-3">
                    {p.price_monthly === 0 ? 'رایگان' : `${p.price_monthly.toLocaleString('fa-IR')} تومان / ماه`}
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>حداکثر {p.max_devices} دستگاه همزمان</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>پشتیبانی کامل از تمامی ماژول‌های مالی</span>
                    </li>
                  </ul>
                </div>

                <Button
                  variant={p.code === licenseInfo.tier ? 'outline' : 'primary'}
                  size="sm"
                  className="w-full mt-6"
                  disabled={p.code === licenseInfo.tier}
                >
                  {p.code === licenseInfo.tier ? 'پلن جاری شما' : 'ارتقاء اشتراک'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile */}
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

          {/* Theme & PWA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                <span>پوسته ظاهری و PWA</span>
              </CardTitle>
              <CardDescription>انتخاب حالت روشن/تاریک و وضعیت PWA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                  <span>برنامه وب پیشرونده (PWA)</span>
                  <Badge variant="primary">فعال (Manifest / Standalone)</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
                  <span>سازگاری Capacitor (موبایل)</span>
                  <Badge variant="primary">آماده بدون بازنویسی</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Demo Data & Real Test Environment Dashboard */}
      {activeTab === 'demo_data' && (
        <div className="space-y-6">
          {/* Live SQLite Database Status Card */}
          {liveStats && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-5 h-5 text-indigo-600" />
                      <div>
                        <CardTitle className="text-base text-slate-900 dark:text-white">
                          وضعیت زنده پایگاه داده SQLite و ایزولاسیون داده‌ها
                        </CardTitle>
                        <CardDescription>
                          داده‌های کسب‌وکار فعال: <strong className="text-slate-800 dark:text-slate-200">{liveStats.activeBusinessName}</strong> ({liveStats.activeBusinessId})
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<RefreshCw className="w-3.5 h-3.5" />}
                        onClick={() => setLiveStats(testEnvironmentService.getLiveStats(currentBusiness.id, testEnvSummary?.business_id))}
                      >
                        تازه‌سازی آمار
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Parties */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">طرف‌حساب‌ها (مشتری و تامین‌کننده)</div>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <div className="text-[10px] text-slate-400">واقعی</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{liveStats.realParties}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">تستی</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">{liveStats.testParties}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">کل</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{liveStats.totalParties}</div>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">کالاها و خدمات</div>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <div className="text-[10px] text-slate-400">واقعی</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{liveStats.realItems}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">تستی</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">{liveStats.testItems}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">کل</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{liveStats.totalItems}</div>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">اسناد و فاکتورها</div>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <div className="text-[10px] text-slate-400">واقعی</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{liveStats.realDocuments}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">تستی</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">{liveStats.testDocuments}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">کل</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{liveStats.totalDocuments}</div>
                        </div>
                      </div>
                    </div>

                    {/* Journal Entries */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">اسناد حسابداری (دفتر روزنامه)</div>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <div className="text-[10px] text-slate-400">واقعی</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{liveStats.realJournalEntries}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">تستی</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">{liveStats.testJournalEntries}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">کل</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{liveStats.totalJournalEntries}</div>
                        </div>
                      </div>
                    </div>

                    {/* Receipts & Payments */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">دریافت و پرداخت‌ها</div>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <div className="text-[10px] text-slate-400">واقعی</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{liveStats.realReceipts + liveStats.realPayments}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">تستی</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">{liveStats.testReceipts + liveStats.testPayments}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">کل</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{liveStats.totalReceipts + liveStats.totalPayments}</div>
                        </div>
                      </div>
                    </div>

                    {/* Checks */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">چک‌های صیادی</div>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <div className="text-[10px] text-slate-400">واقعی</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{liveStats.realChecks}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">تستی</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">{liveStats.testChecks}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">کل</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{liveStats.totalChecks}</div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Layers */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">لایه‌های بهای تمام‌شده</div>
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center border-t border-slate-200/50 dark:border-slate-700/50">
                        <div>
                          <div className="text-[10px] text-slate-400">واقعی</div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{liveStats.realCostLayers}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">تستی</div>
                          <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">{liveStats.testCostLayers}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">کل</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{liveStats.totalCostLayers}</div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Method & Business Counts */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="text-slate-500">روش بهای تمام‌شده:</div>
                        <Badge variant="success" className="font-bold">
                          {liveStats.activeCostMethod === 'fifo' ? 'FIFO (اولین صادره)' : 'میانگین موزون'}
                        </Badge>
                      </div>
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500">
                        <span>کسب‌وکارهای دیتابیس:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{liveStats.totalBusinesses}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dedicated Real Test Environment Card */}
              {liveStats.testEnvironmentStats && (
                <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-white to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <FlaskConical className="w-5 h-5 text-indigo-600" />
                        <div>
                          <CardTitle className="text-base text-slate-900 dark:text-white">
                            محیط تست واقعی (Real Test Environment)
                          </CardTitle>
                          <CardDescription>
                            شناسه کسب‌وکار آزمایشی: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{liveStats.testEnvironmentStats.businessId}</span>
                            {liveStats.testEnvironmentStats.sessionId && ` | نشست: ${liveStats.testEnvironmentStats.sessionId}`}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="primary">ایزوله شده در SQLite</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs">
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">مشتریان</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.customersCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">تامین‌کنندگان</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.suppliersCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">طرف‌حساب‌ها (کل)</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.partiesCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">کالاها و خدمات</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.itemsCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">اسناد و فاکتورها</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.documentsCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">اسناد حسابداری</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.journalEntriesCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">دریافت‌ها</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.receiptsCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">پرداخت‌ها</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.paymentsCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">چک‌های صیادی</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.checksCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center">
                        <div className="text-slate-500 text-[11px]">لایه‌های بهای تمام‌شده</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.costLayersCount}</div>
                      </div>
                      <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-center col-span-2">
                        <div className="text-slate-500 text-[11px]">انتقال بین انبارها</div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{liveStats.testEnvironmentStats.inventoryTransfersCount}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real Test Environment Engine Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>تولید محیط تست واقعی (Real Test Environment)</span>
                </CardTitle>
                <CardDescription>
                  ایجاد داده‌های تست با عبور ۱۰۰٪ از منطق‌های واقعی، شامل لایه‌های FIFO، فاکتورهای فروش تسویه/نسیه/ابطال، انتقال بین انبارها، خزانه‌داری، چک‌های صیادی و ثبت اسناد دوطرفه.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play className="w-4 h-4" />}
                    onClick={handleCreateRealTestEnv}
                    isLoading={isGeneratingTestEnv}
                  >
                    ایجاد محیط تست واقعی
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="w-4 h-4" />}
                    onClick={handleResetDemoData}
                    isLoading={isResettingDemo}
                  >
                    پاکسازی ایمن داده‌های تستی
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => {
                      setClearStep(1);
                      setShowClearConfirm(true);
                    }}
                  >
                    پاکسازی کامل
                  </Button>
                </div>

                {testEnvSummary && (
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2.5 text-xs">
                    <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                      <span>سناریوهای تستی مستقر شده:</span>
                      <Badge variant="primary">{testEnvSummary.session_id}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                      <div>مشتریان و تامین‌کنندگان: <b>{testEnvSummary.customers_count + testEnvSummary.suppliers_count}</b></div>
                      <div>انبارها و شعب: <b>{testEnvSummary.warehouses_count}</b></div>
                      <div>کالاها و خدمات: <b>{testEnvSummary.products_count + testEnvSummary.services_count}</b></div>
                      <div>فاکتورهای خرید (FIFO): <b>{testEnvSummary.purchase_invoices_count}</b></div>
                      <div>فاکتورهای فروش (انواع تسویه): <b>{testEnvSummary.sales_invoices_count}</b></div>
                      <div>اسناد ابطال / مرجوعی: <b>{testEnvSummary.cancelled_invoices_count + testEnvSummary.sales_returns_count}</b></div>
                      <div>لایه‌های قیمت ثبت شده: <b>{testEnvSummary.cost_layers_count}</b></div>
                      <div>تراکنش‌های بهای تمام‌شده: <b>{testEnvSummary.cogs_entries_count}</b></div>
                      <div>اسناد حسابداری دفتر کل: <b>{testEnvSummary.journal_entries_count}</b></div>
                      <div>آرتیکل‌های سند (Lines): <b>{testEnvSummary.journal_lines_count}</b></div>
                      <div>دریافت و پرداخت نقد/بانک: <b>{testEnvSummary.receipts_count + testEnvSummary.payments_count}</b></div>
                      <div>چک‌های وصولی/برگشتی: <b>{testEnvSummary.checks_count}</b></div>
                    </div>
                  </div>
                )}

                {demoSummary && !testEnvSummary && (
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
                      <span>خلاصه داده‌های تستی:</span>
                      <Badge variant="primary">{demoSummary.session_id}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-slate-700 dark:text-slate-300">
                      <div>مشتریان: <b>{demoSummary.customers_count}</b></div>
                      <div>تامین‌کنندگان: <b>{demoSummary.suppliers_count}</b></div>
                      <div>انبارها: <b>{demoSummary.warehouses_count}</b></div>
                      <div>کالاها: <b>{demoSummary.products_count}</b></div>
                      <div>فاکتورهای فروش: <b>{demoSummary.sales_invoices_count}</b></div>
                      <div>اسناد حسابداری: <b>{demoSummary.journal_entries_count}</b></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Check & Automated Test Suite Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>آزمون‌های خودکار درستی‌سنجی یکپارچه (Integrity Test Suite)</span>
                </CardTitle>
                <CardDescription>
                  اجرای خودکار ۱۲ آزمون اعتبارسنجی تراز مالی (Debit===Credit)، صحت ریاضی لایه‌های FIFO، انطباق کاردکس با انبار و برگشت‌پذیری اسناد.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Activity className="w-4 h-4" />}
                    onClick={handleRunTestEnvSuite}
                    isLoading={isRunningTestEnvSuite}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    اجرای ۱۲ آزمون درستی‌سنجی
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Sliders className="w-4 h-4" />}
                    onClick={handleRunDiagnostics}
                    isLoading={isRunningDiagnostics}
                  >
                    تست سلامت دیاگنوستیک
                  </Button>
                </div>

                {/* 12 Integrity Suite Results */}
                {testEnvReport && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">نتیجه آزمون‌ها:</span>
                        {testEnvReport.overallStatus === 'PASS' ? (
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3 inline-block ml-1" />
                            {testEnvReport.passedCount} از {testEnvReport.totalAssertions} آزمون قبول (PASS)
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <AlertTriangle className="w-3 h-3 inline-block ml-1" />
                            {testEnvReport.failedCount} خطا از {testEnvReport.totalAssertions} آزمون
                          </Badge>
                        )}
                      </div>
                      <span className="text-slate-500">زمان: {testEnvReport.totalDurationMs}ms</span>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {testEnvReport.assertions?.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                            {item.status === 'PASS' && <Badge variant="success">PASS</Badge>}
                            {item.status === 'WARN' && <Badge variant="warning">WARN</Badge>}
                            {item.status === 'FAIL' && <Badge variant="danger">FAIL</Badge>}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{item.message}</p>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                            <span>ماژول: {item.category}</span>
                            <span>تعداد رکورد ارزیابی: {item.recordsTested}</span>
                            <span>مدت: {item.durationMs}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legacy Diagnostics Report */}
                {diagnosticReport && !testEnvReport && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">وضعیت کلی سیستم:</span>
                        {diagnosticReport.overallStatus === 'PASS' ? (
                          <Badge variant="success">
                            <CheckCircle2 className="w-3 h-3 inline-block ml-1" />
                            کاملاً سالم (PASS)
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <AlertTriangle className="w-3 h-3 inline-block ml-1" />
                            دارای خطا (FAIL)
                          </Badge>
                        )}
                      </div>
                      <span className="text-slate-500">زمان: {diagnosticReport.totalDurationMs}ms</span>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {diagnosticReport.results?.map((res) => (
                        <div
                          key={res.id}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{res.title}</span>
                            {res.status === 'PASS' && <Badge variant="success">PASS</Badge>}
                            {res.status === 'WARN' && <Badge variant="warning">WARN</Badge>}
                            {res.status === 'FAIL' && <Badge variant="danger">FAIL</Badge>}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{res.message}</p>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                            <span>ماژول: {res.category}</span>
                            <span>تعداد رکورد: {res.recordsTested}</span>
                            <span>مدت: {res.durationMs}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear Business Data (2-step verification) */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => {
          setShowClearConfirm(false);
          setClearStep(1);
        }}
        onConfirm={() => {
          if (clearStep === 1) {
            setClearStep(2);
          } else {
            handleClearBusinessData();
          }
        }}
        title={clearStep === 1 ? 'هشدار پاکسازی داده‌های کسب‌وکار' : 'تایید نهایی و قطعی پاکسازی'}
        message={
          clearStep === 1
            ? 'آیا از پاکسازی تمام فاکتورها، تراکنش‌های انبار، دریافت/پرداخت‌ها و اسناد حسابداری مطمئن هستید؟ این عمل غیرقابل بازگشت است.'
            : 'تمام اطلاعات مالی و تراکنشی کسب‌وکار شما کاملاً حذف خواهند شد. آیا برای بار دوم تایید می‌کنید؟'
        }
        confirmText={clearStep === 1 ? 'مرحله بعد' : 'بله، همه داده‌ها پاک شوند'}
        variant="danger"
        isLoading={isClearingData}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          setNotifPrefs(NotificationManager.getPreferences(currentBusiness.id));
        }}
      />
    </div>
  );
}
