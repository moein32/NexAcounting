import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Building2, LogIn, Lock, Mail, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, enableDemoMode, isDemoMode } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('لطفاً ایمیل و رمز عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ورود به سیستم.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    enableDemoMode();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Blurs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            سامانه ابری NexAccounting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            نرم‌افزار جامع مالی، حسابداری دوبل و انبارداری چندشرکتی
          </p>
        </div>

        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-bold">ورود به حساب کاربری</CardTitle>
            <CardDescription className="text-xs">
              ایمیل و رمز عبور ثبت‌شده خود را وارد نمایید
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
              <Input
                label="آدرس ایمیل"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                required
                className="dir-ltr text-left"
              />

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

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>مرا به خاطر بسپار</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  فراموشی رمز عبور؟
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={<LogIn className="w-4 h-4" />}
                className="w-full mt-2"
              >
                ورود به سامانه
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                  یا
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleDemoLogin}
              icon={<Sparkles className="w-4 h-4 text-amber-500" />}
              className="w-full border-dashed border-slate-300 dark:border-slate-700"
            >
              ورود سریع با حالت پیش‌نمایش / دمو
            </Button>

            <div className="text-center pt-2 text-xs text-slate-500">
              حساب کاربری ندارید؟{' '}
              <Link
                to="/register"
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                ثبت‌نام و تعریف کسب‌وکار جدید
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 font-medium">
          نسخه پیشرفته 2.0 • پشتیبانی از معماری Multi-Tenant و RLS
        </p>
      </div>
    </div>
  );
}
