import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { CheckRepository, TreasuryRepository, Check, CashAccount } from '../../../repositories/treasuryRepository';
import { PartyRepository, Party } from '../../../repositories';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTable, Column } from '../../../components/ui/DataTable';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { 
  CreditCard, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Trash2,
  Calendar,
  Layers,
  Banknote,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';

export function ChecksReceivedPage() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [checks, setChecks] = useState<Check[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedCheckForClear, setSelectedCheckForClear] = useState<Check | null>(null);
  
  // Forms state
  const [form, setForm] = useState({
    party_id: '',
    check_number: '',
    bank_name: '',
    amount: 0,
    issue_date: '',
    due_date: '',
  });

  const [clearAccountId, setClearAccountId] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = () => {
    if (businessId) {
      const allChecks = CheckRepository.getAll(businessId);
      setChecks(allChecks.filter(c => c.type === 'received'));
      setParties(PartyRepository.getAll(businessId).filter(p => p.roles.includes('customer')));
      setAccounts(TreasuryRepository.getAccounts(businessId));
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleOpenAdd = () => {
    setErrorMsg('');
    const today = new Date().toISOString().split('T')[0];
    setForm({
      party_id: parties[0]?.id || '',
      check_number: '',
      bank_name: '',
      amount: 0,
      issue_date: today,
      due_date: today,
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { party_id, check_number, bank_name, amount, issue_date, due_date } = form;

    if (!party_id) {
      setErrorMsg('لطفاً مشتری را انتخاب کنید.');
      return;
    }
    if (!check_number.trim()) {
      setErrorMsg('لطفاً شماره چک را وارد کنید.');
      return;
    }
    if (!bank_name.trim()) {
      setErrorMsg('لطفاً نام بانک صادرکننده را وارد کنید.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('مبلغ چک باید بیشتر از صفر باشد.');
      return;
    }
    if (!issue_date || !due_date) {
      setErrorMsg('لطفاً تاریخ صدور و سررسید را انتخاب کنید.');
      return;
    }

    try {
      CheckRepository.create({
        business_id: businessId,
        party_id,
        type: 'received',
        check_number,
        bank_name,
        amount: Number(amount),
        issue_date,
        due_date,
        status: 'pending',
      });

      setSuccessMsg('چک دریافتی جدید با موفقیت ثبت شد و در وضعیت انتظار قرار گرفت.');
      setShowAddModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی رخ داد.');
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('آیا از حذف این چک دریافتی اطمینان دارید؟')) {
      try {
        const deleted = CheckRepository.delete(id);
        if (deleted) {
          setSuccessMsg('چک دریافتی با موفقیت حذف شد.');
          loadData();
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'خطایی رخ داد.');
      }
    }
  };

  // Open clearing popover/modal
  const handleOpenClear = (check: Check) => {
    setErrorMsg('');
    setSelectedCheckForClear(check);
    setClearAccountId(accounts[0]?.id || '');
    setShowClearModal(true);
  };

  const handleClearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckForClear || !clearAccountId) return;

    try {
      CheckRepository.updateStatus(selectedCheckForClear.id, 'cleared', clearAccountId);
      setSuccessMsg(`چک شماره ${selectedCheckForClear.check_number} با موفقیت پاس شد و به موجودی حساب متصل گردید.`);
      setShowClearModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی رخ داد.');
    }
  };

  const handleUpdateStatusDirect = (id: string, status: Check['status']) => {
    try {
      CheckRepository.updateStatus(id, status);
      setSuccessMsg('وضعیت چک با موفقیت به‌روزرسانی شد.');
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی رخ داد.');
    }
  };

  const getPartyName = (partyId: string) => {
    const party = parties.find((p) => p.id === partyId);
    return party ? party.name : 'نامشخص';
  };

  const getStatusBadge = (status: Check['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">نزد صندوق (انتظار)</Badge>;
      case 'cleared':
        return <Badge variant="success">وصول‌شده (پاس شده)</Badge>;
      case 'returned':
        return <Badge variant="danger">برگشت خورده</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">باطل شده</Badge>;
      default:
        return <Badge variant="primary">{status}</Badge>;
    }
  };

  const filteredChecks = checks.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<Check>[] = [
    {
      key: 'check_number',
      header: 'شماره چک',
      render: (row) => <span className="font-mono font-bold text-slate-800 text-xs">{row.check_number}</span>,
    },
    {
      key: 'bank_name',
      header: 'بانک صادرکننده',
      render: (row) => <span className="font-semibold text-slate-700 text-xs">{row.bank_name}</span>,
    },
    {
      key: 'party_id',
      header: 'صاحب چک / مشتری',
      render: (row) => <span className="font-bold text-slate-800 text-xs">{getPartyName(row.party_id)}</span>,
    },
    {
      key: 'amount',
      header: 'مبلغ چک',
      render: (row) => <span className="font-mono font-black text-xs text-blue-600">{formatCurrency(row.amount)} تومان</span>,
    },
    {
      key: 'due_date',
      header: 'تاریخ سررسید',
      render: (row) => <span className="text-xs text-slate-500 font-medium">{formatPersianDate(row.due_date)}</span>,
    },
    {
      key: 'status',
      header: 'وضعیت چک',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'id',
      header: 'تغییر وضعیت و عملیات',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleOpenClear(row)}
                className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 rounded-lg text-[10px] font-bold transition-all"
              >
                وصول چک
              </button>
              <button
                onClick={() => handleUpdateStatusDirect(row.id, 'returned')}
                className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition-all"
              >
                برگشت
              </button>
              <button
                onClick={() => handleUpdateStatusDirect(row.id, 'cancelled')}
                className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition-all"
              >
                ابطال
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="چک‌های صیادی دریافتی"
        description="مدیریت چک‌های صادر شده توسط مشتریان، پیگیری سررسیدها و خواباندن چک به حساب"
        icon={<CreditCard className="w-6 h-6 text-blue-600" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            ثبت چک دریافتی جدید
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

      {errorMsg && !showAddModal && !showClearModal && (
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

      {/* Status filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-500 ml-2">وضعیت چک:</span>
        <button 
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
        >
          همه چک‌ها ({(checks || []).length})
        </button>
        <button 
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
        >
          نزد صندوق ({checks.filter(c => c.status === 'pending').length})
        </button>
        <button 
          onClick={() => setStatusFilter('cleared')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === 'cleared' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
        >
          پاس شده ({checks.filter(c => c.status === 'cleared').length})
        </button>
        <button 
          onClick={() => setStatusFilter('returned')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${statusFilter === 'returned' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
        >
          برگشتی ({checks.filter(c => c.status === 'returned').length})
        </button>
      </div>

      {/* Mobile-First Grid list */}
      <div className="block md:hidden space-y-4">
        {(filteredChecks || []).map((row, idx) => (
          <div key={row.id} className="bg-white dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400">شماره: {row.check_number} • {row.bank_name}</span>
              {getStatusBadge(row.status)}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-850">{getPartyName(row.party_id)}</span>
              <span className="text-xs font-mono font-black text-blue-600">{formatCurrency(row.amount)} تومان</span>
            </div>

            <div className="text-[10px] text-slate-500 border-t pt-2 grid grid-cols-2 gap-2">
              <div>سررسید: <strong>{formatPersianDate(row.due_date)}</strong></div>
              <div>صدور: <strong>{formatPersianDate(row.issue_date).split(' ')[0]}</strong></div>
            </div>

            {row.status === 'pending' && (
              <div className="flex gap-2 pt-2 border-t mt-1 justify-end">
                <button
                  onClick={() => handleOpenClear(row)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold"
                >
                  وصول و خواباندن به حساب
                </button>
                <button
                  onClick={() => handleUpdateStatusDirect(row.id, 'returned')}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold"
                >
                  برگشت
                </button>
              </div>
            )}
          </div>
        ))}

        {(filteredChecks || []).length === 0 && (
          <div className="bg-slate-50/50 rounded-2xl p-8 text-center text-slate-400">هیچ چکی یافت نشد.</div>
        )}
      </div>

      {/* Desktop list */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredChecks}
          searchKey="check_number"
          searchPlaceholder="جستجو با شماره چک صیادی..."
        />
      </div>

      {/* --- ADD CHECK MODAL --- */}
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
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>ثبت مشخصات چک دریافتی جدید</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-bold animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-right">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">مشتری صادرکننده چک <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={form.party_id}
                  onChange={(e) => setForm({ ...form, party_id: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">انتخاب مشتری...</option>
                  {(parties || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (کد: {p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">شماره چک <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="شماره ۱۶ رقمی صیادی"
                    value={form.check_number}
                    onChange={(e) => setForm({ ...form, check_number: e.target.value })}
                    className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-left"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">بانک صادرکننده <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="مانند ملی، ملت، صادرات"
                    value={form.bank_name}
                    onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                    className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">مبلغ چک (تومان) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="مبلغ به عدد..."
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">تاریخ صدور <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">تاریخ سررسید <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                  />
                </div>
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
                  variant="primary"
                >
                  ثبت موقت چک
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CLEAR CHECK DIALOG --- */}
      {showClearModal && selectedCheckForClear && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setShowClearModal(false)} 
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-950 dark:text-slate-100 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>پاس شدن و وصول نهایی چک</span>
            </h3>

            <div className="bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl text-xs space-y-1 mb-4 leading-relaxed">
              <div>شماره چک صیادی: <strong className="font-mono text-[11px]">{selectedCheckForClear.check_number}</strong></div>
              <div>بانک صادرکننده: <strong>{selectedCheckForClear.bank_name}</strong></div>
              <div>مبلغ چک: <strong className="text-blue-600 font-mono font-black">{formatCurrency(selectedCheckForClear.amount)} تومان</strong></div>
              <div>صاحب چک: <strong>{getPartyName(selectedCheckForClear.party_id)}</strong></div>
            </div>

            <form onSubmit={handleClearSubmit} className="space-y-4 text-right">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">حساب یا صندوق مقصد جهت واریز وجه <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={clearAccountId}
                  onChange={(e) => setClearAccountId(e.target.value)}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                >
                  <option value="">انتخاب حساب مقصد...</option>
                  {(accounts || []).map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (موجودی فعلی: {formatCurrency(acc.current_balance)} تومان)
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400">مبلغ چک به محض تایید نهایی به حساب فوق اضافه و تراکنش مالی آن در کاردکس ثبت می‌گردد.</span>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClearModal(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="success"
                >
                  وصول نهایی چک صیادی
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
