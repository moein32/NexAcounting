export enum ExportFormat {
  XLSX = 'xlsx',
  PDF = 'pdf',
  DOCX = 'docx',
}

export interface ExportFieldDef {
  key: string;
  label: string;
  width?: number;
  format?: 'currency' | 'number' | 'date' | 'text' | 'percentage';
}

export const EXPORT_FIELD_SCHEMAS: Record<string, ExportFieldDef[]> = {
  sales_invoices: [
    { key: 'document_number', label: 'شماره فاکتور', width: 15 },
    { key: 'document_date', label: 'تاریخ', width: 12, format: 'date' },
    { key: 'party_name', label: 'خریدار', width: 22 },
    { key: 'warehouse_name', label: 'انبار', width: 18 },
    { key: 'status_label', label: 'وضعیت', width: 12 },
    { key: 'subtotal', label: 'جمع کل', width: 16, format: 'currency' },
    { key: 'discount_amount', label: 'تخفیف', width: 14, format: 'currency' },
    { key: 'tax_amount', label: 'مالیات', width: 14, format: 'currency' },
    { key: 'total_amount', label: 'مبلغ نهایی', width: 18, format: 'currency' },
  ],
  sales_items: [
    { key: 'document_number', label: 'شماره فاکتور', width: 15 },
    { key: 'item_code', label: 'کد کالا', width: 12 },
    { key: 'item_name', label: 'نام کالا / خدمت', width: 25 },
    { key: 'quantity', label: 'تعداد', width: 10, format: 'number' },
    { key: 'unit_price', label: 'قیمت واحد', width: 15, format: 'currency' },
    { key: 'discount_amount', label: 'تخفیف', width: 12, format: 'currency' },
    { key: 'tax_amount', label: 'مالیات', width: 12, format: 'currency' },
    { key: 'line_total', label: 'مبلغ کل آیتم', width: 16, format: 'currency' },
    { key: 'estimated_cogs', label: 'بهای تمام‌شده تخمینی', width: 16, format: 'currency' },
    { key: 'estimated_profit', label: 'سود ناخالص', width: 16, format: 'currency' },
  ],
  purchase_invoices: [
    { key: 'document_number', label: 'شماره فاکتور خرید', width: 18 },
    { key: 'document_date', label: 'تاریخ خرید', width: 12, format: 'date' },
    { key: 'party_name', label: 'فروشنده / تأمین‌کننده', width: 22 },
    { key: 'warehouse_name', label: 'انبار مقصد', width: 18 },
    { key: 'status_label', label: 'وضعیت', width: 12 },
    { key: 'subtotal', label: 'جمع فاکتور', width: 16, format: 'currency' },
    { key: 'total_amount', label: 'مبلغ نهایی پرداخت', width: 18, format: 'currency' },
  ],
  inventory_stock: [
    { key: 'code', label: 'کد کالا', width: 12 },
    { key: 'name', label: 'نام کالا', width: 25 },
    { key: 'category_name', label: 'دسته‌بندی', width: 16 },
    { key: 'unit_name', label: 'واحد اندازه‌گیری', width: 12 },
    { key: 'warehouse_name', label: 'انبار', width: 18 },
    { key: 'quantity', label: 'موجودی فعلی', width: 12, format: 'number' },
    { key: 'purchase_price', label: 'آخرین قیمت خرید', width: 16, format: 'currency' },
    { key: 'sale_price', label: 'قیمت فروش', width: 16, format: 'currency' },
    { key: 'inventory_value', label: 'ارزش کل موجودی', width: 18, format: 'currency' },
  ],
  treasury_accounts: [
    { key: 'code', label: 'کد حساب', width: 12 },
    { key: 'title', label: 'نام حساب / بانک / صندوق', width: 22 },
    { key: 'type', label: 'نوع حساب', width: 14 },
    { key: 'account_number', label: 'شماره حساب / کارت', width: 20 },
    { key: 'balance', label: 'مانده موجودی فعلی', width: 18, format: 'currency' },
  ],
  treasury_transactions: [
    { key: 'date', label: 'تاریخ', width: 12, format: 'date' },
    { key: 'type_label', label: 'نوع تراکنش', width: 14 },
    { key: 'account_name', label: 'حساب', width: 20 },
    { key: 'party_name', label: 'طرف حساب', width: 20 },
    { key: 'amount', label: 'مبلغ', width: 16, format: 'currency' },
    { key: 'description', label: 'شرح تراکنش', width: 30 },
  ],
  parties_balance: [
    { key: 'code', label: 'کد', width: 12 },
    { key: 'name', label: 'نام شخص / شرکت', width: 25 },
    { key: 'role_label', label: 'نقش', width: 14 },
    { key: 'phone', label: 'شماره تماس', width: 15 },
    { key: 'balance', label: 'مانده حساب فعلی', width: 18, format: 'currency' },
    { key: 'status_text', label: 'وضعیت بدهکاری/بستانکاری', width: 18 },
  ],
};
