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
  CreditCard,
  Layers,
  Sparkles,
} from 'lucide-react';

export function SalesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBusiness, user } = useAuthStore();
  const [doc, setDoc] = useState<Document | null>(null);
  const [events, setEvents] = useState<DocumentEvent[]>(null as any);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

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
      setError(err.message || 'خطا در بارگذاری اطلاعات سند');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!doc || !currentBusiness) return;
    if (!window.confirm('آیا از تایید نهایی و صدور حواله انبار و اعمال اثرات مالی این سند اطمینان دارید؟')) return;

    try {
      setLoading(true);
      await documentService.confirmDocument(currentBusiness.id, doc.id, user?.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در تایید سند');
      setLoading(false);
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
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
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
              <Button variant="primary" size="sm" icon={<Check className="w-4 h-4" />} onClick={handleConfirm} disabled={loading}>
                تأیید نهایی سند
              </Button>
              <Link to={`/sales/new?edit=${doc.id}`}>
                <Button variant="outline" size="sm">
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
            <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700" icon={<X className="w-4 h-4" />} onClick={handleCancel} disabled={loading}>
              ابطال سند
            </Button>
          )}

          <Button variant="outline" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            چاپ / خروجی PDF
          </Button>
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
                        <p className="font-bold">{item.item_name}</p>
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
                    <span>مجموع مالیات و عوارض (۱۰٪):</span>
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
                <p className="text-[10px]">نرم‌افزار یکپارچه NexAccounting</p>
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

          {/* Document Event Log / History (Kardex-like Audit Log) */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              <span>تاریخچه گردش و وقایع</span>
            </h3>

            {events && events.length > 0 ? (
              <div className="relative border-r-2 border-slate-200 dark:border-slate-800 pr-4 mr-2 space-y-4">
                {events.map((ev) => (
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
    </div>
  );
}
