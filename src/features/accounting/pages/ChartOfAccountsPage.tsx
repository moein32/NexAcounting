import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../../stores/appStore';
import { AccountRepository } from '../../../repositories/accountingRepository';
import { Account, AccountType } from '../../../types/accounting';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Calculator, Plus, Folder, FolderOpen, FileText, Check, AlertCircle, X } from 'lucide-react';

export function ChartOfAccountsPage() {
  const { currentBusiness } = useAppStore();
  const businessId = currentBusiness?.id || 'biz_1';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States
  const [parentAccountId, setParentAccountId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('asset');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAccounts = () => {
    const list = AccountRepository.getAccounts(businessId);
    setAccounts(list);
  };

  useEffect(() => {
    loadAccounts();
  }, [businessId]);

  const level1Accounts = accounts.filter(a => a.level === 1);

  // Auto-set account type when parent is selected
  const handleParentChange = (parentId: string) => {
    setParentAccountId(parentId);
    if (parentId) {
      const parent = accounts.find(a => a.id === parentId);
      if (parent) {
        setAccountType(parent.account_type);
        // Suggest a sub-code starting with parent code
        const siblings = accounts.filter(a => a.parent_id === parentId);
        const nextIndex = (siblings || []).length + 1;
        setCode(`${parent.code}${nextIndex.toString().padStart(2, '0')}`);
      }
    } else {
      setCode('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('عنوان حساب الزامی است.');
      return;
    }
    if (!code.trim()) {
      setError('کد حساب الزامی است.');
      return;
    }

    // Check code uniqueness
    const exists = accounts.some(a => a.code === code);
    if (exists) {
      setError('کد حساب تکراری است. لطفاً از کد دیگری استفاده کنید.');
      return;
    }

    try {
      AccountRepository.createAccount({
        business_id: businessId,
        parent_id: parentAccountId || null,
        code,
        name: name.trim(),
        account_type: accountType,
        level: parentAccountId ? 2 : 1,
        is_active: true,
      });

      setSuccess('حساب جدید با موفقیت به ساختار کدینگ اضافه شد.');
      setName('');
      setCode('');
      setParentAccountId('');
      loadAccounts();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
      }, 1000);
    } catch (e: any) {
      setError(e.message || 'خطایی رخ داد.');
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'asset': return 'دارایی';
      case 'liability': return 'بدهی';
      case 'equity': return 'سرمایه / حقوق صاحبان';
      case 'revenue': return 'درآمد';
      case 'expense': return 'هزینه';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="کدینگ و درخت حساب‌ها (Chart of Accounts)"
        description="تعریف ساختار حساب‌های کل و معین جهت گزارشات دفاتر تراز مالی"
        icon={<Calculator className="w-6 h-6 text-indigo-600" />}
        actions={
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus className="w-4 h-4" />} 
            onClick={() => {
              setIsModalOpen(true);
              setParentAccountId('');
              setCode('');
              setName('');
              setAccountType('asset');
              setError('');
              setSuccess('');
            }}
          >
            تعریف حساب جدید
          </Button>
        }
      />

      {/* Hierarchical Tree of Accounts */}
      <Card className="overflow-hidden border border-slate-100 dark:border-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <CardTitle>درختواره حسابداری دوبل ({currentBusiness.name})</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {(level1Accounts || []).length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-12">در حال بارگذاری ساختار حساب‌ها...</p>
          ) : (
            level1Accounts.map((parent) => {
              const children = accounts.filter(a => a.parent_id === parent.id);
              
              return (
                <div key={parent.id} className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                  {/* Level 1: Kol/Group Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        [{parent.code}] {parent.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {getAccountTypeLabel(parent.account_type)}
                      </Badge>
                      <Badge variant="neutral" size="sm">گروه / کل</Badge>
                    </div>
                  </div>

                  {/* Level 2: Moeen Children */}
                  <div className="pr-6 space-y-2 border-r-2 border-indigo-100 dark:border-indigo-950/60 mr-2.5">
                    {(children || []).length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">هیچ حساب معینی تعریف نشده است.</p>
                    ) : (
                      children.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-xs hover:border-indigo-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              [{sub.code}] {sub.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="success" size="sm">معین فعال</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Define Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-500" />
                تعریف حساب مالی جدید
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl flex items-start gap-2.5 text-xs">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Parent Account Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">حساب والد (کل)</label>
                <select
                  value={parentAccountId}
                  onChange={(e) => handleParentChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- فاقد والد (ایجاد حساب تراز گروه کل) --</option>
                  {(level1Accounts || []).map(a => (
                    <option key={a.id} value={a.id}>
                      [{a.code}] {a.name} ({getAccountTypeLabel(a.account_type)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Type (only if parent is null) */}
              {!parentAccountId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">ماهیت حساب</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="asset">دارایی (Asset)</option>
                    <option value="liability">بدهی (Liability)</option>
                    <option value="equity">سرمایه / حقوق صاحبان (Equity)</option>
                    <option value="revenue">درآمد (Revenue)</option>
                    <option value="expense">هزینه (Expense)</option>
                  </select>
                </div>
              )}

              {/* Account Code */}
              <div className="space-y-1.5">
                <Input
                  label="کد حساب (عددی)"
                  placeholder="مثال: 1050"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  helperText={parentAccountId ? 'کد حساب باید با کد والد آغاز شود.' : 'کد گروه کل اصلی'}
                />
              </div>

              {/* Account Name */}
              <div className="space-y-1.5">
                <Input
                  label="عنوان حساب"
                  placeholder="مثال: صندوق فرعی شعبه شمال"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  ثبت حساب
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
