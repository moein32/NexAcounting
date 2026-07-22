import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../lib/utils';
import { Users, UserPlus, Phone, Mail } from 'lucide-react';

interface CustomerMock {
  id: string;
  name: string;
  code: string;
  phone: string;
  balance: number;
  balanceType: 'debtor' | 'creditor' | 'zero';
}

const mockCustomers: CustomerMock[] = [
  {
    id: 'c1',
    name: 'شرکت پترو صنعت آریا',
    code: 'CUST-101',
    phone: '۰۲۱-۸۸۹۹۲۲۱۱',
    balance: 620000000,
    balanceType: 'debtor',
  },
  {
    id: 'c2',
    name: 'بازرگانی کیان پارس',
    code: 'CUST-102',
    phone: '۰۲۱-۴۴۲۲۱۱۰0',
    balance: 140000000,
    balanceType: 'debtor',
  },
  {
    id: 'c3',
    name: 'فروشگاه الکترونیک مهر',
    code: 'CUST-103',
    phone: '۰۲۱-۷۷۸۸۹۹۰۰',
    balance: 0,
    balanceType: 'zero',
  },
];

export function CustomersPage() {
  const columns: Column<CustomerMock>[] = [
    { key: 'code', header: 'کد مشتری' },
    { key: 'name', header: 'نام و عنوان شخص / شرکت' },
    {
      key: 'phone',
      header: 'شماره تماس',
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          {row.phone}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'مانده حساب',
      render: (row) => {
        if (row.balanceType === 'debtor') {
          return <span className="font-bold text-amber-600">{formatCurrency(row.balance, 'تومان')} (بدهکار)</span>;
        }
        if (row.balanceType === 'creditor') {
          return <span className="font-bold text-emerald-600">{formatCurrency(row.balance, 'تومان')} (بستانکار)</span>;
        }
        return <span className="text-slate-400">تسویه (۰)</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="اشخاص و مشتریان"
        description="دفتر تلفن مالی و مدیریت مانده حساب خریداران و طرف‌های تجاری"
        icon={<Users className="w-6 h-6" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => alert('تعریف شخص جدید')}
          >
            تعریف مشتری جدید
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockCustomers}
        searchKey="name"
        searchPlaceholder="جستجوی نام یا کد مشتری..."
      />
    </div>
  );
}
