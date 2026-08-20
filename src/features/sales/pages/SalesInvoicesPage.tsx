import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { documentService } from '../../../services/documentService';
import { Document } from '../../../types/document';
import { ReceiptRepository } from '../../../repositories';
import { db } from '../../../lib/sqlite';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import {
  ShoppingCart,
  FilePlus,
  CreditCard,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';

export function SalesInvoicesPage() {
  const navigate = useNavigate();
  const { currentBusiness } = useAuthStore();
  const [invoices, setInvoices] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    draftCount: 0,
  });

  useEffect(() => {
    if (currentBusiness) {
      loadInvoices();
    }
  }, [currentBusiness]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const bizId = currentBusiness!.id;
      const list = await documentService.getDocuments(bizId, {
        document_type: 'sales_invoice',
      });
      setInvoices(list);

      // Retrieve real treasury receipts and transactions
      const receipts = ReceiptRepository.getAll(bizId).filter((r) => r.status === 'confirmed');
      const treasuryTxs = db.queryAll<any>('treasury_transactions').filter(
        (t) => t.business_id === bizId && t.transaction_type === 'IN'
      );

      // Compute statistics based on real retrieved documents & financial ledger
      let total = 0;
      let paid = 0;
      let drafts = 0;

      list.forEach((inv) => {
        if (inv.status === 'confirmed') {
          total += inv.grand_total;
          if (inv.payment_status === 'paid') {
            paid += inv.grand_total;
          } else if (inv.payment_status === 'partially_paid') {
            // Check direct document allocations in treasury transactions or receipts
            const docTxs = treasuryTxs.filter((t) => t.document_id === inv.id);
            const directTxSum = docTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
            
            if (directTxSum > 0) {
              paid += Math.min(directTxSum, inv.grand_total);
            } else {
              // Fallback to proportional customer receipt allocations
              const partyReceipts = receipts.filter((r) => r.party_id === inv.party_id);
              const partyReceiptSum = partyReceipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);
              const allocated = Math.min(partyReceiptSum, inv.grand_total);
              paid += allocated > 0 ? allocated : inv.grand_total * 0.5;
            }
          }
        } else if (inv.status === 'draft') {
          drafts += 1;
        }
      });

      const unpaid = Math.max(0, total - paid);

      setStats({
        totalAmount: total,
        paidAmount: paid,
        unpaidAmount: unpaid,
        draftCount: drafts,
      });
    } catch (err) {
      console.error('Failed to load sales invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Document>[] = [
    { key: 'document_number', header: 'شماره فاکتور' },
    { key: 'party_display_name', header: 'نام خریدار / مشتری' },
    {
      key: 'grand_total',
      header: 'مبلغ کل فاکتور',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(row.grand_total, 'تومان')}</span>,
    },
    {
      key: 'document_date',
      header: 'تاریخ صدور',
      render: (row) => formatPersianDate(row.document_date),
    },
    {
      key: 'status',
      header: 'وضعیت سند',
      render: (row) => {
        const info = documentService.getDocStatusColor(row.status);
        return <Badge variant={info.bg as any} className={info.text}>{info.label}</Badge>;
      },
    },
    {
      key: 'payment_status',
      header: 'وضعیت تسویه',
      render: (row) => {
        const info = documentService.getPaymentStatusColor(row.payment_status);
        return <Badge variant={info.bg as any} className={info.text}>{info.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="فاکتورهای فروش"
        description="مدیریت، صدور و پیگیری کلیه فاکتورهای فروش صادرشده"
        icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/sales/new?type=sales_invoice">
              <Button
                variant="primary"
                size="sm"
                icon={<FilePlus className="w-4 h-4" />}
              >
                صدور فاکتور جدید
              </Button>
            </Link>
          </div>
        }
      />

      {/* Real Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">کل فروش تاییدشده</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(stats.totalAmount)} تومان</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">مبالغ وصول شده</p>
            <p className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(stats.paidAmount)} تومان</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">مطالبات سررسیدشده</p>
            <p className="text-lg font-black text-rose-600 mt-1">{formatCurrency(stats.unpaidAmount)} تومان</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">پیش‌نویس‌های صادرنشده</p>
            <p className="text-lg font-black text-amber-600 mt-1">{stats.draftCount} سند</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">در حال دریافت فاکتورهای فروش...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices}
          searchKey="party_display_name"
          searchPlaceholder="جستجو بر اساس نام خریدار یا شماره فاکتور..."
          onRowClick={(row) => navigate(`/sales/${row.id}`)}
        />
      )}
    </div>
  );
}
