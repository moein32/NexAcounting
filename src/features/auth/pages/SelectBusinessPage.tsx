import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import {
  Building2,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  User,
  LogOut,
  AlertCircle,
} from 'lucide-react';

export function SelectBusinessPage() {
  const navigate = useNavigate();
  const {
    userMemberships,
    currentBusiness,
    selectBusiness,
    createBusiness,
    signOut,
    profile,
    user,
  } = useAuthStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('');
  const [newBizNationalId, setNewBizNationalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelect = (businessId: string) => {
    selectBusiness(businessId);
    navigate('/dashboard', { replace: true });
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newBizName.trim()) {
      setErrorMessage('لطفاً نام کسب‌وکار را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      await createBusiness({
        name: newBizName,
        phone: newBizPhone,
        nationalId: newBizNationalId,
      });
      setShowCreateForm(false);
      setNewBizName('');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ایجاد کسب‌وکار جدید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex items-center justify-center relative">
      <div className="w-full max-w-2xl space-y-6">
        {/* User Info Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {profile?.full_name || user?.email || 'کاربر سیستم'}
              </p>
              <p className="text-[11px] text-slate-400 dir-ltr text-right">
                {user?.email}
              </p>
            </div>
          </div>

          <Button
            variant="flat"
            size="sm"
            onClick={signOut}
            icon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
          >
            خروج از حساب
          </Button>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold">انتخاب کسب‌وکار (Organization / Tenant)</CardTitle>
            <CardDescription className="text-xs">
              جهت ورود به سیستم، کسب‌وکار یا شرکت مورد نظر خود را انتخاب کنید
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {showCreateForm ? (
              <form onSubmit={handleCreateBusiness} className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>تعریف کسب‌وکار جدید</span>
                  </h3>
                  <Button
                    type="button"
                    variant="flat"
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    انصراف
                  </Button>
                </div>

                <Input
                  label="نام کسب‌وکار یا شرکت *"
                  placeholder="مثال: شرکت بازرگانی سپهر"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="شماره تلفن تماس"
                    placeholder="۰۲۱-۸۸۰۰۱۱۲۲"
                    value={newBizPhone}
                    onChange={(e) => setNewBizPhone(e.target.value)}
                  />
                  <Input
                    label="شناسه ملی / کد اقتصادی"
                    placeholder="۱۰۱۰۳۳۹۹"
                    value={newBizNationalId}
                    onChange={(e) => setNewBizNationalId(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="w-full"
                >
                  ثبت و ورود به کسب‌وکار جدید
                </Button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {userMemberships.map((membership) => {
                    const biz = membership.business;
                    const isCurrent = currentBusiness?.id === biz.id;

                    return (
                      <div
                        key={membership.id}
                        onClick={() => handleSelect(biz.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isCurrent
                            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600'
                          }`}>
                            <Building2 className="w-6 h-6" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                {biz.name}
                              </span>
                              {isCurrent && (
                                <Badge variant="primary" size="sm">
                                  کسب‌وکار فعال
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>نقش: {membership.role?.name || 'مالک'}</span>
                              </span>
                              <span>•</span>
                              <span>واحد پول: {biz.currency || 'تومان'}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant={isCurrent ? 'primary' : 'outline'}
                          size="sm"
                          icon={<ArrowLeft className="w-4 h-4" />}
                        >
                          انتخاب
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowCreateForm(true)}
                  icon={<Plus className="w-4 h-4 text-blue-600" />}
                  className="w-full border-dashed mt-2"
                >
                  تعریف و افزودن کسب‌وکار جدید
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
