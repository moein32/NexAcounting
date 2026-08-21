import React, { useState } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { ExportManager } from '../../../export/ExportManager';
import {
  ExportCategory,
  ExportFormatType,
  ImportEntityType,
  ColumnMapping,
  ImportValidationResult,
  ImportSummaryReport,
} from '../../../export/ExportTypes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { InventoryRepository } from '../../../repositories';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Database,
  Layers,
  Sparkles,
  FileCheck,
} from 'lucide-react';

export function ExportCenterPage() {
  const { currentBusiness } = useAppStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // --- Export State ---
  const [exportCategory, setExportCategory] = useState<ExportCategory>('sales');
  const [exportFormat, setExportFormat] = useState<ExportFormatType>('xlsx');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // --- Import State ---
  const [importEntity, setImportEntity] = useState<ImportEntityType>('products');
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4>(1);
  const [parsedFile, setParsedFile] = useState<{
    columns: string[];
    rows: Record<string, any>[];
  } | null>(null);

  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [importReport, setImportReport] = useState<ImportSummaryReport | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const warehouses = InventoryRepository.getWarehouses(businessId);

  // --- Export Handlers ---
  const handleRunExport = async () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      await ExportManager.exportData(exportCategory, {
        businessId,
        format: exportFormat,
        warehouseId: selectedWarehouse === 'all' ? undefined : selectedWarehouse,
      });
      setExportSuccessMsg('فایل خروجی با موفقیت تولید و دانلود شد.');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (e: any) {
      alert(`خطا در تولید فایل خروجی: ${e.message || e}`);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Import Handlers ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = ExportManager.parseImportFile(buffer);
        setParsedFile({ columns: parsed.columns, rows: parsed.rows });

        // Auto suggest mappings
        const suggested = ExportManager.suggestImportMappings(parsed.columns, importEntity);
        setMappings(suggested);
        setImportStep(2);
      } catch (err: any) {
        alert(`خطا در خواندن فایل اکسل: ${err.message || err}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpdateMapping = (targetField: string, sourceColumn: string) => {
    setMappings((prev) => {
      const filtered = prev.filter((m) => m.targetField !== targetField);
      if (sourceColumn) {
        filtered.push({ targetField, sourceColumn });
      }
      return filtered;
    });
  };

  const handleValidateImport = () => {
    if (!parsedFile) return;
    const res = ExportManager.validateImportData(
      importEntity,
      businessId,
      parsedFile.rows,
      mappings
    );
    setValidationResult(res);
    setImportStep(3);
  };

  const handleExecuteImport = () => {
    if (!validationResult) return;
    setIsImporting(true);
    try {
      const report = ExportManager.executeImport(importEntity, businessId, validationResult);
      setImportReport(report);
      setImportStep(4);
    } catch (err: any) {
      alert(`خطا در اجرای ورودی اطلاعات: ${err.message || err}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetImport = () => {
    setImportStep(1);
    setParsedFile(null);
    setMappings([]);
    setValidationResult(null);
    setImportReport(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/30 text-blue-400 rounded-2xl border border-blue-500/30">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>مرکز خروجی و ورودی هوشمند اطلاعات</span>
              <span className="text-xs bg-blue-600/40 text-blue-300 font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Phase 12
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              تولید خروجی‌های حرفه‌ای Excel (.xlsx) / PDF / Word (.docx) و ورود انبوه داده‌ها با صحه‌سنجی خودکار
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>خروجی اطلاعات (Export)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>ورودی اطلاعات (Import)</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: EXPORT DATA --- */}
      {activeTab === 'export' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Category Selection */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>۱. انتخاب بخش داده‌ای جهت خروجی</span>
                </CardTitle>
                <CardDescription>اطلاعات مورد نظر خود برای گزارش‌گیری را انتخاب کنید</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  {
                    id: 'sales',
                    title: 'فاکتورهای فروش و آیتم‌ها',
                    desc: 'خروجی جامع فاکتورهای فروش، سود ناخالص و اقلام',
                    icon: FileSpreadsheet,
                  },
                  {
                    id: 'purchases',
                    title: 'فاکتورهای خرید و تأمین‌کنندگان',
                    desc: 'خروجی اسناد خرید، هزینه‌ها و اقلام وارده',
                    icon: FileText,
                  },
                  {
                    id: 'inventory',
                    title: 'موجودی انبار و کاردکس کالا',
                    desc: 'لیست کالاها، ارزش ریالی انبار و گردش موجودی',
                    icon: Database,
                  },
                  {
                    id: 'treasury',
                    title: 'حساب‌های مالی و گردش بانک/صندوق',
                    desc: 'دریافت‌ها، پرداخت‌ها، چک‌ها و مانده بانک‌ها',
                    icon: Sliders,
                  },
                  {
                    id: 'reports',
                    title: 'گزارش مانده حساب طرف‌های حساب',
                    desc: 'دفتر مشتریان و تأمین‌کنندگان با وضعیت بدهکاری',
                    icon: Sparkles,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = exportCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setExportCategory(item.id as ExportCategory)}
                      className={`w-full p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Export Options & Action */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>۲. فرمت و فیلترهای خروجی</span>
                </CardTitle>
                <CardDescription>فرمت فایل و انبار را تنظیم نمایید</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Radio Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    فرمت فایل خروجی
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'xlsx', label: 'اکسل (Excel .xlsx)', desc: 'چند شیته با فرمول و استایل', icon: FileSpreadsheet },
                      { id: 'docx', label: 'ورد (Word .docx)', desc: 'گزارش رسمی با سربرگ', icon: FileText },
                      { id: 'pdf', label: 'پی‌دی‌اف (PDF .pdf)', desc: 'آماده چاپ و ارائه', icon: FileCode },
                    ].map((fmt) => {
                      const Icon = fmt.icon;
                      const isSelected = exportFormat === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => setExportFormat(fmt.id as ExportFormatType)}
                          className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-bold">{fmt.label}</span>
                          <span className="text-[10px] text-slate-400">{fmt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Warehouse Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    انبار مربوطه
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">همه انبارها (کامل)</option>
                    {(warehouses || []).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status / Alert */}
                {exportSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{exportSuccessMsg}</span>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  variant="primary"
                  onClick={handleRunExport}
                  disabled={isExporting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 text-sm rounded-xl shadow-lg shadow-blue-600/20"
                  icon={isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                >
                  {isExporting ? 'در حال ساخت فایل خروجی...' : 'تولید و دانلود فایل خروجی'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* --- TAB 2: IMPORT DATA --- */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>سامانه ورودی هوشمند داده‌ها از اکسل (Excel Import)</span>
                </CardTitle>
                <CardDescription>
                  ورود انبوه کالاها، مشتریان، تامین‌کنندگان و موجودی انبارها با بررسی صحت داده‌ها
                </CardDescription>
              </div>

              {importStep > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetImport}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  شروع مجدد
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step Wizard Indicator */}
            <div className="grid grid-cols-4 gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 text-xs font-bold">
              {[
                { step: 1, title: '۱. انتخاب نوع و فایل اکسل' },
                { step: 2, title: '۲. نگاشت ستون‌ها' },
                { step: 3, title: '۳. بررسی و صحه‌سنجی' },
                { step: 4, title: '۴. گزارش نهایی ثبت' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    importStep === s.step
                      ? 'border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : importStep > s.step
                      ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {s.title}
                </div>
              ))}
            </div>

            {/* STEP 1: Select Type & Upload File */}
            {importStep === 1 && (
              <div className="space-y-6 max-w-xl mx-auto py-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    نوع داده جهت ورودی
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'products', label: 'کالاها و خدمات' },
                      { id: 'customers', label: 'دفتر مشتریان' },
                      { id: 'suppliers', label: 'تأمین‌کنندگان' },
                      { id: 'initial_stock', label: 'موجودی اول دوره انبار' },
                    ].map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setImportEntity(e.id as ImportEntityType)}
                        className={`p-3 rounded-xl border text-center text-xs transition-all ${
                          importEntity === e.id
                            ? 'border-blue-500 bg-blue-600/15 text-blue-600 dark:text-blue-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 hover:border-blue-500 transition-colors">
                  <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl w-12 h-12 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      انتخاب یا رها کردن فایل Excel (.xlsx)
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      فایل اکسل حاوی لیست داده‌های خود را انتخاب کنید
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Column Mapping */}
            {importStep === 2 && parsedFile && (
              <div className="space-y-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                  <span>
                    تعداد سطر یافت شده در اکسل: <strong>{(parsedFile.rows || []).length} سطر</strong>
                  </span>
                  <span>ستون‌های شناسایی‌شده: {(parsedFile.columns || []).length} ستون</span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                    تطبیق و نگاشت ستون‌های اکسل به فیلدهای دیتابیس
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {(importEntity === 'products'
                      ? [
                          { target: 'name', label: 'نام کالا (اجباری)' },
                          { target: 'code', label: 'کد کالا' },
                          { target: 'purchase_price', label: 'قیمت خرید' },
                          { target: 'sale_price', label: 'قیمت فروش' },
                        ]
                      : importEntity === 'customers' || importEntity === 'suppliers'
                      ? [
                          { target: 'name', label: 'نام شخص / شرکت (اجباری)' },
                          { target: 'code', label: 'کد طرف حساب' },
                          { target: 'phone', label: 'شماره تماس' },
                          { target: 'opening_balance', label: 'مانده اولیه' },
                        ]
                      : [
                          { target: 'item_code', label: 'کد کالا (اجباری)' },
                          { target: 'warehouse_code', label: 'کد/نام انبار' },
                          { target: 'quantity', label: 'تعداد موجودی (اجباری)' },
                          { target: 'cost_price', label: 'قیمت خرید واحد' },
                        ]
                    ).map((f) => {
                      const currentVal =
                        mappings.find((m) => m.targetField === f.target)?.sourceColumn || '';
                      return (
                        <div
                          key={f.target}
                          className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2"
                        >
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {f.label}
                          </span>
                          <select
                            value={currentVal}
                            onChange={(e) => handleUpdateMapping(f.target, e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                          >
                            <option value="">-- انتخاب ستون اکسل --</option>
                            {parsedFile.columns.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={handleValidateImport}
                  className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2.5 text-xs"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  بررسی صحت داده‌ها و رفتن به پیش‌نمایش
                </Button>
              </div>
            )}

            {/* STEP 3: Preview & Validation */}
            {importStep === 3 && validationResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-xs text-center font-bold">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                    <p className="text-slate-500">کل سطرها</p>
                    <p className="text-lg text-slate-900 dark:text-white mt-1">
                      {validationResult.totalRows}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                    <p>سطرهای معتبر</p>
                    <p className="text-lg font-black mt-1">
                      {validationResult.validRowsCount}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl">
                    <p>سطرهای دارای خطا</p>
                    <p className="text-lg font-black mt-1">
                      {validationResult.invalidRowsCount}
                    </p>
                  </div>
                </div>

                {/* Data Table Preview */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-80">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">عنوان / نام</th>
                        <th className="py-2 px-3">کد</th>
                        <th className="py-2 px-3">وضعیت صحه‌سنجی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {validationResult.rows.map((r) => (
                        <tr
                          key={r.rowIndex}
                          className={r.isValid ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-500">{r.rowIndex}</td>
                          <td className="py-2 px-3 font-bold">{r.data.name || r.data.item_code}</td>
                          <td className="py-2 px-3 font-mono">{r.data.code || r.data.warehouse_code || '---'}</td>
                          <td className="py-2 px-3">
                            {r.isValid ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> معتبر
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> {r.errors.join('، ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  variant="primary"
                  onClick={handleExecuteImport}
                  disabled={isImporting || validationResult.validRowsCount === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 text-xs"
                  icon={isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                >
                  {isImporting
                    ? 'در حال ثبت نهایی اطلاعات در دیتابیس...'
                    : `تایید و ثبت ${validationResult.validRowsCount} سطر معتبر در دیتابیس`}
                </Button>
              </div>
            )}

            {/* STEP 4: Success Report */}
            {importStep === 4 && importReport && (
              <div className="p-6 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-center space-y-4">
                <div className="p-3 bg-emerald-600 text-white rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    ورود اطلاعات با موفقیت انجام شد!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    تعداد {importReport.importedCount} سطر با موفقیت در دیتابیس ثبت گردید.
                  </p>
                </div>

                <Button variant="primary" onClick={handleResetImport} className="bg-emerald-600 hover:bg-emerald-500">
                  بازگشت به مرکز ورودی/خروجی
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
