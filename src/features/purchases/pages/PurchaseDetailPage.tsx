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
} from 'lucide-react';

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

  const handleConfirm = async () => {
    if (!doc || !currentBusiness) return;
    if (!window.confirm('آیا از تایید نهایی و صدور رسید انبار برای کالاهای خریداری شده اطمینان دارید؟')) return;

    try {
      setLoading(true);
      await documentService.confirmDocument(currentBusiness.id, doc.id, user?.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در تایید فاکتور خرید');
      setLoading(false);
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
              <Button variant="primary" size="sm" icon={<Check className="w-4 h-4" />} onClick={handleConfirm} disabled={loading}>
                تأیید و صدور رسید انبار
              </Button>
              <Link to={`/purchases/new?edit=${doc.id}`}>
                <Button variant="outline" size="sm">
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
            <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700" icon={<X className="w-4 h-4" />} onClick={handleCancel} disabled={loading}>
              ابطال فاکتور
            </Button>
          )}

          <Button variant="outline" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            چاپ فاکتور رسمی
          </Button>
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

            {events && events.length > 0 ? (
              <div className="relative border-r-2 border-slate-200 dark:border-slate-800 pr-4 mr-2 space-y-4">
                {events.map((ev) => (
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
    </div>
  );
}
