import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { documentService } from '../../../services/documentService';
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
  Download,
} from 'lucide-react';
import { safeHtml2Canvas } from '../../../utils/html2canvasHelper';
import { jsPDF } from 'jspdf';

import { PrintInvoiceModal } from '../../../components/invoice/PrintInvoiceModal';

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBusiness, user } = useAuthStore();
  const [doc, setDoc] = useState<Document | null>(null);
  const [events, setEvents] = useState<DocumentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

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
      const fetchedEvents = await documentService.getDocumentEvents(currentBusiness!.id, id!);
      setEvents(fetchedEvents);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری اطلاعات سند خرید');
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
      alert(err.message || 'خطا در تایید فاکتور خرید');
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
      pdf.save(`Purchase_${doc?.document_number || 'invoice'}.pdf`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setShowPrintModal(true);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCancel = async () => {
    if (!doc || !currentBusiness) return;
    if (!window.confirm('آیا از ابطال این فاکتور خرید و خروج معادل کالاها از انبار اطمینان دارید؟')) return;

    try {
      setLoading(true);
      await documentService.cancelDocument(currentBusiness.id, doc.id, user?.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در ابطال فاکتور خرید');
      setLoading(false);
    }
  };

  const handleConvert = async (targetType: any) => {
    if (!doc || !currentBusiness) return;
    const targetLabel = documentService.getDocTypeNameFarsi(targetType);
    if (!window.confirm(`آیا مایلید این سفارش خرید را به یک فاکتور خرید رسمی تبدیل کنید؟`)) return;

    try {
      setLoading(true);
      const newDoc = await documentService.convertDocument(currentBusiness.id, doc.id, targetType, user?.id);
      alert(`فاکتور خرید جدید به شماره ${newDoc.document_number} صادر گردید.`);
      navigate(`/purchases/${newDoc.id}`);
    } catch (err: any) {
      alert(err.message || 'خطا در تبدیل سند خرید');
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
        <p className="text-sm text-slate-500">در حال دریافت جزئیات سند خرید...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
        <p className="font-semibold text-lg">خطایی رخ داد</p>
        <p className="text-sm max-w-md">{error || 'سند مورد نظر یافت نشد.'}</p>
        <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/purchases')}>
          بازگشت به خریدها
        </Button>
      </div>
    );
  }

  const statusInfo = documentService.getDocStatusColor(doc.status);
  const paymentInfo = documentService.getPaymentStatusColor(doc.payment_status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print gap-4 flex-wrap">
        <Link to="/purchases" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900">
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به سیستم خرید و تدارکات</span>
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
                <span>تأیید و صدور رسید انبار</span>
              </button>
              <Link to={`/purchases/new?edit=${doc.id}`}>
                <Button variant="outline" size="sm" className="rounded-2xl">
                  ویرایش پیش‌نویس
                </Button>
              </Link>
            </>
          )}

          {doc.status === 'confirmed' && doc.document_type === 'purchase_order' && (
            <Button variant="outline" size="sm" onClick={() => handleConvert('purchase_invoice')} disabled={loading}>
              تبدیل به فاکتور خرید
            </Button>
          )}

          {doc.status !== 'cancelled' && (
            <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700 rounded-2xl" icon={<X className="w-4 h-4" />} onClick={handleCancel} disabled={loading}>
              ابطال فاکتور
            </Button>
          )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 print-container print:col-span-3">
          <Card className="p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto shadow-sm rounded-2xl">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-black">
                  {documentService.getDocTypeNameFarsi(doc.document_type)}
                </h1>
                <p className="text-xs text-slate-500">شماره سند: {doc.document_number}</p>
                <p className="text-xs text-slate-500 mt-1">تاریخ فاکتور: {formatPersianDate(doc.document_date)}</p>
                {doc.due_date && (
                  <p className="text-xs text-rose-500 mt-1">سررسید تسویه: {formatPersianDate(doc.due_date)}</p>
                )}
              </div>

              <div className="text-left">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {currentBusiness?.name}
                </h2>
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  خریدار (کسب‌وکار ما)
                </span>
                <div className="mt-2 text-xs text-slate-500">
                  <p>کد اقتصادی: {currentBusiness?.economic_code || '---'}</p>
                </div>
              </div>
            </div>

            {/* Address Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mb-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  مشخصات خریدار (ما)
                </h3>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentBusiness?.name}</p>
                <p className="text-xs text-slate-500">نشانی: {currentBusiness?.address || '---'}</p>
              </div>

              <div className="space-y-1 border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6 md:border-r">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  مشخصات فروشنده / تأمین‌کننده
                </h3>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{doc.party_display_name}</p>
                <p className="text-xs text-slate-500">نشانی و تلفن در پرونده تأمین‌کننده ثبت است.</p>
                {doc.warehouse_name && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Warehouse className="w-3.5 h-3.5 text-blue-500" />
                    <span>انبار تحویل‌گیرنده: {doc.warehouse_name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto min-w-[600px] mb-6">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-1 text-center w-8">ردیف</th>
                    <th className="py-3 px-2">شرح اقلام خریداری شده</th>
                    <th className="py-3 px-2 text-center w-16">تعداد</th>
                    <th className="py-3 px-2 text-left w-28">قیمت خرید ({doc.currency})</th>
                    <th className="py-3 px-2 text-center w-16">تخفیف (٪)</th>
                    <th className="py-3 px-2 text-left w-24">تخفیف</th>
                    <th className="py-3 px-2 text-center w-16">مالیات (٪)</th>
                    <th className="py-3 px-2 text-left w-28">مبلغ نهایی ({doc.currency})</th>
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

            {/* Total blocks */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="max-w-md text-xs text-slate-500">
                <p className="font-bold mb-1 font-bold">یادداشت‌های فاکتور خرید:</p>
                <p className="whitespace-pre-line leading-relaxed">{doc.notes || '---'}</p>
              </div>

              <div className="w-full md:w-80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>جمع ناخالص فاکتور:</span>
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
                    <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                    <span>{formatCurrency(doc.tax_total)} + {doc.currency}</span>
                  </div>
                )}
                {doc.shipping_total > 0 && (
                  <div className="flex justify-between items-center text-slate-500">
                    <span>کرایه حمل و باربری:</span>
                    <span>{formatCurrency(doc.shipping_total)} + {doc.currency}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-3 text-sm font-black text-slate-900 dark:text-white">
                  <span>جمع کل فاکتور خرید:</span>
                  <span>{formatCurrency(doc.grand_total)} {doc.currency}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Info & Events History */}
        <div className="space-y-6 no-print">
          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>وضعیت فاکتور خرید</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">وضعیت سند خرید:</span>
                <Badge variant={statusInfo.bg as any} className={statusInfo.text}>
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">وضعیت تسویه مالی:</span>
                <Badge variant={paymentInfo.bg as any} className={paymentInfo.text}>
                  {paymentInfo.label}
                </Badge>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-900 pt-3">
                <p className="text-slate-400 mb-1">طرف حساب / تأمین‌کننده:</p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{doc.party_display_name}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Audit trail */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              <span>تاریخچه وقایع تدارکاتی</span>
            </h3>

            {Array.isArray(events) && events.length > 0 ? (
              <div className="relative border-r-2 border-slate-200 dark:border-slate-800 pr-4 mr-2 space-y-4">
                {(events || []).map((ev) => (
                  <div key={ev.id} className="relative">
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
                تأیید فاکتور خرید و صدور رسید انبار
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                آیا از تأیید نهایی این فاکتور خرید اطمینان دارید؟ با تأیید فاکتور، رسید ورود به انبار ثبت شده و بستانکاری تأمین‌کننده اعمال می‌گردد.
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
                {loading ? 'در حال ثبت...' : 'تأیید و ثبت رسید انبار'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
