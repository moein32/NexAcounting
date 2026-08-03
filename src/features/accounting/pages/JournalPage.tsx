import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { 
  JournalRepository, 
  AccountRepository 
} from '../../../repositories/accountingRepository';
import { JournalEntry, JournalLine, Account } from '../../../types/accounting';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { 
  Calculator, 
  Plus, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Info,
  Calendar,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function JournalPage() {
  const { currentBusiness } = useAppStore();
  const businessId = currentBusiness?.id || 'biz_1';
  const [searchParams, setSearchParams] = useSearchParams();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linesMap, setLinesMap] = useState<Record<string, JournalLine[]>>({});
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Manual Entry Form State
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDescription, setManualDescription] = useState('');
  const [manualLines, setManualLines] = useState<Array<{
    account_code: string;
    debit: number;
    credit: number;
    description: string;
  }>>([
    { account_code: '', debit: 0, credit: 0, description: '' },
    { account_code: '', debit: 0, credit: 0, description: '' },
  ]);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    const fetchedEntries = JournalRepository.getEntries(businessId);
    setEntries(fetchedEntries);

    const fetchedAccounts = AccountRepository.getAccounts(businessId).filter(a => a.level === 2); // Only Level 2 (Moeen) can accept journal transactions
    setAccounts(fetchedAccounts);

    // Load lines for all entries to calculate totals and show nested details
    const map: Record<string, JournalLine[]> = {};
    fetchedEntries.forEach(e => {
      map[e.id] = JournalRepository.getLinesForEntry(e.id);
    });
    setLinesMap(map);
  };

  useEffect(() => {
    loadData();
    // Support navigate with query parameters (e.g. ?action=new)
    if (searchParams.get('action') === 'new') {
      setIsAddingManual(true);
      setSearchParams({});
    }
  }, [businessId]);

  // Compute entry totals
  const getEntryTotals = (entryId: string) => {
    const lines = linesMap[entryId] || [];
    const debit = lines.reduce((sum, l) => sum + l.debit, 0);
    const credit = lines.reduce((sum, l) => sum + l.credit, 0);
    return { debit, credit };
  };

  const getRefTypeLabel = (type: string) => {
    switch (type) {
      case 'sales_invoice': return 'فاکتور فروش';
      case 'purchase_invoice': return 'فاکتور خرید';
      case 'receipt': return 'دریافت نقدی';
      case 'payment': return 'پرداخت نقدی';
      case 'inventory': return 'تغییر موجودی';
      case 'manual': return 'ثبت دستی';
      default: return 'سند حسابداری';
    }
  };

  const handleReverse = (id: string) => {
    if (window.confirm('آیا از ابطال این سند حسابداری اطمینان دارید؟ سیستم یک سند حسابداری معکوس (آرتیکل اصلاحی) برای خنثی‌سازی ثبت خواهد کرد.')) {
      try {
        JournalRepository.reverseEntry(id, businessId);
        loadData();
      } catch (e: any) {
        alert(e.message || 'خطایی رخ داد.');
      }
    }
  };

  // MANUAL FORM HANDLERS
  const handleAddLineRow = () => {
    setManualLines([...manualLines, { account_code: '', debit: 0, credit: 0, description: '' }]);
  };

  const handleRemoveLineRow = (index: number) => {
    if (manualLines.length <= 2) {
      alert('حداقل وجود دو ردیف سند دوبل برای موازنه حساب الزامی است.');
      return;
    }
    setManualLines(manualLines.filter((_, idx) => idx !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...manualLines];
    if (field === 'debit') {
      updated[index].debit = Number(value) || 0;
      if (updated[index].debit > 0) updated[index].credit = 0; // standard double entry line lock
    } else if (field === 'credit') {
      updated[index].credit = Number(value) || 0;
      if (updated[index].credit > 0) updated[index].debit = 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setManualLines(updated);
  };

  // Live balance computations
  const totalDebits = manualLines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = manualLines.reduce((sum, l) => sum + l.credit, 0);
  const diff = Math.abs(totalDebits - totalCredits);
  const isBalanced = diff < 0.01 && totalDebits > 0;

  const handleSaveManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!manualDescription.trim()) {
      setFormError('شرح کلی سند الزامی است.');
      return;
    }

    // Filter out blank accounts
    const validLines = manualLines.filter(l => l.account_code);
    if (validLines.length < 2) {
      setFormError('لطفاً حداقل برای دو آرتیکل، حساب معین انتخاب کنید.');
      return;
    }

    if (!isBalanced) {
      setFormError(`سند تراز نیست. مجموع بدهکار (${formatCurrency(totalDebits)}) با بستانکار (${formatCurrency(totalCredits)}) تفاوت دارد.`);
      return;
    }

    try {
      JournalRepository.createEntry(
        {
          business_id: businessId,
          date: manualDate,
          description: manualDescription.trim(),
          reference_type: 'manual',
          reference_id: null,
          status: 'posted',
          entry_number: 0,
        },
        validLines.map(vl => ({
          account_id: accounts.find(a => a.code === vl.account_code)!.id,
          party_id: null,
          debit: vl.debit,
          credit: vl.credit,
          description: vl.description || manualDescription,
        }))
      );

      setFormSuccess('سند حسابداری دستی با موفقیت ثبت قطعی شد.');
      setManualDescription('');
      setManualLines([
        { account_code: '', debit: 0, credit: 0, description: '' },
        { account_code: '', debit: 0, credit: 0, description: '' },
      ]);
      loadData();
      
      setTimeout(() => {
        setIsAddingManual(false);
        setFormSuccess('');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'خطایی در ثبت سند رخ داد.');
    }
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter(e => {
    const lower = searchTerm.toLowerCase();
    const matchesDesc = e.description.toLowerCase().includes(lower);
    const matchesNum = e.entry_number.toString().includes(lower);
    const matchesRefType = getRefTypeLabel(e.reference_type).toLowerCase().includes(lower);
    return matchesDesc || matchesNum || matchesRefType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="دفتر روزنامه (Journal Entries)"
        description="لیست کل رویدادهای مالی و اسناد حسابداری دوبل صادر شده در سیستم"
        icon={<Calculator className="w-6 h-6 text-indigo-600" />}
        actions={
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-4 h-4" />} 
            onClick={() => setIsAddingManual(!isAddingManual)}
          >
            {isAddingManual ? 'بستن فرم ثبت دستی' : 'ثبت سند حسابداری جدید'}
          </Button>
        }
      />

      {/* MANUAL ENTRY FORM */}
      {isAddingManual && (
        <Card className="border border-indigo-100 dark:border-indigo-950/60 shadow-md">
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-950">
            <CardTitle className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
              ثبت سند حسابداری دستی (تراز دو طرفه)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveManualEntry} className="space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl flex items-start gap-2 text-xs">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">تاریخ سند</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Input
                    label="شرح کلی سند حسابداری"
                    placeholder="شرحی بابت ثبت این سند بنویسید..."
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* ROWS OF ACCOUNT ARTIKELS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">ردیف‌های سند (آرتیکل‌ها)</h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={handleAddLineRow}
                  >
                    افزودن ردیف بدهکار/بستانکار
                  </Button>
                </div>

                <div className="space-y-3">
                  {manualLines.map((line, idx) => (
                    <div 
                      key={idx} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 items-end"
                    >
                      {/* Account selection */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">حساب معین</label>
                        <select
                          value={line.account_code}
                          onChange={(e) => handleLineChange(idx, 'account_code', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="">-- انتخاب حساب --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.code}>
                              [{acc.code}] {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Debit */}
                      <div className="md:col-span-2.5 space-y-1">
                        <label className="text-[10px] font-bold text-emerald-600 block">مبلغ بدهکار (Debit)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={line.debit || ''}
                          disabled={line.credit > 0}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>

                      {/* Credit */}
                      <div className="md:col-span-2.5 space-y-1">
                        <label className="text-[10px] font-bold text-rose-600 block">مبلغ بستانکار (Credit)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={line.credit || ''}
                          disabled={line.debit > 0}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>

                      {/* Line description */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400">شرح ردیف</label>
                        <input
                          type="text"
                          placeholder="شرح اختیاری آرتیکل..."
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Remove */}
                      <div className="md:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineRow(idx)}
                          className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* TALLIES & BALANCE CHECKER */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <div>
                    مجموع بدهکار: <span className="text-emerald-600">{formatCurrency(totalDebits)}</span>
                  </div>
                  <div>
                    مجموع بستانکار: <span className="text-rose-600">{formatCurrency(totalCredits)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                      <Check className="w-4 h-4" />
                      سند متوازن است
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      نامتوازن (اختلاف: {formatCurrency(diff)})
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingManual(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isBalanced}
                >
                  ثبت قطعی سند حسابداری
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* JOURNAL ENTRIES LISTING */}
      <Card className="border border-slate-100 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
            دفتر ثبت رویدادهای روزنامه
          </CardTitle>
          
          {/* Search bar */}
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="جستجو بر اساس شرح یا شماره سند..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              هیچ سند حسابداری منطبق با جستجو یافت نشد.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEntries.map(entry => {
                const isExpanded = expandedEntryId === entry.id;
                const lines = linesMap[entry.id] || [];
                const totals = getEntryTotals(entry.id);

                return (
                  <div key={entry.id} className="p-4 hover:bg-slate-50/30 transition-colors">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs rounded-lg">
                          #{entry.entry_number}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                            {entry.description}
                          </h4>
                          <div className="flex flex-wrap gap-2 items-center mt-1.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatPersianDate(entry.date)}
                            </span>
                            <Badge variant="neutral" size="sm">
                              {getRefTypeLabel(entry.reference_type)}
                            </Badge>
                            {entry.status === 'reversed' ? (
                              <Badge variant="danger" size="sm">ابطال شده</Badge>
                            ) : (
                              <Badge variant="success" size="sm">ثبت قطعی</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Tally & Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 sm:border-0">
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400">مجموع موازنه</p>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(totals.debit)}
                          </p>
                        </div>

                        <div className="flex gap-1.5">
                          {/* Toggle lines */}
                          <button
                            onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title={isExpanded ? 'بستن آرتیکل‌ها' : 'مشاهده آرتیکل‌ها'}
                          >
                            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Reversal action */}
                          {entry.status !== 'reversed' && (
                            <button
                              onClick={() => handleReverse(entry.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                              title="ابطال سند با آرتیکل معکوس"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Lines */}
                    {isExpanded && (
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
                        <h5 className="text-[11px] font-bold text-slate-400 mb-3 block">شرح تفصیلی آرتیکل‌های مالی سند</h5>
                        
                        <table className="w-full text-right text-[11px] border-collapse min-w-[500px]">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
                              <th className="pb-2">حساب معین</th>
                              <th className="pb-2">شرح آرتیکل</th>
                              <th className="pb-2 text-left">بدهکار (Debit)</th>
                              <th className="pb-2 text-left">بستانکار (Credit)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {lines.map((l) => {
                              const acc = AccountRepository.getAccountById(l.account_id);
                              return (
                                <tr key={l.id} className="text-slate-700 dark:text-slate-300">
                                  <td className="py-2.5 font-bold">
                                    [{acc?.code}] {acc?.name}
                                  </td>
                                  <td className="py-2.5">{l.description || entry.description}</td>
                                  <td className="py-2.5 text-left text-emerald-600 font-bold">
                                    {l.debit > 0 ? formatCurrency(l.debit) : '---'}
                                  </td>
                                  <td className="py-2.5 text-left text-rose-600 font-bold">
                                    {l.credit > 0 ? formatCurrency(l.credit) : '---'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
