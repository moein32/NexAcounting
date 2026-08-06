import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { biService, FinancialCommitment } from '../../../services/biService';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { Calendar, Plus, CheckCircle, CreditCard, Loader2, ArrowLeftRight, Trash2, AlertCircle } from 'lucide-react';
import { TreasuryRepository } from '../../../repositories/treasuryRepository';

interface CommitmentsSchedulerProps {
  businessId: string;
  onRefresh: () => void;
}

export function CommitmentsScheduler({ businessId, onRefresh }: CommitmentsSchedulerProps) {
  const [commitments, setCommitments] = useState<FinancialCommitment[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<FinancialCommitment['category']>('other');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Pay Dialog State
  const [payingCommitment, setPayingCommitment] = useState<FinancialCommitment | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const loadData = () => {
    const list = biService.getFinancialCommitments(businessId);
    setCommitments(list);
    const accounts = TreasuryRepository.getAccounts(businessId);
    setCashAccounts(accounts);
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [businessId]);

  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) return;

    biService.addFinancialCommitment(businessId, {
      name,
      amount: Number(amount),
      due_date: dueDate,
      category,
      status: 'unpaid',
      is_recurring: isRecurring,
      recurrence_period: isRecurring ? recurrencePeriod : undefined
    });

    // Reset Form
    setName('');
    setAmount('');
    setDueDate('');
    setCategory('other');
    setIsRecurring(false);
    setShowAddForm(false);
    
    loadData();
    onRefresh();
  };

  const handleMarkAsPaid = () => {
    if (!payingCommitment || !selectedAccountId) return;

    biService.updateCommitmentStatus(businessId, payingCommitment.id, 'paid', selectedAccountId);
    setPayingCommitment(null);
    loadData();
    onRefresh();
  };

  const handleDelete = (id: string) => {
    const list = commitments.filter(c => c.id !== id);
    biService.saveFinancialCommitments(businessId, list);
    loadData();
    onRefresh();
  };

  const categoriesPersian = {
    rent: 'اجاره‌بها',
    insurance: 'بیمه تامین اجتماعی',
    salary: 'حقوق و دستمزد',
    utilities: 'قبوض و خدماتی',
    loan: 'اقساط وام',
    other: 'سایر تعهدات'
  };

  return (
    <div className="space-y-6">
      {/* Add & List Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>تقویم زمان‌بندی و مدیریت تعهدات مالی دوره‌ای</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">برنامه‌ریزی، کنترل سررسید اجاره‌بها، بیمه، حقوق و اقساط وام</p>
        </div>
        <Button
          variant={showAddForm ? "outline" : "primary"}
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          icon={<Plus className="w-4 h-4" />}
        >
          {showAddForm ? 'انصراف' : 'ثبت تعهد مالی جدید'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-blue-100 dark:border-blue-900/30">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-blue-600">تعریف تعهد مالی (موعد مقرر پرداخت)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCommitment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">عنوان تعهد</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اجاره دفتر فروردین"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">مبلغ تعهد (تومان)</label>
                <input
                  type="number"
                  required
                  placeholder="مبلغ به تومان"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">تاریخ سررسید (میلادی)</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">دسته‌بندی موضوعی</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="rent">اجاره‌بها</option>
                  <option value="insurance">بیمه پرسنل</option>
                  <option value="salary">حقوق و دستمزد</option>
                  <option value="utilities">قبوض خدماتی</option>
                  <option value="loan">اقساط وام بانک</option>
                  <option value="other">سایر موارد</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded"
                />
                <label htmlFor="isRecurring" className="font-bold text-slate-700">این یک تعهد مالی دوره‌ای و تکرارشونده است</label>
              </div>

              {isRecurring && (
                <div className="space-y-1 sm:col-span-1">
                  <label className="font-semibold text-slate-500">بازه تکرار</label>
                  <select
                    value={recurrencePeriod}
                    onChange={(e) => setRecurrencePeriod(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="monthly">ماهانه</option>
                    <option value="yearly">سالانه</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-4 flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm">ذخیره و ثبت در تقویم مالی</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Commitments List with Calendar Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle: Timeline Calendar Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">زمان‌بندی سررسیدها به ترتیب تاریخ</CardTitle>
              <CardDescription>بررسی تعهدات فعال و گذشته</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {commitments.length > 0 ? (
                  commitments
                    .sort((a, b) => a.due_date.localeCompare(b.due_date))
                    .map((item) => {
                      const isOverdue = item.status === 'unpaid' && new Date(item.due_date) < new Date();
                      return (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-xs">
                          <div className="flex items-start gap-3 truncate">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              item.status === 'paid' 
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' 
                                : isOverdue 
                                  ? 'bg-rose-50 dark:bg-rose-950 text-rose-600' 
                                  : 'bg-amber-50 dark:bg-amber-950 text-amber-600'
                            }`}>
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 truncate">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</span>
                                <Badge variant={item.status === 'paid' ? 'success' : isOverdue ? 'danger' : 'warning'}>
                                  {item.status === 'paid' ? 'پرداخت شده' : isOverdue ? 'سررسید گذشته' : 'در انتظار پرداخت'}
                                </Badge>
                                {item.is_recurring && (
                                  <Badge variant="neutral">دوره: {item.recurrence_period === 'monthly' ? 'ماهانه' : 'سالانه'}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span>دسته: {categoriesPersian[item.category]}</span>
                                <span>•</span>
                                <span className="font-bold text-slate-500">موعد سررسید: {formatPersianDate(item.due_date)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="font-black text-slate-900 dark:text-slate-100">
                              {formatCurrency(item.amount, 'تومان')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {item.status === 'unpaid' && (
                                <Button
                                  variant="primary"
                                  size="xs"
                                  onClick={() => setPayingCommitment(item)}
                                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                                  className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                                >
                                  تسویه نهایی
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleDelete(item.id)}
                                icon={<Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />}
                                className="p-1 border-0 hover:bg-slate-100"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">تعهد مالی ثبت‌شده‌ای وجود ندارد.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Planner Help */}
        <div className="lg:col-span-1">
          <Card className="h-full bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-sm font-bold">هوشمندی پرداخت در خزانه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="flex gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-blue-600 shrink-0" />
                <p>وقتی یک تعهد مالی را به عنوان <strong>تسویه نهایی</strong> علامت می‌زنید، سیستم به صورت خودکار یک سند خروجی وجه در خزانه صادر کرده و تراز حساب نقدی انتخابی شما را کاهش می‌دهد.</p>
              </div>
              <div className="flex gap-2.5">
                <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p>تعهدات به صورت کاملاً آفلاین و ایمن فقط در دیتابیس لوکال دستگاه شما نگهداری می‌شوند و برای محاسبات سود و زیان آتی قابل بهره‌برداری هستند.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pay Commitment Modal/Dialog */}
      {payingCommitment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in-50 zoom-in-95">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">تسویه و پرداخت تعهد مالی</CardTitle>
              <CardDescription>تعیین حساب خزانه‌داری جهت پرداخت وجه</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <p className="font-bold text-slate-950 dark:text-slate-100">{payingCommitment.name}</p>
                <p className="font-black text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(payingCommitment.amount, 'تومان')}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600">پرداخت از کدام صندوق/بانک انجام شود؟</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {cashAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (موجودی: {formatCurrency(acc.current_balance, 'تومان')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setPayingCommitment(null)}>
                  انصراف
                </Button>
                <Button variant="primary" size="sm" onClick={handleMarkAsPaid} className="bg-emerald-600 hover:bg-emerald-700">
                  تایید پرداخت و کسر از خزانه
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
