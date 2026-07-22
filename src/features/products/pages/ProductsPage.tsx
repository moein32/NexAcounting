import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency } from '../../../lib/utils';
import { Package, PackagePlus } from 'lucide-react';

interface ProductMock {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  sellPrice: number;
  stock: number;
}

const mockProducts: ProductMock[] = [
  {
    id: 'p1',
    code: 'PRD-1001',
    name: 'سرور HP ProLiant DL380 Gen10',
    category: 'تجهیزات شبکه',
    unit: 'دستگاه',
    sellPrice: 420000000,
    stock: 2,
  },
  {
    id: 'p2',
    code: 'PRD-1002',
    name: 'سویچ ۲۴ پورت سیسکو مدل C9200L',
    category: 'تجهیزات شبکه',
    unit: 'عدد',
    sellPrice: 85000000,
    stock: 14,
  },
  {
    id: 'p3',
    code: 'PRD-1003',
    name: 'خدمات پشتیبانی سالانه شبکه',
    category: 'خدمات نرم‌افزاری',
    unit: 'دوره',
    sellPrice: 120000000,
    stock: 999,
  },
];

export function ProductsPage() {
  const columns: Column<ProductMock>[] = [
    { key: 'code', header: 'کد کالا' },
    { key: 'name', header: 'عنوان کالا / خدمت' },
    { key: 'category', header: 'دسته‌بندی' },
    {
      key: 'sellPrice',
      header: 'قیمت فروش',
      render: (row) => <span className="font-bold">{formatCurrency(row.sellPrice, 'تومان')}</span>,
    },
    {
      key: 'stock',
      header: 'موجودی انبار',
      render: (row) => {
        if (row.stock === 999) return <span className="text-slate-400">خدماتی (بدون انبار)</span>;
        if (row.stock <= 2)
          return <Badge variant="danger">{row.stock} {row.unit} (موجودی بحرانی)</Badge>;
        return <Badge variant="success">{row.stock} {row.unit}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="کالاها و خدمات"
        description="تعریف کالا، قیمت‌گذاری و گروه‌بندی اقلام قابل فروش و خرید"
        icon={<Package className="w-6 h-6" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<PackagePlus className="w-4 h-4" />}
            onClick={() => alert('تعریف کالا/خدمت جدید')}
          >
            تعریف کالا یا خدمت
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={mockProducts}
        searchKey="name"
        searchPlaceholder="جستجوی نام، کد یا دسته‌بندی کالا..."
      />
    </div>
  );
}
