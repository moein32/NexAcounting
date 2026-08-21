import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { documentService } from '../../../services/documentService';
import { db } from '../../../lib/sqlite';
import { Document, DocumentEvent } from '../../../types/document';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import {
  ArrowRight,
  Printer,
  Check,
  X,
  FileText,
  Calendar,
  Warehouse,
  User,
  History,
  TrendingUp,
  CreditCard,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { safeHtml2Canvas } from '../../../utils/html2canvasHelper';
import { jsPDF } from 'jspdf';

import { PrintInvoiceModal } from '../../../components/invoice/PrintInvoiceModal';
import { printService } from '../../../services/printService';
import { InvoiceTemplateRenderer } from '../../../components/invoice/InvoiceTemplateRenderer';

export function SalesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBusiness, user } = useAuthStore();
  const [doc, setDoc] = useState<Document | null>(null);
  const [events, setEvents] = useState<DocumentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [profitInfo, setProfitInfo] = useState<{ cogs: number; profit: number; margin: number } | null>(null);

  useEffect(() => {
    if (currentBusiness && id) {
      loadData();
    }
  }, [currentBusiness, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedDoc = await documentService.getDocumentById(currentBusiness!.id, id!);
      setDoc(fetchedDoc);
      
      if (fetchedDoc && fetchedDoc.document_type === 'sales_invoice' && fetchedDoc.status === 'confirmed') {
        const cogsRows = db.queryAll<any>('cogs_entries').filter(c => c.document_id === fetchedDoc.id);
        const invoiceCOGS = cogsRows.reduce((sum, c) => sum + Number(c.total_cost || 0), 0);
        const profit = fetchedDoc.grand_total - invoiceCOGS;
        const margin = fetchedDoc.grand_total > 0 ? (profit / fetchedDoc.grand_total) * 100 : 0;
        setProfitInfo({ cogs: invoiceCOGS, profit, margin });
      } else {
        setProfitInfo(null);
      }

      const fetchedEvents = await documentService.getDocumentEvents(currentBusiness!.id, id!);
      setEvents(fetchedEvents);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری اطلاعات سند');
    } finally {
      setLoading(false);
    }
  };

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleConfirm = async () => {
    if (!doc || !currentBusiness) return;
    try {
      setLoading(true);
      await documentService.confirmDocument(currentBusiness.id, doc.id, user?.id);
      setConfirmModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در تایید سند');
      setLoading(false);
    }
  };

  const handleDirectDownloadPDF = async () => {
    try {
      setIsExportingPdf(true);
      const printableElement = document.querySelector('.printable-invoice-content') as HTMLElement;
      if (!printableElement) {
        setShowPrintModal(true);
        return;
      }
      const canvas = await safeHtml2Canvas(printableElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Factor_${doc?.document_number || 'invoice'}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setShowPrintModal(true);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCancel = async () => {
    if (!doc || !currentBusiness) return;
    if (!window.confirm('آیا از ابطال این سند و برگشت زدن تراکنش‌های مالی و انبارداری آن اطمینان دارید؟')) return;

    try {
      setLoading(true);
      await documentService.cancelDocument(currentBusiness.id, doc.id, user?.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در ابطال سند');
      setLoading(false);
    }
  };

  const handleConvert = async (targetType: any) => {
    if (!doc || !currentBusiness) return;
    const targetLabel = documentService.getDocTypeNameFarsi(targetType);
    if (!window.confirm(`آیا می‌خواهید این سند را به یک ${targetLabel} جدید تبدیل کنید؟`)) return;

    try {
      setLoading(true);
      const newDoc = await documentService.convertDocument(currentBusiness.id, doc.id, targetType, user?.id);
      alert(`${targetLabel} جدید به شماره ${newDoc.document_number} با موفقیت صادر گردید.`);
      navigate(`/sales/${newDoc.id}`);
    } catch (err: any) {
      alert(err.message || 'خطا در تبدیل سند');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  if (loading && !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">در حال بارگذاری جزئیات سند...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
        <p className="font-semibold text-lg">خطایی رخ داد</p>
        <p className="text-sm max-w-md">{error || 'سند مورد نظر یافت نشد.'}</p>
        <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/sales')}>
          بازگشت به فروش
        </Button>
      </div>
    );
  }

  const statusInfo = documentService.getDocStatusColor(doc.status);
  const paymentInfo = documentService.getPaymentStatusColor(doc.payment_status);

  return (
    <div className="space-y-6">
      {/* Detail Page Actions */}
      <div className="flex items-center justify-between no-print gap-4 flex-wrap">
        <Link to="/sales" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900">
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به سیستم فروش</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {doc.status === 'draft' && (
            <>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(true)}
                disabled={loading}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
              >
                <Check className="w-4 h-4" />
                <span>تأیید نهایی سند</span>
              </button>
              <Link to={`/sales/new?edit=${doc.id}`}>
                <Button variant="outline" size="sm" className="rounded-2xl">
                  ویرایش پیش‌نویس
                </Button>
              </Link>
            </>
          )}

          {doc.status === 'confirmed' && (
            <div className="flex items-center gap-2">
              {doc.document_type === 'sales_quote' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleConvert('sales_order')} disabled={loading}>
                    تبدیل به سفارش فروش
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleConvert('sales_invoice')} disabled={loading}>
                    تبدیل مستقیم به فاکتور
                  </Button>
                </>
              )}
              {doc.document_type === 'sales_order' && (
                <Button variant="outline" size="sm" onClick={() => handleConvert('sales_invoice')} disabled={loading}>
                  تبدیل به فاکتور فروش
                </Button>
              )}
            </div>
          )}

          {doc.status !== 'cancelled' && (
            <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700 rounded-2xl" icon={<X className="w-4 h-4" />} onClick={handleCancel} disabled={loading}>
              ابطال سند
            </Button>
          )}

          {/* Separated PRINT and DOWNLOAD PDF Buttons */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-2xl border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            <Printer className="w-4 h-4" />
            <span>استودیو چاپ فاکتور</span>
          </button>

          <button
            type="button"
            onClick={handleDirectDownloadPDF}
            disabled={isExportingPdf}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            <Download className="w-4 h-4" />
            <span>دانلود PDF</span>
          </button>
        </div>
      </div>

      {/* Main Print Layout or Web Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Printable Invoice Container */}
        <div className="lg:col-span-2 space-y-6 print-container print:col-span-3">
          <Card className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto shadow-sm rounded-2xl">
            {/* Header Area of Invoice */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                  {documentService.getDocTypeNameFarsi(doc.document_type)}
                </h1>
                <p className="text-xs text-slate-500">شماره: {doc.document_number}</p>
                <p className="text-xs text-slate-500 mt-1">تاریخ: {formatPersianDate(doc.document_date)}</p>
                {doc.due_date && (
                  <p className="text-xs text-rose-500 mt-1">سررسید: {formatPersianDate(doc.due_date)}</p>
                )}
              </div>

              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {currentBusiness?.name}
                </h2>
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {currentBusiness?.slug || 'کسب‌وکار معتبر'}
                </span>
                <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                  <p>کد اقتصادی: {currentBusiness?.economic_code || '---'}</p>
                  <p>شناسه ملی: {currentBusiness?.national_id || '---'}</p>
                </div>
              </div>
            </div>

            {/* Seller and Buyer Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mb-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              {/* Seller */}
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  مشخصات فروشنده
                </h3>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentBusiness?.name}</p>
                <p className="text-xs text-slate-500">تلفن: {currentBusiness?.phone || '---'}</p>
                <p className="text-xs text-slate-500">نشانی: {currentBusiness?.address || '---'}</p>
              </div>

              {/* Buyer */}
              <div className="space-y-1 border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6 md:border-r">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  مشخصات خریدار
                </h3>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{doc.party_display_name}</p>
                <p className="text-xs text-slate-500">نشانی و تلفن تماس مشتری در پرونده ثبت است.</p>
                {doc.warehouse_name && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Warehouse className="w-3.5 h-3.5 text-blue-500" />
                    <span>انبار تحویل‌دهنده: {doc.warehouse_name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto min-w-[600px] mb-6">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-1 text-center w-8">ردیف</th>
                    <th className="py-3 px-2">شرح کالا یا خدمت</th>
                    <th className="py-3 px-2 text-center w-16">تعداد</th>
                    <th className="py-3 px-2 text-left w-28">بهای واحد ({doc.currency})</th>
                    <th className="py-3 px-2 text-center w-16">تخفیف (٪)</th>
                    <th className="py-3 px-2 text-left w-24">مبلغ تخفیف</th>
                    <th className="py-3 px-2 text-center w-16">مالیات (٪)</th>
                    <th className="py-3 px-2 text-left w-28">مبلغ کل ({doc.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                  {doc.items?.map((item, index) => (
                    <tr key={item.id || index} className="text-slate-800 dark:text-slate-200">
                      <td className="py-3 px-1 text-center font-bold">{index + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold">{item.item_name || (item as any).productName || item.description || 'کالای نامشخص'}</p>
                        {item.description && <p className="text-[10px] text-slate-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="py-3 px-2 text-center font-bold">
                        {item.quantity} <span className="text-[10px] text-slate-400">({item.unit_name || 'عدد'})</span>
                      </td>
                      <td className="py-3 px-2 text-left">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-2 text-center text-amber-600">{item.discount_percent || 0}٪</td>
                      <td className="py-3 px-2 text-left text-amber-600">{formatCurrency(item.discount_amount)}</td>
                      <td className="py-3 px-2 text-center text-rose-600">{item.tax_percent || 0}٪</td>
                      <td className="py-3 px-2 text-left font-black">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Block */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="max-w-md text-xs text-slate-500">
                <p className="font-bold mb-1">توضیحات و شرایط:</p>
                <p className="whitespace-pre-line leading-relaxed">{doc.notes || 'شرایط پیش‌فرضی ثبت نگردیده است.'}</p>
              </div>

              <div className="w-full md:w-80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>جمع کل ردیف‌ها:</span>
                  <span>{formatCurrency(doc.subtotal)} {doc.currency}</span>
                </div>
                {doc.discount_total > 0 && (
                  <div className="flex justify-between items-center text-amber-600 font-medium">
                    <span>مجموع تخفیفات:</span>
                    <span>{formatCurrency(doc.discount_total)} - {doc.currency}</span>
                  </div>
                )}
                {doc.tax_total > 0 && (
                  <div className="flex justify-between items-center text-rose-600 font-medium">
                    <span>مجموع مالیات و عوارض ارزش افزوده (VAT):</span>
                    <span>{formatCurrency(doc.tax_total)} + {doc.currency}</span>
                  </div>
                )}
                {doc.shipping_total > 0 && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>هزینه حمل و نقل:</span>
                    <span>{formatCurrency(doc.shipping_total)} + {doc.currency}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-3 text-sm font-black text-slate-900 dark:text-white">
                  <span>مبلغ قابل پرداخت:</span>
                  <span>{formatCurrency(doc.grand_total)} {doc.currency}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-8 mt-8 text-center text-xs text-slate-400 print:grid">
              <div>
                <p className="font-bold text-slate-600 mb-12">مهر و امضای صادرکننده (فروشنده)</p>
                <p className="text-[10px]">نرم‌افزار یکپارچه NexJib (نکس‌جیب)</p>
              </div>
              <div>
                <p className="font-bold text-slate-600 mb-12">امضا و تایید تحویل‌گیرنده (خریدار)</p>
                <p className="text-[10px]">&nbsp;</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Info & Events History */}
        <div className="space-y-6 no-print">
          {/* Metadata Card */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>وضعیت و کنترل سند</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">نوع سند تجاری:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {documentService.getDocTypeNameFarsi(doc.document_type)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">وضعیت اعتبار:</span>
                <Badge variant={statusInfo.bg as any} className={statusInfo.text}>
                  {statusInfo.label}
                </Badge>
              </div>

              {doc.document_type.includes('invoice') && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">وضعیت تسویه:</span>
                  <Badge variant={paymentInfo.bg as any} className={paymentInfo.text}>
                    {paymentInfo.label}
                  </Badge>
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-900 pt-3">
                <p className="text-slate-400 mb-1">مرتبط با طرف حساب:</p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{doc.party_display_name}</span>
                </div>
              </div>

              {doc.reference_document_number && (
                <div className="border-t border-slate-100 dark:border-slate-900 pt-3">
                  <span className="text-slate-500 block mb-1">عطف به سند مرجع:</span>
                  <span className="font-bold text-blue-600 block">{doc.reference_document_number}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Profit analysis card (only for confirmed sales invoice) */}
          {doc.document_type === 'sales_invoice' && doc.status === 'confirmed' && profitInfo && (
            <Card className="p-6 border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50/40 to-emerald-100/10 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-2xl">
              <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>تحلیل سودآوری واقعی فاکتور</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">بهای تمام‌شده کالا (COGS):</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(profitInfo.cogs, 'تومان')}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-emerald-100/50 dark:border-emerald-900/10 pt-3">
                  <span className="text-slate-500">سود ناخالص فروش:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(profitInfo.profit, 'تومان')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">حاشیه سود ناخالص:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full ${profitInfo.margin >= 30 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                    {profitInfo.margin.toFixed(1)}٪
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Document Event Log / History (Kardex-like Audit Log) */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              <span>تاریخچه گردش و وقایع</span>
            </h3>

            {Array.isArray(events) && (events || []).length > 0 ? (
              <div className="relative border-r-2 border-slate-200 dark:border-slate-800 pr-4 mr-2 space-y-4">
                {(events || []).map((ev) => (
                  <div key={ev.id} className="relative">
                    {/* Circle dot on timeline */}
                    <div className="absolute -right-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-950"></div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {ev.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>توسط: {ev.user_name || 'کاربر سیستم'}</span>
                        <span>{formatPersianDate(ev.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">تاریخچه واقعه‌ای ثبت نگردیده است.</p>
            )}
          </Card>
        </div>
      </div>

      {doc && (
        <PrintInvoiceModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          document={doc}
          business={currentBusiness}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تأیید نهایی و صدور سند
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                آیا از تأیید نهایی این سند اطمینان دارید؟ با تأیید سند، حواله انبار صادر شده و اثرات مالی در حسابداری ثبت می‌شود.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all touch-manipulation cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all touch-manipulation cursor-pointer"
              >
                {loading ? 'در حال ثبت...' : 'تأیید و صدور نهایی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
