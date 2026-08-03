import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { documentService } from '../../../services/documentService';
import { Document } from '../../../types/document';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import {
  RotateCcw,
  FilePlus,
  TrendingDown,
  Warehouse,
} from 'lucide-react';

export function SalesReturnsPage() {
  const navigate = useNavigate();
  const { currentBusiness } = useAuthStore();
  const [returns, setReturns] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    confirmedCount: 0,
    draftCount: 0,
  });

  useEffect(() => {
    if (currentBusiness) {
      loadReturns();
    }
  }, [currentBusiness]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const list = await documentService.getDocuments(currentBusiness!.id, {
        document_type: 'sales_return',
      });
      setReturns(list);

      let total = 0;
      let confirmed = 0;
      let drafts = 0;

      list.forEach((r) => {
        total += r.grand_total;
        if (r.status === 'confirmed') confirmed += 1;
        else if (r.status === 'draft') drafts += 1;
      });

      setStats({
        totalAmount: total,
        confirmedCount: confirmed,
        draftCount: drafts,
      });
    } catch (err) {
      console.error('Failed to load sales returns:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Document>[] = [
    { key: 'document_number', header: 'شماره سند برگشتی' },
    { key: 'party_display_name', header: 'نام خریدار / مشتری' },
    {
      key: 'grand_total',
      header: 'ارزش اقلام برگشتی',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(row.grand_total, 'تومان')}</span>,
    },
    {
      key: 'document_date',
      header: 'تاریخ ثبت',
      render: (row) => formatPersianDate(row.document_date),
    },
    {
      key: 'status',
      header: 'وضعیت',
      render: (row) => {
        const info = documentService.getDocStatusColor(row.status);
        return <Badge variant={info.bg as any} className={info.text}>{info.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="برگشت از فروش کالا"
        description="ثبت صورت‌جلسه کالاهای مرجوعی مشتری با اثر بازگشت خودکار کالاها به کاردکس انبار"
        icon={<RotateCcw className="w-6 h-6 text-rose-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/sales/new?type=sales_return">
              <Button
                variant="primary"
                size="sm"
                icon={<FilePlus className="w-4 h-4" />}
              >
                ثبت سند مرجوعی جدید
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold">ارزش کل برگشتی‌ها</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(stats.totalAmount)} تومان</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold">سند برگشتی نهایی‌شده</p>
            <p className="text-lg font-black text-emerald-600 mt-1">{stats.confirmedCount} سند (در کاردکس)</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
            <Warehouse className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold">اسناد پیش‌نویس</p>
            <p className="text-lg font-black text-amber-600 mt-1">{stats.draftCount} پیش‌نویس</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600">
            <ClockIcon className="w-5 h-5 text-amber-600" />
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">در حال دریافت مرجوعی‌های فروش...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={returns}
          searchKey="party_display_name"
          searchPlaceholder="جستجو بر اساس نام مشتری یا شماره سند برگشتی..."
          onRowClick={(row) => navigate(`/sales/${row.id}`)}
        />
      )}
    </div>
  );
}

// Simple ClockIcon placeholder to keep code clean and self-contained
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
