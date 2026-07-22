import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { Calculator, Plus, Download } from 'lucide-react';

interface JournalMock {
  id: string;
  docNumber: number;
  date: string;
  description: string;
  debitTotal: number;
  creditTotal: number;
  status: 'posted' | 'draft';
}

const mockJournal: JournalMock[] = [
  {
    id: 'j1',
    docNumber: 1042,
    date: '2026-07-22T10:30:00Z',
    description: 'ثبت بابت فروش فاکتور INV-1403-1092',
    debitTotal: 85000000,
    creditTotal: 85000000,
    status: 'posted',
  },
  {
    id: 'j2',
    docNumber: 1041,
    date: '2026-07-22T09:15:00Z',
    description: 'ثبت بابت دریافت چک از بازرگانی کیان پارس',
    debitTotal: 140000000,
    creditTotal: 140000000,
    status: 'posted',
  },
];

export function JournalPage() {
  const columns: Column<JournalMock>[] = [
    { key: 'docNumber', header: 'شماره سند' },
    {
      key: 'date',
      header: 'تاریخ سند',
      render: (row) => formatPersianDate(row.date),
    },
    { key: 'description', header: 'شرح سند حسابداری' },
    {
      key: 'debitTotal',
      header: 'جمع بدهکار',
      render: (row) => <span className="font-bold">{formatCurrency(row.debitTotal, 'تومان')}</span>,
    },
    {
      key: 'creditTotal',
      header: 'جمع بستانکار',
      render: (row) => <span className="font-bold">{formatCurrency(row.creditTotal, 'تومان')}</span>,
    },
    {
      key: 'status',
      header: 'وضعیت سند',
      render: (row) =>
        row.status === 'posted' ? <Badge variant="success">قطعی‌omشده</Badge> : <Badge variant="warning">پیش‌نویس</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="دفتر روزنامه"
        description="مشاهده و ثبت اسناد حسابداری دوبل به صورت موازنه بدهکار و بستانکار"
        icon={<Calculator className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
              خروجی PDF
            </Button>
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => alert('ثبت سند دستی جدید')}>
              ثبت سند حسابداری جدید
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={mockJournal}
        searchKey="description"
        searchPlaceholder="جستجوی شماره سند یا شرح سند..."
      />
    </div>
  );
}
