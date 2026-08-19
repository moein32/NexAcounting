import React, { useState, useRef } from 'react';
import { Document } from '../../types/document';
import { BusinessProfile } from '../../repositories';
import {
  PrintSettings,
  PageSize,
  InvoiceTemplateId,
  InvoiceFontSize,
  PageOrientation,
} from '../../types/print';
import { printService } from '../../services/printService';
import { InvoiceTemplateRenderer } from './InvoiceTemplateRenderer';
import { safeHtml2Canvas } from '../../utils/html2canvasHelper';
import { jsPDF } from 'jspdf';
import {
  Printer,
  X,
  Save,
  CheckCircle2,
  Download,
  Sliders,
  Eye,
  Maximize2,
  FileText,
  RotateCcw,
  Layout,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  business?: BusinessProfile | null;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  business,
}) => {
  const businessId = business?.id || doc.business_id || 'demo_biz_1';
  const [settings, setSettings] = useState<PrintSettings>(() => {
    const saved = printService.getPrintSettings(businessId);
    return {
      ...saved,
      orientation: saved.orientation || 'portrait',
    };
  });

  const [savedAlert, setSavedAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<'template' | 'margins' | 'toggles'>('template');
  const [mobileViewMode, setMobileViewMode] = useState<'preview' | 'settings'>('preview');
  const [zoom, setZoom] = useState(85);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(85);

  const calculateAutoFitZoom = () => {
    if (typeof window === 'undefined') return 85;
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return 85;

    const isLandscape =
      settings.orientation === 'landscape' ||
      settings.pageSize.includes('landscape') ||
      settings.templateId.includes('landscape');

    let paperWidthPx = 794;
    if (settings.pageSize === 'thermal') {
      paperWidthPx = 302;
    } else if (settings.pageSize === 'A5' || settings.pageSize === 'A5_landscape') {
      paperWidthPx = isLandscape ? 794 : 559;
    } else if (isLandscape) {
      paperWidthPx = 1122;
    }

    const availableWidth = window.innerWidth - 16;
    const autoZoom = Math.min(100, Math.max(25, Math.floor((availableWidth / paperWidthPx) * 100)));
    return autoZoom;
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setZoom(calculateAutoFitZoom());
    }
  }, [settings.orientation, settings.pageSize, settings.templateId]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = currentDist / touchStartDistRef.current;
      const newZoom = Math.min(250, Math.max(25, Math.round(touchStartZoomRef.current * scaleFactor)));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDefaults = () => {
    printService.savePrintSettings(businessId, settings);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handlePrint = () => {
    printService.savePrintSettings(businessId, settings);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const isLandscape =
    settings.orientation === 'landscape' ||
    settings.pageSize.includes('landscape') ||
    settings.templateId.includes('landscape');

  const paperWidthPx =
    settings.pageSize === 'thermal'
      ? 302
      : settings.pageSize === 'A5' || settings.pageSize === 'A5_landscape'
      ? isLandscape
        ? 794
        : 559
      : isLandscape
      ? 1122
      : 794;

  const paperMinHeightPx =
    settings.pageSize === 'thermal'
      ? 400
      : settings.pageSize === 'A5' || settings.pageSize === 'A5_landscape'
      ? isLandscape
        ? 559
        : 794
      : isLandscape
      ? 794
      : 1122;

  const scale = zoom / 100;

  const handleDownloadPDF = async () => {
    try {
      setIsExportingPdf(true);
      printService.savePrintSettings(businessId, settings);

      const printableElement = previewContainerRef.current?.querySelector(
        '.printable-invoice-content'
      ) as HTMLElement;

      if (!printableElement) {
        throw new Error('محتوای فاکتور یافت نشد.');
      }

      const canvas = await safeHtml2Canvas(printableElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const isLandscape =
        settings.orientation === 'landscape' ||
        settings.pageSize.includes('landscape') ||
        settings.templateId.includes('landscape');

      const isA5 = settings.pageSize.includes('A5');

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: isA5 ? 'a5' : 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Factor_${doc.document_number || 'Invoice'}.pdf`);

      showToast('فایل PDF فاکتور با موفقیت ایجاد و دانلود شد.');
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      showToast(err.message || 'خطا در ساخت فایل PDF. لطفا مجددا تلاش کنید.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-950 text-slate-100 no-print overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-2xl shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white truncate">
                استودیو چاپ و خروجی فاکتور
              </h2>
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded-lg border border-indigo-800/40 shrink-0">
                #{doc.document_number}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate hidden sm:block">
              پیش‌نمایش زنده، شخصی‌سازی قالب افقی/عمودی و دانلود PDF
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {savedAlert && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 animate-pulse bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تنظیمات ذخیره شد</span>
            </span>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <span className="text-[10px] text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-xl border border-indigo-800">
              {toastMessage}
            </span>
          )}

          <button
            onClick={handleSaveDefaults}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-all"
            title="ذخیره پیش‌فرض"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تنظیمات</span>
          </button>

          {/* Separated PRINT Button */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all touch-manipulation cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">چاپ فاکتور</span>
            <span className="sm:hidden">چاپ</span>
          </button>

          {/* Separated DOWNLOAD PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExportingPdf}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all touch-manipulation cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">دریافت PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Toggle Switch: Settings vs Preview */}
      <div className="flex md:hidden bg-slate-900 border-b border-slate-800 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setMobileViewMode('preview')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileViewMode === 'preview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>پیش‌نمایش سند</span>
        </button>

        <button
          onClick={() => setMobileViewMode('settings')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileViewMode === 'settings'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>قالب و تنظیمات</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Settings Drawer / Sidebar */}
        <aside
          className={`${
            mobileViewMode === 'settings' ? 'flex' : 'hidden'
          } md:flex w-full md:w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex-col overflow-y-auto shrink-0 p-4 sm:p-5 space-y-5`}
        >
          {/* Preset Category Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('template')}
              className={`py-2 rounded-xl font-bold transition-all ${
                activeTab === 'template'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              قالب و سایز
            </button>
            <button
              onClick={() => setActiveTab('toggles')}
              className={`py-2 rounded-xl font-bold transition-all ${
                activeTab === 'toggles'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              فیلدها
            </button>
            <button
              onClick={() => setActiveTab('margins')}
              className={`py-2 rounded-xl font-bold transition-all ${
                activeTab === 'margins'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              حاشیه‌ها
            </button>
          </div>

          {/* TAB 1: TEMPLATE, SIZE & ORIENTATION */}
          {activeTab === 'template' && (
            <div className="space-y-4 text-xs">
              {/* Orientation Switcher */}
              <div>
                <label className="block font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>جهت صفحه چاپ</span>
                  <span className="text-[10px] text-indigo-400 font-normal">
                    جدید: پشتیبانی از حالت افقی
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateSetting('orientation', 'portrait');
                      if (settings.templateId === 'official_landscape') {
                        updateSetting('templateId', 'official');
                      }
                      if (settings.templateId === 'modern_landscape') {
                        updateSetting('templateId', 'modern');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                      settings.orientation === 'portrait' &&
                      !settings.templateId.includes('landscape')
                        ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold shadow-xs'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Layout className="w-4 h-4 rotate-90" />
                    <span>عمودی (Portrait)</span>
                  </button>

                  <button
                    onClick={() => {
                      updateSetting('orientation', 'landscape');
                      if (settings.templateId === 'official') {
                        updateSetting('templateId', 'official_landscape');
                      } else if (settings.templateId === 'modern') {
                        updateSetting('templateId', 'modern_landscape');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                      settings.orientation === 'landscape' ||
                      settings.templateId.includes('landscape')
                        ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold shadow-xs'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Layout className="w-4 h-4" />
                    <span>افقی (Landscape)</span>
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div>
                <label className="block font-bold text-slate-300 mb-2">سایز کاغذ خروجی</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'A4', label: 'کاغذ A4' },
                    { id: 'A5', label: 'کاغذ A5' },
                    { id: 'thermal', label: 'رول حرارتی (80mm)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateSetting('pageSize', p.id as PageSize)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        settings.pageSize === p.id
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Selectors */}
              <div>
                <label className="block font-bold text-slate-300 mb-2">طرح و قالب فاکتور</label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'official',
                      name: '۱. قالب رسمی مودیان (عمودی)',
                      desc: 'استاندارد دارایی، کادربندی دو خطی، شناسه اقتصادی کامل',
                    },
                    {
                      id: 'official_landscape',
                      name: '۲. قالب رسمی مودیان (افقی / Landscape)',
                      desc: 'طراحی جدید افقی، نمایش گسترده اقلام و ستون‌های مالی',
                    },
                    {
                      id: 'modern',
                      name: '۳. قالب فروشگاهی مدرن (عمودی)',
                      desc: 'کارت‌های تفکیک شده، نوار هدر رنگی، جمع کل برجسته',
                    },
                    {
                      id: 'modern_landscape',
                      name: '۴. قالب فروشگاهی مدرن (افقی / Landscape)',
                      desc: 'طراحی شیک افقی با هدر تاریک و چیدمان عریض',
                    },
                    {
                      id: 'simple',
                      name: '۵. قالب ساده و مینیمال',
                      desc: 'بدون خطوط اضافه، خوانایی بالا و چاپ سریع',
                    },
                    {
                      id: 'compact',
                      name: '۶. قالب فشرده (A5 / رول حرارتی)',
                      desc: 'مخصوص پرینترهای حرارتی و فاکتورهای صندوق',
                    },
                  ].map((t) => {
                    const isSelected = settings.templateId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          updateSetting('templateId', t.id as InvoiceTemplateId);
                          if (t.id.includes('landscape')) {
                            updateSetting('orientation', 'landscape');
                          } else if (t.id !== 'compact') {
                            updateSetting('orientation', 'portrait');
                          }
                        }}
                        className={`w-full p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600/15 text-white font-bold shadow-sm'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <p className="font-bold text-slate-200 text-xs flex items-center justify-between">
                          <span>{t.name}</span>
                          {t.id.includes('landscape') && (
                            <span className="text-[9px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/40">
                              افقی
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block font-bold text-slate-300 mb-2">اندازه قلم (فونت)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'ریز' },
                    { id: 'medium', label: 'متوسط' },
                    { id: 'large', label: 'درشت' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateSetting('fontSize', f.id as InvoiceFontSize)}
                      className={`p-2 rounded-2xl border text-center transition-all ${
                        settings.fontSize === f.id
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Title */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">عنوان دلخواه فاکتور</label>
                <input
                  type="text"
                  value={settings.customTitle || ''}
                  onChange={(e) => updateSetting('customTitle', e.target.value)}
                  placeholder="مثال: فاکتور رسمی فروش کالا و خدمات"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TOGGLES */}
          {activeTab === 'toggles' && (
            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-300 mb-2">
                نمایش یا مخفی‌سازی بخش‌ها
              </label>
              {[
                { key: 'showLogo', label: 'نمایش لوگوی کسب‌وکار' },
                { key: 'showEconomicDetails', label: 'نمایش شناسه ملی و کد اقتصادی' },
                { key: 'showWarehouse', label: 'نمایش نام انبار تحویل‌دهنده' },
                { key: 'showDiscount', label: 'نمایش ستون و مجموع تخفیفات' },
                { key: 'showTax', label: 'نمایش ستون و مجموع مالیات' },
                { key: 'showNotes', label: 'نمایش توضیحات و شرایط فاکتور' },
                { key: 'showSignatures', label: 'نمایش کادر مهر و امضا (فروشنده / خریدار)' },
              ].map((item) => {
                const isChecked = Boolean(settings[item.key as keyof PrintSettings]);
                return (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700"
                  >
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        updateSetting(item.key as keyof PrintSettings, e.target.checked)
                      }
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          )}

          {/* TAB 3: MARGINS */}
          {activeTab === 'margins' && (
            <div className="space-y-4 text-xs">
              <label className="block font-bold text-slate-300 mb-2">
                تنظیم حاشیه‌های کاغذ (میلی‌متر)
              </label>
              {[
                { key: 'marginTop', label: 'حاشیه بالا (Top)' },
                { key: 'marginBottom', label: 'حاشیه پایین (Bottom)' },
                { key: 'marginLeft', label: 'حاشیه چپ (Left)' },
                { key: 'marginRight', label: 'حاشیه راست (Right)' },
              ].map((m) => {
                const val = Number(settings[m.key as keyof PrintSettings]) || 0;
                return (
                  <div
                    key={m.key}
                    className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800"
                  >
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>{m.label}</span>
                      <span className="font-bold text-indigo-400">{val} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={val}
                      onChange={(e) =>
                        updateSetting(m.key as keyof PrintSettings, Number(e.target.value))
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Live Canvas Preview Main Area */}
        <main
          className={`${
            mobileViewMode === 'preview' ? 'flex' : 'hidden'
          } md:flex flex-1 bg-slate-950 p-2 sm:p-6 overflow-auto flex-col items-center justify-start relative w-full touch-pan-x touch-pan-y`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Zoom & View Controls Toolbar */}
          <div className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-2xl mb-3 shadow-xl text-xs">
            <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">
              بزرگ‌نمایی:
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(25, z - 10))}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 font-bold active:scale-95"
            >
              -
            </button>
            <span className="font-mono font-bold text-indigo-400 w-12 text-center text-xs">
              {zoom}٪
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(250, z + 10))}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 font-bold active:scale-95"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom(calculateAutoFitZoom())}
              className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl text-[11px] font-bold active:scale-95 flex items-center gap-1"
            >
              <span>تنظیم عرض</span>
            </button>
            <button
              type="button"
              onClick={() => setZoom(85)}
              className="mr-1 text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>100%</span>
            </button>
          </div>

          {/* Pinch-to-zoom tip badge on mobile */}
          <div className="md:hidden text-[10px] text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full mb-2 flex items-center gap-1">
            <span>💡 برای بزرگ‌نمایی می‌توانید با ۲ انگشت زوم (Pinch) کنید</span>
          </div>

          {/* Printable Invoice Page Canvas Wrapper */}
          <div
            className="flex justify-center items-start overflow-visible transition-all my-2"
            style={{
              width: `${paperWidthPx * scale}px`,
              minHeight: `${paperMinHeightPx * scale}px`,
            }}
          >
            <div
              ref={previewContainerRef}
              className="shadow-2xl rounded-sm bg-white text-black transition-transform"
              style={{
                width: `${paperWidthPx}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <InvoiceTemplateRenderer
                document={doc}
                business={business}
                settings={settings}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
