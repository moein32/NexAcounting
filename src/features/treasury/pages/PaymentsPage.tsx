import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { PaymentRepository, TreasuryRepository, Payment, CashAccount } from '../../../repositories/treasuryRepository';
import { PartyRepository, Party } from '../../../repositories';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Trash2,
  ArrowUpRight,
  Send
} from 'lucide-react';

export function PaymentsPage() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filter state
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    party_id: '',
    amount: 0,
    payment_method: 'نقدی',
    cash_account: '',
    reference_number: '',
    description: '',
  });

  const loadData = () => {
    if (businessId) {
      setPayments(PaymentRepository.getAll(businessId));
      setParties(PartyRepository.getAll(businessId).filter(p => p.roles.includes('supplier')));
      setAccounts(TreasuryRepository.getAccounts(businessId));
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleOpenAdd = () => {
    setErrorMsg('');
    setForm({
      party_id: parties[0]?.id || '',
      amount: 0,
      payment_method: 'نقدی',
      cash_account: accounts[0]?.id || '',
      reference_number: '',
      description: '',
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.party_id) {
      setErrorMsg('لطفاً تأمین‌کننده را انتخاب کنید.');
      return;
    }

    if (form.amount <= 0) {
      setErrorMsg('مبلغ پرداخت باید بیشتر از صفر باشد.');
      return;
    }

    if (!form.cash_account) {
      setErrorMsg('لطفاً حساب مبدا (برداشت) را انتخاب کنید.');
      return;
    }

    // Check balance first
    const selectedAcc = accounts.find((a) => a.id === form.cash_account);
    if (selectedAcc && selectedAcc.current_balance < form.amount) {
      setErrorMsg(`موجودی حساب انتخابی کافی نیست. موجودی فعلی: ${formatCurrency(selectedAcc.current_balance)} تومان`);
      return;
    }

    try {
      PaymentRepository.create({
        business_id: businessId,
        party_id: form.party_id,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        cash_account: form.cash_account,
        reference_number: form.reference_number,
        description: form.description,
        status: 'confirmed',
      });

      setSuccessMsg('سند پرداخت وجه با موفقیت ثبت شد و از موجودی صندوق کسر گردید.');
      setShowAddModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی در ثبت سند پرداخت رخ داد.');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا از حذف این سند پرداخت اطمینان دارید؟ با حذف سند، موجودی حساب مالی افزایش خواهد یافت.')) {
      try {
        const success = PaymentRepository.delete(id);
        if (success) {
          setSuccessMsg('سند پرداخت با موفقیت حذف و موجودی حساب تعدیل شد.');
          loadData();
          setTimeout(() => setSuccessMsg(''), 4000);
        } else {
          setErrorMsg('امکان حذف این سند وجود ندارد.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'خطایی در حذف سند رخ داد.');
      }
    }
  };

  const getPartyName = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    return party ? party.name : 'نامشخص';
  };

  const getAccountName = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : 'نامشخص';
  };

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    if (selectedMethodFilter !== 'all' && p.payment_method !== selectedMethodFilter) return false;
    if (selectedAccountFilter !== 'all' && p.cash_account !== selectedAccountFilter) return false;
    return true;
  });

  const columns: Column<Payment>[] = [
    {
      key: 'id',
      header: 'شناسه',
      render: (row) => <span className="text-[10px] font-mono text-slate-400">#{row.id.slice(0, 6)}</span>,
    },
    {
      key: 'party_id',
      header: 'دریافت‌کننده (تأمین‌کننده)',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800 text-xs">{getPartyName(row.party_id)}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'مبلغ پرداخت',
      render: (row) => (
        <span className="font-mono font-black text-xs text-rose-600 flex items-center gap-1">
          <ArrowUpRight className="w-3.5 h-3.5" />
          {formatCurrency(row.amount)} تومان
        </span>
      ),
    },
    {
      key: 'cash_account',
      header: 'حساب مبدا برداشت',
      render: (row) => <span className="font-semibold text-slate-700 text-xs">{getAccountName(row.cash_account)}</span>,
    },
    {
      key: 'payment_method',
      header: 'روش پرداخت',
      render: (row) => <Badge variant="warning">{row.payment_method}</Badge>,
    },
    {
      key: 'reference_number',
      header: 'شماره پیگیری / سند',
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.reference_number || '---'}</span>,
    },
    {
      key: 'created_at',
      header: 'تاریخ ثبت',
      render: (row) => (
        <span className="text-xs text-slate-400 font-medium">
          {row.created_at ? formatPersianDate(row.created_at) : '---'}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'عملیات',
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          title="حذف سند"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const paymentMethods = ['نقدی', 'کارتخوان', 'کارت به کارت', 'انتقال بانکی', 'چک', 'سایر'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="پرداخت‌های خزانه (صندوق خروجی)"
        description="ثبت اسناد تسویه حساب با تأمین‌کنندگان کالا، واریزی‌های نقدی، هزینه‌ها و کسر خودکار از بانک و صندوق"
        icon={<Send className="w-6 h-6 text-indigo-600" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            ثبت پرداخت جدید
          </Button>
        }
      />

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center justify-between animate-fade-in text-xs font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && !showAddModal && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-center justify-between animate-fade-in text-xs font-bold">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMsg}</span>
          </span>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <span className="text-xs font-bold text-slate-500">فیلترهای گزارش:</span>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedMethodFilter}
            onChange={(e) => setSelectedMethodFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">همه روش‌های پرداخت</option>
            {(paymentMethods || []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selectedAccountFilter}
            onChange={(e) => setSelectedAccountFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
          >
            <option value="all">همه صندوق‌ها و بانک‌ها</option>
            {(accounts || []).map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile-First Responsive List */}
      <div className="block md:hidden space-y-4">
        {(filteredPayments || []).map((row, idx) => (
          <div key={row.id} className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400">#{(idx || 0) + 1} • سند پرداخت</span>
              <button 
                onClick={() => handleDelete(row.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">{getPartyName(row.party_id)}</span>
              <span className="text-xs font-mono font-black text-rose-600">{formatCurrency(row.amount)} تومان</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t pt-2.5">
              <div>حساب مبدا: <strong className="text-slate-700">{getAccountName(row.cash_account)}</strong></div>
              <div>روش پرداخت: <strong className="text-slate-700">{row.payment_method}</strong></div>
              <div>پیگیری: <strong className="text-slate-700 font-mono">{row.reference_number || '---'}</strong></div>
              <div>ثبت: <strong className="text-slate-700">{row.created_at ? formatPersianDate(row.created_at).split(' ')[0] : '---'}</strong></div>
            </div>
          </div>
        ))}
        {(filteredPayments || []).length === 0 && (
          <div className="bg-slate-50/50 rounded-2xl p-8 text-center text-slate-400">هیچ سندی یافت نشد.</div>
        )}
      </div>

      {/* Desktop DataTable */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredPayments}
          searchKey="description"
          searchPlaceholder="جستجو در توضیحات اسناد پرداخت..."
        />
      </div>

      {/* --- ADD PAYMENT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setShowAddModal(false)} 
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-950 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <span>ثبت سند پرداخت جدید (خروج وجه)</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">تأمین‌کننده / دریافت‌کننده وجه <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={form.party_id}
                  onChange={(e) => setForm({ ...form, party_id: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">انتخاب تأمین‌کننده...</option>
                  {(parties || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (کد: {p.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">مبلغ پرداخت (تومان) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="مبلغ به عدد..."
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono text-left"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">صندوق / حساب بانکی مبدا (برداشت) <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={form.cash_account}
                  onChange={(e) => setForm({ ...form, cash_account: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">انتخاب حساب مبدا...</option>
                  {(accounts || []).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (موجودی فعلی: {formatCurrency(acc.current_balance)} تومان)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">روش پرداخت</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  {(paymentMethods || []).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">شماره ارجاع / پیگیری فیش (اختیاری)</label>
                <input
                  type="text"
                  placeholder="مانند شماره فیش یا پیگیری تراکنش"
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono text-left"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">توضیحات</label>
                <textarea
                  placeholder="بابت تسویه بدهی، علی‌الحساب و یا فاکتور خرید فلان..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  ثبت و تایید پرداخت
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
