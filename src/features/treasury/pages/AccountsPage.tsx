import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { TreasuryRepository, CashAccount } from '../../../repositories/treasuryRepository';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { 
  Wallet, 
  Plus, 
  ArrowRightLeft, 
  Trash2, 
  Edit, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Landmark, 
  CreditCard, 
  Receipt,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

export function AccountsPage() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    account_type: 'cash' as CashAccount['account_type'],
    opening_balance: 0,
  });

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: 0,
    description: '',
  });

  const loadAccounts = () => {
    if (businessId) {
      const list = TreasuryRepository.getAccounts(businessId);
      setAccounts(list);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [businessId]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setAccountForm({
      name: '',
      account_type: 'cash',
      opening_balance: 0,
    });
    setErrorMsg('');
    setShowAccountModal(true);
  };

  const handleOpenEdit = (acc: CashAccount) => {
    setEditingAccount(acc);
    setAccountForm({
      name: acc.name,
      account_type: acc.account_type,
      opening_balance: acc.opening_balance,
    });
    setErrorMsg('');
    setShowAccountModal(true);
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!accountForm.name.trim()) {
      setErrorMsg('لطفاً نام حساب را وارد کنید.');
      return;
    }

    try {
      if (editingAccount) {
        // Edit flow
        TreasuryRepository.updateAccount(editingAccount.id, {
          name: accountForm.name,
          account_type: accountForm.account_type,
          opening_balance: Number(accountForm.opening_balance),
        });
        setSuccessMsg('حساب مالی با موفقیت ویرایش شد.');
      } else {
        // Create flow
        TreasuryRepository.createAccount({
          business_id: businessId,
          name: accountForm.name,
          account_type: accountForm.account_type,
          opening_balance: Number(accountForm.opening_balance),
          current_balance: Number(accountForm.opening_balance),
        });
        setSuccessMsg('حساب مالی جدید با موفقیت ایجاد شد.');
      }
      setShowAccountModal(false);
      loadAccounts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی در ذخیره حساب رخ داد.');
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('آیا از حذف این حساب مالی اطمینان دارید؟')) {
      try {
        const deleted = TreasuryRepository.deleteAccount(id);
        if (deleted) {
          setSuccessMsg('حساب مالی با موفقیت حذف شد.');
          loadAccounts();
          setTimeout(() => setSuccessMsg(''), 4000);
        } else {
          setErrorMsg('امکان حذف این حساب وجود ندارد.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'خطایی رخ داد.');
      }
    }
  };

  const handleOpenTransfer = () => {
    setErrorMsg('');
    setTransferForm({
      fromAccountId: accounts[0]?.id || '',
      toAccountId: accounts[1]?.id || '',
      amount: 0,
      description: '',
    });
    setShowTransferModal(true);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { fromAccountId, toAccountId, amount, description } = transferForm;

    if (!fromAccountId || !toAccountId) {
      setErrorMsg('لطفاً حساب مبدا و مقصد را انتخاب کنید.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setErrorMsg('حساب مبدا و مقصد نمی‌توانند یکسان باشند.');
      return;
    }

    if (amount <= 0) {
      setErrorMsg('مبلغ انتقال باید بیشتر از صفر باشد.');
      return;
    }

    try {
      const success = TreasuryRepository.transferBetweenAccounts(
        businessId,
        fromAccountId,
        toAccountId,
        amount,
        description
      );

      if (success) {
        setSuccessMsg('انتقال وجه با موفقیت انجام شد و تراکنش‌های مربوطه ثبت گردیدند.');
        setShowTransferModal(false);
        loadAccounts();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی در انجام تراکنش انتقال رخ داد.');
    }
  };

  const getAccountIcon = (type: CashAccount['account_type']) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-5 h-5 text-amber-600" />;
      case 'bank':
        return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-indigo-600" />;
      default:
        return <Receipt className="w-5 h-5 text-slate-600" />;
    }
  };

  const getAccountTypeName = (type: CashAccount['account_type']) => {
    switch (type) {
      case 'cash':
        return 'صندوق نقدی';
      case 'bank':
        return 'بانک / حساب جاری';
      case 'card':
        return 'کارت بانکی / پوز';
      default:
        return 'سایر موارد';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="صندوق‌ها و حساب‌های مالی"
        description="تعریف، تخصیص بودجه و رصد لحظه‌ای موجودی بانک‌ها، کارت‌ها و صندوق‌های نقد کسب‌وکار"
        icon={<Wallet className="w-6 h-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRightLeft className="w-4 h-4" />}
              onClick={handleOpenTransfer}
            >
              انتقال بین حساب‌ها
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              تعریف حساب جدید
            </Button>
          </div>
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

      {errorMsg && !showAccountModal && !showTransferModal && (
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

      {/* Accounts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => (
          <div 
            key={acc.id} 
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/50 dark:bg-slate-800/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                  {getAccountIcon(acc.account_type)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{acc.name}</h3>
                  <span className="text-[10px] text-slate-400 block mt-1">{getAccountTypeName(acc.account_type)}</span>
                </div>
              </div>
              <Badge variant="primary">فعال</Badge>
            </div>

            <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-xl p-3.5 space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>موجودی اولیه:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{formatCurrency(acc.opening_balance)} تومان</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">موجودی فعلی:</span>
                <span className={`font-mono font-black text-sm ${acc.current_balance < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                  {formatCurrency(acc.current_balance)} تومان
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/60 mt-1 relative z-10">
              <span className="text-[9px] text-slate-400">شناسه حساب: {acc.id}</span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleOpenEdit(acc)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                  title="ویرایش حساب"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                  title="حذف حساب"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full bg-slate-50/50 border border-slate-100 rounded-2xl p-12 text-center text-slate-400">
            <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-xs font-bold">هیچ حساب یا صندوق مالی تعریف نشده است.</p>
            <p className="text-[10px] text-slate-400 mt-1">با کلیک روی دکمه تعریف حساب جدید، اولین صندوق یا بانک خود را بسازید.</p>
          </div>
        )}
      </div>

      {/* --- ADD / EDIT ACCOUNT MODAL --- */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setShowAccountModal(false)} 
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-950 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span>{editingAccount ? 'ویرایش مشخصات حساب مالی' : 'تعریف حساب / صندوق مالی جدید'}</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAccountSubmit} className="space-y-4 text-right">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">نام حساب یا صندوق <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مانند: بانک ملت شعبه مرکزی، صندوق نقدی ارزی و ..."
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">نوع حساب مالی <span className="text-rose-500">*</span></label>
                <select
                  value={accountForm.account_type}
                  onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value as CashAccount['account_type'] })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="cash">صندوق نقدی (کشو / گاوصندوق)</option>
                  <option value="bank">بانک / حساب جاری متصل به دسته چک</option>
                  <option value="card">کارت بانکی / دستگاه پوزفروشگاهی</option>
                  <option value="other">سایر موارد / حساب‌های موقت</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">موجودی اولیه (تومان)</label>
                <input
                  type="number"
                  value={accountForm.opening_balance}
                  onChange={(e) => setAccountForm({ ...accountForm, opening_balance: Number(e.target.value) })}
                  disabled={!!editingAccount}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 font-mono text-left disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!editingAccount && (
                  <span className="text-[10px] text-slate-400">موجودی اولیه حساب را بعد از ثبت نهایی نمی‌توانید تغییر دهید.</span>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAccountModal(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {editingAccount ? 'ثبت ویرایش' : 'ایجاد حساب مالی'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ATOMIC TRANSFER MODAL --- */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setShowTransferModal(false)} 
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-950 dark:text-slate-100 mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              <span>انتقال وجه بین حساب‌ها (کاردکس اتمیک)</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-right">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">حساب یا صندوق مبدا (برداشت) <span className="text-rose-500">*</span></label>
                <select
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">انتخاب کنید...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (موجودی: {formatCurrency(acc.current_balance)} تومان)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">حساب یا صندوق مقصد (واریز) <span className="text-rose-500">*</span></label>
                <select
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="">انتخاب کنید...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (موجودی: {formatCurrency(acc.current_balance)} تومان)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">مبلغ انتقال (تومان) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  required
                  min={1}
                  value={transferForm.amount || ''}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: Number(e.target.value) })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 font-mono text-left"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">توضیحات بابت انتقال</label>
                <textarea
                  placeholder="مثال: واریز نقدینگی صندوق به حساب جاری بانک ملی"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransferModal(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  تایید و انتقال اتمیک
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
