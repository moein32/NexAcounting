import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { ShoppingBag, Plus, Download } from 'lucide-react';

interface PurchaseMock {
  id: string;
  code: string;
  supplierName: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
}

const mockPurchases: PurchaseMock[] = [
  {
    id: '1',
    code: 'PUR-1403-0512',
    supplierName: 'صنایع فولاد متین',
    amount: 210000000,
    date: '2026-07-21T16:45:00Z',
    status: 'paid',
  },
  {
    id: '2',
    code: 'PUR-1403-0511',
    supplierName: 'تولیدی چسب پارس',
    amount: 45000000,
    date: '2026-07-18T10:15:00Z',
    status: 'pending',
  },
];

export function PurchaseInvoicesPage() {
  const columns: Column<PurchaseMock>[] = [
    { key: 'code', header: 'شماره فاکتور خرید' },
    { key: 'supplierName', header: 'تأمین‌کننده / فروشنده' },
    {
      key: 'amount',
      header: 'مبلغ کل',
      render: (row) => <span className="font-bold">{formatCurrency(row.amount, 'تومان')}</span>,
    },
    {
      key: 'date',
      header: 'تاریخ ثبت',
      render: (row) => formatPersianDate(row.date),
    },
    {
      key: 'status',
      header: 'وضعیت پرداخت',
      render: (row) =>
        row.status === 'paid' ? <Badge variant="success">تسویه‌شده</Badge> : <Badge variant="warning">بدهکار</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="فاکتورهای خرید"
        description="ثبت و پیگیری خرید کالاها و هزینه‌های خرید از تأمین‌کنندگان"
        icon={<ShoppingBag className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
              خروجی اکسل
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => alert('ثبت فاکتور خرید جدید')}
            >
              ثبت فاکتور خرید
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={mockPurchases}
        searchKey="supplierName"
        searchPlaceholder="جستجو بر اساس نام تأمین‌کننده یا شماره فاکتور..."
      />
    </div>
  );
}
