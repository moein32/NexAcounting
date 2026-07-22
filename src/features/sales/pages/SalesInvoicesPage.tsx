import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { ShoppingCart, FilePlus, Filter, Download } from 'lucide-react';

interface InvoiceMock {
  id: string;
  code: string;
  customerName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

const mockInvoices: InvoiceMock[] = [
  {
    id: '1',
    code: 'INV-1403-1092',
    customerName: 'شرکت پترو صنعت آریا',
    amount: 85000000,
    date: '2026-07-22T10:30:00Z',
    dueDate: '2026-08-05T00:00:00Z',
    status: 'paid',
  },
  {
    id: '2',
    code: 'INV-1403-1091',
    customerName: 'فروشگاه الکترونیک مهر',
    amount: 32000000,
    date: '2026-07-20T11:20:00Z',
    dueDate: '2026-07-30T00:00:00Z',
    status: 'pending',
  },
  {
    id: '3',
    code: 'INV-1403-1090',
    customerName: 'بازرگانی کیان پارس',
    amount: 140000000,
    date: '2026-07-15T09:00:00Z',
    dueDate: '2026-07-20T00:00:00Z',
    status: 'overdue',
  },
  {
    id: '4',
    code: 'INV-1403-1089',
    customerName: 'تولیدی چسب پارس',
    amount: 67000000,
    date: '2026-07-10T14:15:00Z',
    dueDate: '2026-07-25T00:00:00Z',
    status: 'paid',
  },
];

export function SalesInvoicesPage() {
  const columns: Column<InvoiceMock>[] = [
    { key: 'code', header: 'شماره فاکتور' },
    { key: 'customerName', header: 'نام خریدار / مشتری' },
    {
      key: 'amount',
      header: 'مبلغ کل',
      render: (row) => <span className="font-bold">{formatCurrency(row.amount, 'تومان')}</span>,
    },
    {
      key: 'date',
      header: 'تاریخ صدور',
      render: (row) => formatPersianDate(row.date),
    },
    {
      key: 'status',
      header: 'وضعیت تسویه',
      render: (row) => {
        if (row.status === 'paid') return <Badge variant="success">پرداخت‌شده</Badge>;
        if (row.status === 'pending') return <Badge variant="warning">در انتظار پرداخت</Badge>;
        return <Badge variant="danger">سررسیدشده</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="فاکتورهای فروش"
        description="مدیریت، صدور و پیگیری کلیه فاکتورهای فروش صادرشده"
        icon={<ShoppingCart className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
              خروجی اکسل
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<FilePlus className="w-4 h-4" />}
              onClick={() => alert('فرم صدور فاکتور جدید (در مراحل بعدی پیاده‌سازی کامل می‌شود)')}
            >
              صدور فاکتور جدید
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={mockInvoices}
        searchKey="customerName"
        searchPlaceholder="جستجو بر اساس نام مشتری یا شماره فاکتور..."
        onRowClick={(row) => alert(`مشاهده فاکتور ${row.code}`)}
      />
    </div>
  );
}
