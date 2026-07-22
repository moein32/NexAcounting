import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { CreditCard } from 'lucide-react';

interface CheckMock {
  id: string;
  checkNumber: string;
  bankName: string;
  issuerName: string;
  amount: number;
  dueDate: string;
  status: 'in_box' | 'deposited' | 'passed' | 'bounced';
}

const mockChecks: CheckMock[] = [
  {
    id: 'chk_1',
    checkNumber: '۸۸۲۹۴',
    bankName: 'بانک ملت',
    issuerName: 'بازرگانی کیان پارس',
    amount: 65000000,
    dueDate: '2026-07-23T00:00:00Z',
    status: 'in_box',
  },
  {
    id: 'chk_2',
    checkNumber: '۴۴۱۰۲',
    bankName: 'بانک صادرات',
    issuerName: 'تولیدی چسب پارس',
    amount: 120000000,
    dueDate: '2026-08-10T00:00:00Z',
    status: 'in_box',
  },
];

export function ChecksReceivedPage() {
  const columns: Column<CheckMock>[] = [
    { key: 'checkNumber', header: 'شماره چک' },
    { key: 'bankName', header: 'بانک صادرکننده' },
    { key: 'issuerName', header: 'صاحب چک / مشتری' },
    {
      key: 'amount',
      header: 'مبلغ چک',
      render: (row) => <span className="font-bold text-blue-600">{formatCurrency(row.amount, 'تومان')}</span>,
    },
    {
      key: 'dueDate',
      header: 'تاریخ سررسید',
      render: (row) => formatPersianDate(row.dueDate),
    },
    {
      key: 'status',
      header: 'وضعیت چک',
      render: (row) => {
        if (row.status === 'in_box') return <Badge variant="warning">نزد صندوق (در انتظار خواباندن)</Badge>;
        if (row.status === 'deposited') return <Badge variant="primary">در جریان وصول</Badge>;
        if (row.status === 'passed') return <Badge variant="success">وصول‌شده</Badge>;
        return <Badge variant="danger">برگشتی</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="چک‌های دریافتی"
        description="مدیریت وضعیت چک‌های مشتریان (نزد صندوق، در جریان وصول، پاس‌شده و برگشتی)"
        icon={<CreditCard className="w-6 h-6" />}
      />

      <DataTable
        columns={columns}
        data={mockChecks}
        searchKey="issuerName"
        searchPlaceholder="جستجوی شماره چک یا نام مشتری..."
      />
    </div>
  );
}
