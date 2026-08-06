import React, { useState } from 'react';
import { Document } from '../../types/document';
import { BusinessProfile } from '../../repositories';
import { PrintSettings, PageSize, InvoiceTemplateId, InvoiceFontSize } from '../../types/print';
import { printService } from '../../services/printService';
import { InvoiceTemplateRenderer } from './InvoiceTemplateRenderer';
import { Button } from '../ui/Button';
import {
  Printer,
  X,
  Settings2,
  Save,
  FileText,
  Sliders,
  Maximize2,
  CheckCircle2,
  Eye,
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
  if (!isOpen) return null;

  const businessId = business?.id || doc.business_id || 'demo_biz_1';
  const [settings, setSettings] = useState<PrintSettings>(() =>
    printService.getPrintSettings(businessId)
  );

  const [savedAlert, setSavedAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<'template' | 'margins' | 'toggles'>('template');
  const [zoom, setZoom] = useState(100);

  const handleSaveDefaults = () => {
    printService.savePrintSettings(businessId, settings);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handlePrint = () => {
    // Save current print settings
    printService.savePrintSettings(businessId, settings);

    // Apply inline style adjustments to root print layout if needed, then call window.print()
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-[0] z-[99999] flex flex-col bg-slate-900/95 backdrop-blur-md text-slate-100 no-print">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>استودیو چاپ و خروجی فاکتور</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                {doc.document_number}
              </span>
            </h2>
            <p className="text-xs text-slate-400">پیش‌نمایش زنده و تنظیمات شخصی‌سازی چاپ A4 / A5 / حرارتی</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedAlert && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-pulse bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800/50">
              <CheckCircle2 className="w-4 h-4" />
              <span>تنظیمات ذخیره شد</span>
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDefaults}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            icon={<Save className="w-4 h-4" />}
          >
            ذخیره پیش‌فرض
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 font-bold px-5"
            icon={<Printer className="w-4 h-4" />}
          >
            چاپ / دریافت PDF
          </Button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace: Controls Drawer + Live Canvas Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Controls Panel */}
        <aside className="w-80 md:w-96 bg-slate-950 border-l border-slate-800 flex flex-col overflow-y-auto shrink-0 p-5 space-y-6">
          {/* Preset Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('template')}
              className={`py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'template' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              قالب و سایز
            </button>
            <button
              onClick={() => setActiveTab('toggles')}
              className={`py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'toggles' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              نمایش فیلدها
            </button>
            <button
              onClick={() => setActiveTab('margins')}
              className={`py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'margins' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              حاشیه‌ها
            </button>
          </div>

          {/* TAB 1: Template & Page Size */}
          {activeTab === 'template' && (
            <div className="space-y-5 text-xs">
              {/* Page Size */}
              <div>
                <label className="block font-bold text-slate-300 mb-2">سایز کاغذ خروجی</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'A4', label: 'کاغذ A4 (استاندارد)' },
                    { id: 'A5', label: 'کاغذ A5 (کوچک)' },
                    { id: 'thermal', label: 'رول حرارتی (80mm)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateSetting('pageSize', p.id as PageSize)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        settings.pageSize === p.id
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="block font-bold text-slate-300 mb-2">طرح و قالب فاکتور</label>
                <div className="space-y-2">
                  {[
                    { id: 'official', name: '۱. قالب رسمی (استاندارد مودیان و دارایی)', desc: 'کادربندی دو خطی، مشخصات اقتصادی کامل، تایید رسمی' },
                    { id: 'simple', name: '۲. قالب ساده و مینیمال', desc: 'خوانایی بالا، بدون خطوط اضافی، مناسب کسب‌وکارهای مدرن' },
                    { id: 'modern', name: '۳. قالب فروشگاهی مدرن', desc: 'دارای نوار هدر رنگی، کارت مشخصات مشتری و جمع کل مشکی' },
                    { id: 'compact', name: '۴. قالب فشرده (A5 / رول حرارتی)', desc: 'مخصوص فاکتورهای سریع، صندوق و پرینترهای صدور فاکتور' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateSetting('templateId', t.id as InvoiceTemplateId)}
                      className={`w-full p-3 rounded-xl border text-right transition-all ${
                        settings.templateId === t.id
                          ? 'border-blue-500 bg-blue-600/15 text-white font-bold'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold text-slate-200">{t.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block font-bold text-slate-300 mb-2">اندازه فونت متن فاکتور</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'ریز (فشرده)' },
                    { id: 'medium', label: 'متوسط (معمولی)' },
                    { id: 'large', label: 'درشت' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateSetting('fontSize', f.id as InvoiceFontSize)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        settings.fontSize === f.id
                          ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
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
                  placeholder="مثال: فاکتور رسمی فروش کالا"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Toggles */}
          {activeTab === 'toggles' && (
            <div className="space-y-4 text-xs">
              <label className="block font-bold text-slate-300 mb-2">نمایش یا عدم نمایش بخش‌ها</label>
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
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/60 cursor-pointer hover:border-slate-700"
                  >
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => updateSetting(item.key as keyof PrintSettings, e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          )}

          {/* TAB 3: Margins */}
          {activeTab === 'margins' && (
            <div className="space-y-4 text-xs">
              <label className="block font-bold text-slate-300 mb-2">تنظیم حاشیه‌های چاپ (میلی‌متر)</label>

              {[
                { key: 'marginTop', label: 'حاشیه بالا (Top)' },
                { key: 'marginBottom', label: 'حاشیه پایین (Bottom)' },
                { key: 'marginLeft', label: 'حاشیه چپ (Left)' },
                { key: 'marginRight', label: 'حاشیه راست (Right)' },
              ].map((m) => {
                const val = Number(settings[m.key as keyof PrintSettings]) || 0;
                return (
                  <div key={m.key} className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between font-medium text-slate-300">
                      <span>{m.label}</span>
                      <span className="font-bold text-blue-400">{val} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={val}
                      onChange={(e) => updateSetting(m.key as keyof PrintSettings, Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Main Live Preview Area */}
        <main className="flex-1 bg-slate-950/80 p-6 overflow-auto flex flex-col items-center justify-start relative">
          {/* Zoom controls */}
          <div className="sticky top-0 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-full mb-6 shadow-xl text-xs">
            <span className="text-slate-400 font-medium">بزرگ‌نمایی:</span>
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
            >
              -
            </button>
            <span className="font-bold text-blue-400 w-12 text-center">{zoom}٪</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
            >
              +
            </button>
            <button
              onClick={() => setZoom(100)}
              className="mr-2 text-slate-400 hover:text-white text-[11px]"
            >
              بازنشانی
            </button>
          </div>

          {/* Printable Invoice Page Canvas Wrapper */}
          <div
            className="transition-transform origin-top shadow-2xl rounded-sm my-auto bg-white text-black"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <InvoiceTemplateRenderer
              document={doc}
              business={business}
              settings={settings}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
