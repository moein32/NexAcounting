import React from 'react';
import { Document } from '../../types/document';
import { BusinessProfile } from '../../repositories';
import { PrintSettings } from '../../types/print';
import { formatCurrency, formatPersianDate } from '../../lib/utils';
import { numberToPersianWords } from '../../lib/persianNumberWords';

interface InvoiceTemplateRendererProps {
  document: Document;
  business?: BusinessProfile | null;
  settings: PrintSettings;
  className?: string;
}

export const InvoiceTemplateRenderer: React.FC<InvoiceTemplateRendererProps> = ({
  document: doc,
  business,
  settings,
  className = '',
}) => {
  const {
    pageSize,
    templateId,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    showLogo,
    showNotes,
    showSignatures,
    showTax,
    showDiscount,
    showEconomicDetails,
    showWarehouse,
    showPaymentDetails,
    fontSize,
    customTitle,
  } = settings;

  // Title selection
  const title =
    customTitle?.trim() ||
    (doc.document_type === 'sales_invoice'
      ? 'فاکتور فروش کالا و خدمات'
      : doc.document_type === 'purchase_invoice'
      ? 'فاکتور خرید کالا و خدمات'
      : doc.document_type === 'sales_quote'
      ? 'پیش‌فاکتور فروش'
      : doc.document_type === 'sales_order'
      ? 'سفارش فروش'
      : 'فاکتور رسمی');

  // Page dimensions & container styles
  const getPageContainerStyle = (): React.CSSProperties => {
    const baseMargin = {
      paddingTop: `${marginTop}mm`,
      paddingBottom: `${marginBottom}mm`,
      paddingLeft: `${marginLeft}mm`,
      paddingRight: `${marginRight}mm`,
    };

    if (pageSize === 'thermal') {
      return {
        ...baseMargin,
        width: '80mm',
        minHeight: 'auto',
        maxWidth: '100%',
      };
    }

    if (pageSize === 'A5') {
      return {
        ...baseMargin,
        width: '148mm',
        minHeight: '210mm',
      };
    }

    // Default A4
    return {
      ...baseMargin,
      width: '210mm',
      minHeight: '297mm',
    };
  };

  // Font size multiplier
  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small':
        return 'text-[11px] leading-tight';
      case 'large':
        return 'text-[13px] leading-normal';
      case 'medium':
      default:
        return 'text-[12px] leading-snug';
    }
  };

  const grandTotalWords = numberToPersianWords(doc.grand_total);

  // --- 1. THERMAL / COMPACT RECEIPT TEMPLATE ---
  if (pageSize === 'thermal' || templateId === 'compact') {
    return (
      <div
        className={`printable-invoice-content bg-white text-black font-sans dir-rtl mx-auto select-text ${getFontSizeClass()} ${className}`}
        style={getPageContainerStyle()}
      >
        {/* Header */}
        <div className="text-center border-b border-black pb-2 mb-2 space-y-1">
          {showLogo && business?.logo_url && (
            <img src={business.logo_url} alt="Logo" className="h-10 mx-auto mb-1 object-contain" />
          )}
          <h2 className="font-bold text-sm">{business?.name || 'فروشگاه'}</h2>
          <p className="font-bold text-xs">{title}</p>
          <div className="text-[10px] flex justify-between pt-1 border-t border-dashed border-gray-400">
            <span>شماره: {doc.document_number}</span>
            <span>تاریخ: {formatPersianDate(doc.document_date)}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="text-[10px] border-b border-black pb-2 mb-2 space-y-0.5">
          <p>
            <span className="font-bold">خریدار:</span> {doc.party_display_name || 'مشتری حضوری'}
          </p>
          {showWarehouse && doc.warehouse_name && <p>انبار: {doc.warehouse_name}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full text-right text-[10px] mb-2 border-collapse">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="py-1">شرح کالا</th>
              <th className="py-1 text-center">تعداد</th>
              <th className="py-1 text-left">قیمت</th>
              <th className="py-1 text-left">کل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {doc.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 leading-tight">
                  {item.item_name}
                  {item.description && <span className="block text-[8px] text-gray-600">{item.description}</span>}
                </td>
                <td className="py-1 text-center font-semibold">{item.quantity}</td>
                <td className="py-1 text-left">{formatCurrency(item.unit_price)}</td>
                <td className="py-1 text-left font-bold">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-black pt-2 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span>جمع کل:</span>
            <span>{formatCurrency(doc.subtotal)} {doc.currency}</span>
          </div>
          {showDiscount && doc.discount_total > 0 && (
            <div className="flex justify-between">
              <span>تخفیف:</span>
              <span>{formatCurrency(doc.discount_total)} -</span>
            </div>
          )}
          {showTax && doc.tax_total > 0 && (
            <div className="flex justify-between">
              <span>مالیات:</span>
              <span>{formatCurrency(doc.tax_total)} +</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs border-t border-black pt-1">
            <span>مبلغ قابل پرداخت:</span>
            <span>{formatCurrency(doc.grand_total)} {doc.currency}</span>
          </div>
        </div>

        {showNotes && doc.notes && (
          <div className="mt-3 pt-2 border-t border-dashed border-gray-400 text-[9px] text-center">
            {doc.notes}
          </div>
        )}

        <div className="mt-3 text-[9px] text-center text-gray-600">
          با تشکر از خرید شما
        </div>
      </div>
    );
  }

  // --- 2. OFFICIAL (IRANIAN MOODAYAN / TAX OFFICE) TEMPLATE ---
  if (templateId === 'official') {
    return (
      <div
        className={`printable-invoice-content bg-white text-slate-900 font-sans dir-rtl mx-auto select-text ${getFontSizeClass()} ${className}`}
        style={getPageContainerStyle()}
      >
        <div className="border-2 border-slate-900 p-3 space-y-3">
          {/* Header */}
          <div className="grid grid-cols-12 items-center border-b-2 border-slate-900 pb-3 gap-2">
            <div className="col-span-3 flex flex-col justify-center items-start">
              {showLogo && business?.logo_url ? (
                <img src={business.logo_url} alt="Logo" className="h-12 max-w-[140px] object-contain mb-1" />
              ) : (
                <div className="font-black text-sm text-slate-900">{business?.name}</div>
              )}
            </div>

            <div className="col-span-6 text-center">
              <h1 className="text-lg font-black tracking-wide text-slate-900 mb-1">{title}</h1>
              {business?.slug && <p className="text-[10px] text-slate-600 font-semibold">{business.name}</p>}
            </div>

            <div className="col-span-3 text-left space-y-1 text-[11px] font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-600">شماره فاکتور:</span>
                <span className="font-bold">{doc.document_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">تاریخ:</span>
                <span>{formatPersianDate(doc.document_date)}</span>
              </div>
              {doc.due_date && (
                <div className="flex justify-between text-rose-700">
                  <span>سررسید:</span>
                  <span>{formatPersianDate(doc.due_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Box */}
          <div className="border border-slate-900 rounded-sm">
            <div className="bg-slate-100 border-b border-slate-900 px-2 py-0.5 font-bold text-slate-900 text-[11px]">
              مشخصات فروشنده
            </div>
            <div className="p-2 grid grid-cols-12 gap-x-4 gap-y-1 text-[11px]">
              <div className="col-span-6">
                <span className="font-bold text-slate-700">نام شخص حقیقی/حقوقی: </span>
                <span className="font-bold">{business?.name || '---'}</span>
              </div>
              {showEconomicDetails && (
                <>
                  <div className="col-span-3">
                    <span className="text-slate-600">شماره اقتصادی: </span>
                    <span>{business?.economic_code || '---'}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-slate-600">شناسه ملی / کد ملی: </span>
                    <span>{business?.national_id || '---'}</span>
                  </div>
                </>
              )}
              <div className="col-span-8">
                <span className="text-slate-600">نشانی کامل: </span>
                <span>{business?.address || '---'}</span>
              </div>
              <div className="col-span-4">
                <span className="text-slate-600">تلفن: </span>
                <span>{business?.phone || '---'}</span>
              </div>
            </div>
          </div>

          {/* Buyer Box */}
          <div className="border border-slate-900 rounded-sm">
            <div className="bg-slate-100 border-b border-slate-900 px-2 py-0.5 font-bold text-slate-900 text-[11px] flex justify-between items-center">
              <span>مشخصات خریدار</span>
              {showWarehouse && doc.warehouse_name && (
                <span className="text-[10px] font-normal text-slate-700">انبار: {doc.warehouse_name}</span>
              )}
            </div>
            <div className="p-2 grid grid-cols-12 gap-x-4 gap-y-1 text-[11px]">
              <div className="col-span-6">
                <span className="font-bold text-slate-700">نام شخص حقیقی/حقوقی: </span>
                <span className="font-bold">{doc.party_display_name || 'مشتری عمومی'}</span>
              </div>
              {showEconomicDetails && (
                <>
                  <div className="col-span-3">
                    <span className="text-slate-600">شماره اقتصادی: </span>
                    <span>---</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-slate-600">شناسه ملی / کد ملی: </span>
                    <span>---</span>
                  </div>
                </>
              )}
              <div className="col-span-12">
                <span className="text-slate-600">نشانی و مشخصات تماس: </span>
                <span>ثبت شده در پرونده حسابداری مشتری</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-900 overflow-hidden">
            <table className="w-full text-right border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold">
                  <th className="py-1.5 px-2 text-center border-l border-slate-900 w-8">ردیف</th>
                  <th className="py-1.5 px-2 text-center border-l border-slate-900 w-20">کد کالا</th>
                  <th className="py-1.5 px-2 border-l border-slate-900">شرح کالا یا خدمات</th>
                  <th className="py-1.5 px-2 text-center border-l border-slate-900 w-16">تعداد</th>
                  <th className="py-1.5 px-2 text-center border-l border-slate-900 w-14">واحد</th>
                  <th className="py-1.5 px-2 text-left border-l border-slate-900 w-24">مبلغ واحد ({doc.currency})</th>
                  {showDiscount && <th className="py-1.5 px-2 text-left border-l border-slate-900 w-20">تخفیف</th>}
                  {showTax && <th className="py-1.5 px-2 text-left border-l border-slate-900 w-20">مالیات (۱۰٪)</th>}
                  <th className="py-1.5 px-2 text-left w-28">مبلغ کل ({doc.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-400">
                {doc.items?.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 text-center border-l border-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-1.5 px-2 text-center border-l border-slate-400 font-mono text-[10px]">
                      {item.item_code || '---'}
                    </td>
                    <td className="py-1.5 px-2 border-l border-slate-400 font-medium">
                      {item.item_name}
                      {item.description && <p className="text-[10px] text-slate-500">{item.description}</p>}
                    </td>
                    <td className="py-1.5 px-2 text-center border-l border-slate-400 font-bold">{item.quantity}</td>
                    <td className="py-1.5 px-2 text-center border-l border-slate-400 text-slate-700">
                      {item.unit_name || 'عدد'}
                    </td>
                    <td className="py-1.5 px-2 text-left border-l border-slate-400 font-mono">
                      {formatCurrency(item.unit_price)}
                    </td>
                    {showDiscount && (
                      <td className="py-1.5 px-2 text-left border-l border-slate-400 font-mono text-slate-700">
                        {item.discount_amount > 0 ? formatCurrency(item.discount_amount) : '0'}
                      </td>
                    )}
                    {showTax && (
                      <td className="py-1.5 px-2 text-left border-l border-slate-400 font-mono text-slate-700">
                        {item.tax_amount > 0 ? formatCurrency(item.tax_amount) : '0'}
                      </td>
                    )}
                    <td className="py-1.5 px-2 text-left font-bold font-mono">
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Persian Words */}
          <div className="grid grid-cols-12 gap-3 border border-slate-900 p-2 text-[11px]">
            <div className="col-span-7 flex flex-col justify-between space-y-2">
              <div>
                <span className="font-bold text-slate-800">مبلغ به حروف: </span>
                <span className="font-bold text-slate-900">{grandTotalWords} {doc.currency}</span>
              </div>
              {showNotes && doc.notes && (
                <div className="pt-2 border-t border-slate-300 text-slate-700">
                  <span className="font-bold">توضیحات و شرایط: </span>
                  <p className="whitespace-pre-line leading-relaxed mt-0.5">{doc.notes}</p>
                </div>
              )}
            </div>

            <div className="col-span-5 border-r border-slate-400 pr-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">جمع کل بدون تخفیف:</span>
                <span className="font-mono">{formatCurrency(doc.subtotal)} {doc.currency}</span>
              </div>
              {showDiscount && doc.discount_total > 0 && (
                <div className="flex justify-between text-slate-800">
                  <span>مجموع تخفیفات:</span>
                  <span className="font-mono">{formatCurrency(doc.discount_total)} - {doc.currency}</span>
                </div>
              )}
              {showTax && doc.tax_total > 0 && (
                <div className="flex justify-between text-slate-800">
                  <span>مالیات و عوارض ارزش افزوده:</span>
                  <span className="font-mono">{formatCurrency(doc.tax_total)} + {doc.currency}</span>
                </div>
              )}
              {doc.shipping_total > 0 && (
                <div className="flex justify-between text-slate-800">
                  <span>هزینه حمل و نقل:</span>
                  <span className="font-mono">{formatCurrency(doc.shipping_total)} + {doc.currency}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm border-t-2 border-slate-900 pt-1.5 text-slate-900">
                <span>مبلغ نهایی قابل پرداخت:</span>
                <span className="font-mono">{formatCurrency(doc.grand_total)} {doc.currency}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          {showSignatures && (
            <div className="grid grid-cols-2 gap-4 border border-slate-900 p-4 text-center text-[11px] h-28">
              <div className="flex flex-col justify-between">
                <p className="font-bold text-slate-800">مهر و امضای فروشنده</p>
                <p className="text-[10px] text-slate-500">{business?.name}</p>
              </div>
              <div className="flex flex-col justify-between border-r border-slate-400 pr-4">
                <p className="font-bold text-slate-800">امضاء و تایید خریدار</p>
                <p className="text-[10px] text-slate-500">{doc.party_display_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 3. MODERN / LUXURY STORE TEMPLATE ---
  if (templateId === 'modern') {
    return (
      <div
        className={`printable-invoice-content bg-white text-slate-900 font-sans dir-rtl mx-auto select-text ${getFontSizeClass()} ${className}`}
        style={getPageContainerStyle()}
      >
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-4">
            <div className="flex items-center gap-3">
              {showLogo && business?.logo_url && (
                <img src={business.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
              )}
              <div>
                <h1 className="text-xl font-black text-slate-900">{business?.name || 'مجموعه تجاری'}</h1>
                <p className="text-xs text-slate-500">{business?.address || 'فروشگاه آنلاین و حضوری'}</p>
              </div>
            </div>

            <div className="text-left space-y-1">
              <span className="inline-block bg-emerald-100 text-emerald-800 font-black text-xs px-3 py-1 rounded-full">
                {title}
              </span>
              <p className="text-xs text-slate-600 font-semibold mt-1">شماره: {doc.document_number}</p>
              <p className="text-xs text-slate-500">تاریخ: {formatPersianDate(doc.document_date)}</p>
            </div>
          </div>

          {/* Customer / Store Details Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">طرف حساب (خریدار)</p>
              <p className="font-bold text-sm text-slate-900">{doc.party_display_name || 'مشتری محترم'}</p>
              {showWarehouse && doc.warehouse_name && (
                <p className="text-xs text-slate-600">انبار صادرکننده: {doc.warehouse_name}</p>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase">اطلاعات کسب‌وکار</p>
              <p className="text-xs font-semibold text-slate-800">تلفن: {business?.phone || '---'}</p>
              {showEconomicDetails && business?.economic_code && (
                <p className="text-xs text-slate-600">کد اقتصادی: {business.economic_code}</p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-2.5 px-2 text-center w-8">ردیف</th>
                  <th className="py-2.5 px-2">شرح کالا</th>
                  <th className="py-2.5 px-2 text-center w-16">تعداد</th>
                  <th className="py-2.5 px-2 text-left w-24">قیمت واحد</th>
                  {showDiscount && <th className="py-2.5 px-2 text-left w-20">تخفیف</th>}
                  {showTax && <th className="py-2.5 px-2 text-left w-20">مالیات</th>}
                  <th className="py-2.5 px-2 text-left w-28">مبلغ کل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doc.items?.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-2 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2">
                      <p className="font-bold text-slate-900">{item.item_name}</p>
                      {item.description && <p className="text-[10px] text-slate-400">{item.description}</p>}
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      {item.quantity} <span className="text-[10px] text-slate-400">({item.unit_name || 'عدد'})</span>
                    </td>
                    <td className="py-2 px-2 text-left font-mono">{formatCurrency(item.unit_price)}</td>
                    {showDiscount && (
                      <td className="py-2 px-2 text-left font-mono text-emerald-600">
                        {formatCurrency(item.discount_amount)}
                      </td>
                    )}
                    {showTax && (
                      <td className="py-2 px-2 text-left font-mono text-slate-500">
                        {formatCurrency(item.tax_amount)}
                      </td>
                    )}
                    <td className="py-2 px-2 text-left font-black font-mono">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-between items-start gap-6 pt-2">
            <div className="flex-1 space-y-2">
              <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-100">
                <span className="text-xs font-bold block mb-1">مبلغ به حروف:</span>
                <span className="text-sm font-black">{grandTotalWords} {doc.currency}</span>
              </div>
              {showNotes && doc.notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold block text-slate-800 mb-0.5">توضیحات:</span>
                  <p className="whitespace-pre-line">{doc.notes}</p>
                </div>
              )}
            </div>

            <div className="w-72 bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>جمع کل:</span>
                <span>{formatCurrency(doc.subtotal)}</span>
              </div>
              {showDiscount && doc.discount_total > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>مجموع تخفیف:</span>
                  <span>{formatCurrency(doc.discount_total)} -</span>
                </div>
              )}
              {showTax && doc.tax_total > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>مالیات:</span>
                  <span>{formatCurrency(doc.tax_total)} +</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base border-t border-slate-700 pt-2 text-white">
                <span>قابل پرداخت:</span>
                <span>{formatCurrency(doc.grand_total)} {doc.currency}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          {showSignatures && (
            <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs text-slate-500">
              <div className="border-t border-slate-200 pt-2">مهر و امضای صادرکننده</div>
              <div className="border-t border-slate-200 pt-2">امضا و تایید دریافت‌کننده</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 4. SIMPLE TEMPLATE ---
  return (
    <div
      className={`printable-invoice-content bg-white text-slate-900 font-sans dir-rtl mx-auto select-text ${getFontSizeClass()} ${className}`}
      style={getPageContainerStyle()}
    >
      <div className="space-y-4">
        {/* Simple Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500 mt-1">شماره: {doc.document_number}</p>
            <p className="text-xs text-slate-500">تاریخ: {formatPersianDate(doc.document_date)}</p>
          </div>
          <div className="text-left">
            {showLogo && business?.logo_url && (
              <img src={business.logo_url} alt="Logo" className="h-10 mb-1 object-contain ml-auto" />
            )}
            <h2 className="text-base font-bold text-slate-900">{business?.name}</h2>
            <p className="text-xs text-slate-500">{business?.phone}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="p-3 border border-slate-200 rounded-lg text-xs space-y-1">
          <p>
            <span className="font-bold text-slate-700">خریدار: </span>
            <span className="font-semibold text-slate-900">{doc.party_display_name || 'مشتری'}</span>
          </p>
          {showWarehouse && doc.warehouse_name && (
            <p className="text-slate-500">تحویل از انبار: {doc.warehouse_name}</p>
          )}
        </div>

        {/* Table */}
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-300 font-bold text-slate-700">
              <th className="py-2 text-center w-8">#</th>
              <th className="py-2">شرح</th>
              <th className="py-2 text-center w-16">تعداد</th>
              <th className="py-2 text-left w-24">قیمت واحد</th>
              {showDiscount && <th className="py-2 text-left w-20">تخفیف</th>}
              <th className="py-2 text-left w-28">مبلغ کل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doc.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2 text-center text-slate-500">{idx + 1}</td>
                <td className="py-2 font-medium">
                  {item.item_name}
                  {item.description && <span className="block text-[10px] text-slate-400">{item.description}</span>}
                </td>
                <td className="py-2 text-center font-semibold">{item.quantity}</td>
                <td className="py-2 text-left font-mono">{formatCurrency(item.unit_price)}</td>
                {showDiscount && <td className="py-2 text-left font-mono text-slate-500">{formatCurrency(item.discount_amount)}</td>}
                <td className="py-2 text-left font-bold font-mono">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="border-t-2 border-slate-300 pt-4 flex justify-between items-start text-xs">
          <div className="max-w-md">
            <p className="font-bold mb-1">مبلغ به حروف:</p>
            <p className="font-semibold text-slate-800 mb-2">{grandTotalWords} {doc.currency}</p>
            {showNotes && doc.notes && <p className="text-slate-500">{doc.notes}</p>}
          </div>
          <div className="w-64 space-y-1 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">جمع:</span>
              <span>{formatCurrency(doc.subtotal)}</span>
            </div>
            {showDiscount && doc.discount_total > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>تخفیف:</span>
                <span>{formatCurrency(doc.discount_total)} -</span>
              </div>
            )}
            {showTax && doc.tax_total > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>مالیات:</span>
                <span>{formatCurrency(doc.tax_total)} +</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-2 text-slate-900">
              <span>مبلغ نهایی:</span>
              <span>{formatCurrency(doc.grand_total)} {doc.currency}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        {showSignatures && (
          <div className="grid grid-cols-2 gap-4 pt-12 text-center text-xs text-slate-500">
            <div>مهر و امضای فروشنده</div>
            <div>امضای تحویل‌گیرنده</div>
          </div>
        )}
      </div>
    </div>
  );
};
