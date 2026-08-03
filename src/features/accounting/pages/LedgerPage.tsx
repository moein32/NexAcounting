import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { AccountingRepository, AccountRepository } from '../../../repositories/accountingRepository';
import { Account, LedgerQueryRow, TrialBalanceRow } from '../../../types/accounting';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { 
  Calculator, 
  Layers, 
  FileSpreadsheet, 
  BookOpen, 
  Clipboard, 
  Search,
  ArrowLeftRight
} from 'lucide-react';

type ActiveTab = 'trial_balance' | 'general_ledger' | 'account_ledger';

export function LedgerPage() {
  const { currentBusiness } = useAppStore();
  const businessId = currentBusiness?.id || 'biz_1';

  const [activeTab, setActiveTab] = useState<ActiveTab>('trial_balance');
  const [moeenAccounts, setMoeenAccounts] = useState<Account[]>([]);
  
  // Ledger States
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([]);
  const [generalLedger, setGeneralLedger] = useState<LedgerQueryRow[]>([]);
  
  // Account Ledger Selection States
  const [selectedMoeenId, setSelectedMoeenId] = useState<string>('');
  const [accountLedger, setAccountLedger] = useState<LedgerQueryRow[]>([]);

  const loadData = () => {
    // 1. Load Moeen Accounts for filter select
    const all = AccountRepository.getAccounts(businessId);
    const moeen = all.filter(a => a.level === 2);
    setMoeenAccounts(moeen);
    if (moeen.length > 0 && !selectedMoeenId) {
      setSelectedMoeenId(moeen[0].id);
    }

    // 2. Load Trial Balance
    const trial = AccountingRepository.getTrialBalance(businessId);
    setTrialBalance(trial);

    // 3. Load General Ledger
    const genLedger = AccountingRepository.getGeneralLedger(businessId);
    setGeneralLedger(genLedger);
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  // Handle Account Ledger selection update
  useEffect(() => {
    if (selectedMoeenId) {
      const ledger = AccountingRepository.getAccountLedger(businessId, selectedMoeenId);
      setAccountLedger(ledger);
    } else {
      setAccountLedger([]);
    }
  }, [selectedMoeenId, businessId]);

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'asset': return 'دارایی';
      case 'liability': return 'بدهی';
      case 'equity': return 'سرمایه';
      case 'revenue': return 'درآمد';
      case 'expense': return 'هزینه';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="دفاتر حسابداری و تراز مالی"
        description="استخراج تراز آزمایشی، گردش دفتر کل روزانه و گردش تفصیلی دفاتر معین حساب‌ها"
        icon={<Calculator className="w-6 h-6 text-indigo-600" />}
      />

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('trial_balance')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'trial_balance'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          تراز آزمایشی چهارستونی
        </button>

        <button
          onClick={() => setActiveTab('general_ledger')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'general_ledger'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          دفتر کل روزانه
        </button>

        <button
          onClick={() => setActiveTab('account_ledger')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'account_ledger'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clipboard className="w-4 h-4" />
          دفتر معین تفصیلی
        </button>
      </div>

      {/* 1. TRIAL BALANCE VIEW */}
      {activeTab === 'trial_balance' && (
        <Card className="border border-slate-100 dark:border-slate-800">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between p-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
              تراز آزمایشی چهارستونی حساب‌ها
            </CardTitle>
            <Badge variant="primary" size="sm">تراز دو طرفه موازنه</Badge>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/30 text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                  <th className="p-4">کد حساب</th>
                  <th className="p-4">نام حساب</th>
                  <th className="p-4">ماهیت</th>
                  <th className="p-4 text-left">گردش بدهکار</th>
                  <th className="p-4 text-left">گردش بستانکار</th>
                  <th className="p-4 text-left">مانده بدهکار</th>
                  <th className="p-4 text-left">مانده بستانکار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trialBalance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 italic">هیچ تراکنش مالی تاییدشده‌ای در سیستم ثبت نشده است.</td>
                  </tr>
                ) : (
                  trialBalance.map((row) => (
                    <tr key={row.account_id} className={`hover:bg-slate-50/20 text-slate-700 dark:text-slate-300 ${row.level === 1 ? 'font-black bg-slate-50/50' : ''}`}>
                      <td className="p-4 font-bold">{row.code}</td>
                      <td className="p-4">{row.name}</td>
                      <td className="p-4">
                        <Badge variant={row.level === 1 ? 'primary' : 'neutral'} size="sm">
                          {getAccountTypeLabel(row.account_type)}
                        </Badge>
                      </td>
                      <td className="p-4 text-left text-slate-600">
                        {row.debitSum > 0 ? formatCurrency(row.debitSum) : '۰'}
                      </td>
                      <td className="p-4 text-left text-slate-600">
                        {row.creditSum > 0 ? formatCurrency(row.creditSum) : '۰'}
                      </td>
                      <td className="p-4 text-left text-emerald-600 font-bold">
                        {row.debitBalance > 0 ? formatCurrency(row.debitBalance) : '۰'}
                      </td>
                      <td className="p-4 text-left text-rose-600 font-bold">
                        {row.creditBalance > 0 ? formatCurrency(row.creditBalance) : '۰'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 2. GENERAL LEDGER VIEW */}
      {activeTab === 'general_ledger' && (
        <Card className="border border-slate-100 dark:border-slate-800">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-4">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
              گردش زمانی آرتیکل‌های دفتر کل
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/30 text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                  <th className="p-4">تاریخ</th>
                  <th className="p-4">سند</th>
                  <th className="p-4">کد معین</th>
                  <th className="p-4">حساب معین</th>
                  <th className="p-4">شرح آرتیکل مالی</th>
                  <th className="p-4 text-left">بدهکار</th>
                  <th className="p-4 text-left">بستانکار</th>
                  <th className="p-4 text-left">مانده کل (تجمعی)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {generalLedger.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 italic">هیچ گردشی در دفتر کل ثبت نشده است.</td>
                  </tr>
                ) : (
                  generalLedger.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20 text-slate-700 dark:text-slate-300">
                      <td className="p-4">{formatPersianDate(row.date)}</td>
                      <td className="p-4 font-bold">#{row.entry_number}</td>
                      <td className="p-4 font-mono text-slate-500">{row.account_code}</td>
                      <td className="p-4 font-bold">{row.account_name}</td>
                      <td className="p-4">{row.description}</td>
                      <td className="p-4 text-left text-emerald-600 font-bold">
                        {row.debit > 0 ? formatCurrency(row.debit) : '۰'}
                      </td>
                      <td className="p-4 text-left text-rose-600 font-bold">
                        {row.credit > 0 ? formatCurrency(row.credit) : '۰'}
                      </td>
                      <td className={`p-4 text-left font-black ${row.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600'}`}>
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 3. ACCOUNT LEDGER VIEW */}
      {activeTab === 'account_ledger' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <Card className="border border-slate-100 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">انتخاب حساب معین جهت گزارش‌گیری:</span>
                </div>
                
                <select
                  value={selectedMoeenId}
                  onChange={(e) => setSelectedMoeenId(e.target.value)}
                  className="w-full sm:w-80 text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- انتخاب حساب --</option>
                  {moeenAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.code}] {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Running Card Ledger Table */}
          {selectedMoeenId && (
            <Card className="border border-slate-100 dark:border-slate-800">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between flex-row">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  گردش معین: {moeenAccounts.find(a => a.id === selectedMoeenId)?.name}
                </CardTitle>
                <Badge variant="primary" size="sm">
                  ماهیت نرمال: {moeenAccounts.find(a => a.id === selectedMoeenId)?.account_type === 'asset' || moeenAccounts.find(a => a.id === selectedMoeenId)?.account_type === 'expense' ? 'بدهکار عادی' : 'بستانکار عادی'}
                </Badge>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50/30 text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                      <th className="p-4">تاریخ سند</th>
                      <th className="p-4">شماره سند</th>
                      <th className="p-4">شرح آرتیکل</th>
                      <th className="p-4 text-left">بدهکار (Debit)</th>
                      <th className="p-4 text-left">بستانکار (Credit)</th>
                      <th className="p-4 text-left">مانده معین</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {accountLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">هیچ گردشی برای این حساب معین در دفاتر روزنامه یافت نشد.</td>
                      </tr>
                    ) : (
                      accountLedger.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 text-slate-700 dark:text-slate-300">
                          <td className="p-4">{formatPersianDate(row.date)}</td>
                          <td className="p-4 font-bold">#{row.entry_number}</td>
                          <td className="p-4">{row.description}</td>
                          <td className="p-4 text-left text-emerald-600 font-bold">
                            {row.debit > 0 ? formatCurrency(row.debit) : '۰'}
                          </td>
                          <td className="p-4 text-left text-rose-600 font-bold">
                            {row.credit > 0 ? formatCurrency(row.credit) : '۰'}
                          </td>
                          <td className="p-4 text-left font-black text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(row.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
