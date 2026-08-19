import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Building2, UserPlus, User, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !email || !password || !businessName) {
      setErrorMessage('لطفاً تمامی فیلدهای الزامی را تکمیل کنید.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        fullName,
        email,
        password,
        businessName,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ثبت‌نام و ایجاد کسب‌وکار.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Subtle Blur */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10 my-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            ثبت‌نام در NexJib (نکس‌جیب)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            راه‌اندازی فوری سازمان، حساب کاربری و کسب‌وکار جدید
          </p>
        </div>

        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg font-bold">ایجاد حساب کاربری و کسب‌وکار جدید</CardTitle>
            <CardDescription className="text-xs">
              مشخصات خود و اولین شرکت یا فروشگاه خود را وارد نمایید
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">
                  ۱. اطلاعات مدیر کسب‌وکار
                </span>
                <Input
                  label="نام و نام خانوادگی مدیر"
                  placeholder="مثال: علی محمدی"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  icon={<User className="w-4 h-4 text-slate-400" />}
                  required
                />
                <Input
                  label="ایمیل"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                  className="dir-ltr text-left"
                />
              </div>

              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block">
                  ۲. اطلاعات اولین کسب‌وکار / شرکت
                </span>
                <Input
                  label="نام شرکت یا مجموعه تجاری"
                  placeholder="مثال: بازرگانی پارس گستر"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  icon={<Building2 className="w-4 h-4 text-slate-400" />}
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  ۳. امنیت حساب
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="رمز عبور"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    required
                    className="dir-ltr text-left"
                  />
                  <Input
                    label="تکرار رمز عبور"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    required
                    className="dir-ltr text-left"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={<UserPlus className="w-4 h-4" />}
                className="w-full mt-2"
              >
                ثبت‌نام و ایجاد کسب‌وکار
              </Button>
            </form>

            <div className="text-center pt-2 text-xs text-slate-500">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                ورود به حساب کاربری
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
