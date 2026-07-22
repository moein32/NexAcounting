import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { Landmark, Plus } from 'lucide-react';

interface ReceiptMock {
  id: string;
  code: string;
  partyName: string;
  amount: number;
  method: 'بانک (پوز/پایا)' | 'صندوق نقدی' | 'چک دریافتی';
  date: string;
}

const mockReceipts: ReceiptMock[] = [
  {
    id: 'r1',
    code: 'REC-1403-0481',
    partyName: 'بازرگانی کیان پارس',
    amount: 140000000,
    method: 'چک دریافتی',
    date: '2026-07-22T09:15:00Z',
  },
  {
    id: 'r2',
    code: 'REC-1403-0480',
    partyName: 'شرکت پترو صنعت آریا',
    amount: 85000000,
    method: 'بانک (پوز/پایا)',
    date: '2026-07-21T11:00:00Z',
  },
];

export function ReceiptsPage() {
  const columns: Column<ReceiptMock>[] = [
    { key: 'code', header: 'شماره رسید' },
    { key: 'partyName', header: 'پرداخت‌کننده' },
    {
      key: 'amount',
      header: 'مبلغ دریافت',
      render: (row) => <span className="font-bold text-emerald-600">{formatCurrency(row.amount, 'تومان')}</span>,
    },
    {
      key: 'method',
      header: 'نوع دریافت',
      render: (row) => <Badge variant="primary">{row.method}</Badge>,
    },
    {
      key: 'date',
      header: 'تاریخ ثبت',
      render: (row) => formatPersianDate(row.date),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="دریافت‌های خزانه"
        description="ثبت وجوه دریافتی نقد، کارتخوان، حواله و چک‌های مشتریان"
        icon={<Landmark className="w-6 h-6" />}
        actions={
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => alert('ثبت دریافت جدید')}>
            ثبت دریافت جدید
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockReceipts}
        searchKey="partyName"
        searchPlaceholder="جستجوی طرف حساب یا رسید..."
      />
    </div>
  );
}
