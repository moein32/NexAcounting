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
  FileText,
  FilePlus,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

export function SalesQuotationsPage() {
  const navigate = useNavigate();
  const { currentBusiness } = useAuthStore();
  const [quotes, setQuotes] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    activeCount: 0,
    convertedCount: 0,
    draftCount: 0,
  });

  useEffect(() => {
    if (currentBusiness) {
      loadQuotes();
    }
  }, [currentBusiness]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const list = await documentService.getDocuments(currentBusiness!.id, {
        document_type: 'sales_quote',
      });
      setQuotes(list);

      // Calc stats
      let total = 0;
      let active = 0;
      let converted = 0;
      let drafts = 0;

      list.forEach((q) => {
        total += q.grand_total;
        if (q.status === 'draft') drafts += 1;
        else if (q.status === 'confirmed') active += 1;
        else if (q.status === 'completed') converted += 1;
      });

      setStats({
        totalAmount: total,
        activeCount: active,
        convertedCount: converted,
        draftCount: drafts,
      });
    } catch (err) {
      console.error('Failed to load quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Document>[] = [
    { key: 'document_number', header: 'شماره پیش‌فاکتور' },
    { key: 'party_display_name', header: 'نام خریدار / مشتری' },
    {
      key: 'grand_total',
      header: 'مبلغ کل پیش‌فاکتور',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(row.grand_total, 'تومان')}</span>,
    },
    {
      key: 'document_date',
      header: 'تاریخ صدور',
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
        title="پیش‌فاکتورهای فروش"
        description="صادر نمودن پیش‌فاکتورهای رسمی فروش کالا/خدمات با امکان تبدیل خودکار"
        icon={<FileText className="w-6 h-6 text-indigo-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/sales/new?type=sales_quote">
              <Button
                variant="primary"
                size="sm"
                icon={<FilePlus className="w-4 h-4" />}
              >
                ثبت پیش‌فاکتور جدید
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold">ارزش کل پیش‌فاکتورها</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(stats.totalAmount)} تومان</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold">پیش‌فاکتورهای معتبر</p>
            <p className="text-lg font-black text-emerald-600 mt-1">{stats.activeCount} پیش‌فاکتور</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold">تبدیل‌شده به فاکتور</p>
            <p className="text-lg font-black text-blue-600 mt-1">{stats.convertedCount} پیش‌فاکتور</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold font-semibold">پیش‌نویس‌ها</p>
            <p className="text-lg font-black text-amber-600 mt-1">{stats.draftCount} پیش‌نویس</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">در حال دریافت پیش‌فاکتورها...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={quotes}
          searchKey="party_display_name"
          searchPlaceholder="جستجو بر اساس نام مشتری یا شماره پیش‌فاکتور..."
          onRowClick={(row) => navigate(`/sales/${row.id}`)}
        />
      )}
    </div>
  );
}
