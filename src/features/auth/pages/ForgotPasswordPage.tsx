import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Mail, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('لطفاً آدرس ایمیل خود را وارد نمایید.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage('لینک بازیابی رمز عبور با موفقیت به ایمیل شما ارسال شد.');
    } catch (err: any) {
      setErrorMessage(err.message || 'خطا در ارسال لینک بازیابی.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold">بازیابی رمز عبور</CardTitle>
            <CardDescription className="text-xs">
              ایمیل حساب کاربری خود را وارد کنید تا لینک بازیابی ارسال شود
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="ایمیل حساب کاربری"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                required
                className="dir-ltr text-left"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                ارسال لینک بازیابی
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به صفحه ورود</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
