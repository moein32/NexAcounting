import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../../../stores/authStore';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import {
  Building2,
  Lock,
  User,
  Phone,
  Coins,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Check,
  Delete,
  Sparkles,
  KeyRound,
  Laptop
} from 'lucide-react';
import { OTPService, DeviceRegistrationService, BiometricManager } from '../services/authServices';

export function LoginPage() {
  const navigate = useNavigate();
  const { isConfigured, initializeAuth, localSetupBusiness, localSignInWithPIN, developerLogin } = useAuthStore();

  const [wizardStep, setWizardStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Installation Flow Fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [currency, setCurrency] = useState('تومان');
  const [setupPin, setSetupPin] = useState('');
  const [setupPinConfirm, setSetupPinConfirm] = useState('');

  // Login PIN Fields
  const [enteredPin, setEnteredPin] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Detect dev environment
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Keypad Handlers
  const handlePinDigit = (digit: string) => {
    if (enteredPin.length < 6) {
      const newVal = enteredPin + digit;
      setEnteredPin(newVal);
      if (newVal.length >= 4) {
        handleLocalLogin(newVal);
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin(enteredPin.slice(0, -1));
  };

  const handleLocalLogin = async (pinValue: string) => {
    setErrorMessage(null);
    setLoginLoading(true);
    try {
      const success = await localSignInWithPIN(pinValue);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        if (pinValue.length >= 4) {
          setErrorMessage('رمز عبور PIN نادرست است. لطفاً مجدداً تلاش کنید.');
          setEnteredPin('');
        }
      }
    } catch {
      setErrorMessage('خطایی در تایید ورود امن محلی رخ داد.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Biometric validation simulator
  const handleFingerprintClick = async () => {
    setErrorMessage(null);
    setLoginLoading(true);
    try {
      const success = await BiometricManager.authenticateBiometric();
      if (success) {
        // Authenticate the user directly
        useAuthStore.setState({ isAuthenticated: true });
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setErrorMessage('امکان تایید هویت بیومتریک در این دستگاه وجود ندارد.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 1: Send OTP SMS
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!phoneNumber || phoneNumber.length < 10) {
      setErrorMessage('لطفاً یک شماره تلفن همراه معتبر وارد کنید.');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await OTPService.sendOTP(phoneNumber);
      if (response.success) {
        setInfoMessage(`کد تایید پیامکی ارسال شد (توسعه‌دهندگان: به کنسول مرورگر مراجعه کنید یا از کد ۱۱۲۲۳۳ استفاده کنید).`);
        setWizardStep(2);
      } else {
        setErrorMessage('خطا در ارسال پیامک فعال‌سازی.');
      }
    } catch {
      setErrorMessage('خطایی رخ داد.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!otpCode || otpCode.length < 4) {
      setErrorMessage('لطفاً کد تایید را وارد کنید.');
      return;
    }

    setLoginLoading(true);
    try {
      const verified = await OTPService.verifyOTP(phoneNumber, otpCode);
      if (verified) {
        await DeviceRegistrationService.registerDevice(phoneNumber);
        setWizardStep(3);
      } else {
        setErrorMessage('کد وارد شده اشتباه است. مجدداً تلاش کنید.');
      }
    } catch {
      setErrorMessage('خطایی در تایید رخ داد.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 3: Profile & Business Setup
  const handleBusinessSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!businessName.trim() || !managerName.trim()) {
      setErrorMessage('لطفاً تمامی فیلدهای الزامی را تکمیل کنید.');
      return;
    }

    setWizardStep(4);
  };

  // Step 4: PIN Security Setup
  const handleFinalSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (setupPin !== setupPinConfirm) {
      setErrorMessage('رمز PIN وارد شده با تکرار آن همخوانی ندارد.');
      return;
    }

    if (setupPin.length < 4 || setupPin.length > 6) {
      setErrorMessage('گذرواژه PIN باید بین ۴ تا ۶ رقم باشد.');
      return;
    }

    setLoginLoading(true);
    try {
      await localSetupBusiness({
        name: businessName,
        manager_name: managerName,
        phone: phoneNumber,
        currency,
        pin_code: setupPin
      });
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setErrorMessage('خطا در ذخیره‌سازی اطلاعات کسب‌وکار جدید در SQLite.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Developer Quick Demo Login
  const handleDeveloperLogin = async () => {
    setErrorMessage(null);
    const success = await developerLogin();
    if (success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage('خطایی در ورود سریع توسعه‌دهندگان رخ داد.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden font-sans">
      {/* Dynamic Aesthetic Background Blurs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* App Logo and Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            سامانه هوشمند مالی NexJib (نکس‌جیب)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            حسابداری امن، آفلاین‌محور و مدیریت زنجیره تامین بر روی مرورگر شما
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {isConfigured ? (
          /* --- PIN LOCKSCREEN VIEW (ALREADY CONFIGURED) --- */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">ورود امن آفلاین</CardTitle>
                <CardDescription className="text-xs">
                  رمز عبور PIN برنامه را جهت بازگشایی دیتابیس مالی وارد کنید
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Visual PIN Dots */}
                <div className="flex justify-center gap-4 py-2 dir-ltr" dir="ltr">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div
                      key={num}
                      className={`w-4 h-4 rounded-full border transition-all duration-150 ${
                        enteredPin.length >= num
                          ? 'bg-blue-600 border-blue-600 scale-125 shadow-sm shadow-blue-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Keypad Layout */}
                <div className="grid grid-cols-3 gap-3 dir-ltr" dir="ltr">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinDigit(digit)}
                      className="h-12 flex items-center justify-center text-lg font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-800 dark:text-slate-100"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleFingerprintClick}
                    className="h-12 flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/80 active:scale-95 transition-all"
                  >
                    <Fingerprint className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinDigit('0')}
                    className="h-12 flex items-center justify-center text-lg font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-800 dark:text-slate-100"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinBackspace}
                    className="h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {loginLoading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>درحال بازگشایی و بارگیری دیتابیس محلی...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* --- FIRST-TIME SETUP WIZARD (NOT CONFIGURED YET) --- */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-xl border-slate-200/80 dark:border-slate-800">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4].map((stepNum) => (
                    <div
                      key={stepNum}
                      className={`h-1.5 w-8 rounded-full transition-all ${
                        wizardStep === stepNum ? 'bg-blue-600 w-12' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {wizardStep === 1 && 'ورود با شماره همراه'}
                  {wizardStep === 2 && 'کد تایید فعال‌سازی'}
                  {wizardStep === 3 && 'مشخصات کسب‌وکار'}
                  {wizardStep === 4 && 'تنظیم رمز PIN امنیتی'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {wizardStep === 1 && 'شماره همراه خود را جهت دریافت کد تایید امنیتی وارد کنید'}
                  {wizardStep === 2 && 'کد ۶ رقمی ارسال شده به تلفن همراه خود را وارد کنید'}
                  {wizardStep === 3 && 'مشخصات کسب‌وکار خود را جهت ساخت دیتابیس محلی SQLite وارد کنید'}
                  {wizardStep === 4 && 'رمز ورود ۴ تا ۶ رقمی برای حفاظت از اطلاعات مالی ایجاد کنید'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* STEP 1: Phone Entry */}
                {wizardStep === 1 && (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <Input
                      label="شماره تلفن همراه (الزامی)"
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      icon={<Phone className="w-4 h-4 text-slate-400" />}
                      required
                      className="dir-ltr text-left tracking-wider"
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loginLoading}
                      icon={<ChevronLeft className="w-4 h-4" />}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 border-none text-white shadow-md shadow-blue-500/20"
                    >
                      {loginLoading ? 'درحال ارسال...' : 'ارسال کد فعال‌سازی'}
                    </Button>
                  </form>
                )}

                {/* STEP 2: OTP SMS Code */}
                {wizardStep === 2 && (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <Input
                      label="کد ۶ رقمی پیامک شده"
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      icon={<KeyRound className="w-4 h-4 text-slate-400" />}
                      required
                      className="dir-ltr text-left tracking-widest text-center font-bold"
                    />

                    <div className="flex gap-2.5 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setWizardStep(1)}
                        className="w-1/3"
                      >
                        بازگشت
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loginLoading}
                        icon={<ChevronLeft className="w-4 h-4" />}
                        className="w-2/3 bg-blue-600 hover:bg-blue-700 border-none text-white shadow-md shadow-blue-500/20"
                      >
                        تایید و ادامه
                      </Button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Business Information */}
                {wizardStep === 3 && (
                  <form onSubmit={handleBusinessSetupSubmit} className="space-y-4">
                    <Input
                      label="نام فروشگاه / کسب‌وکار (الزامی)"
                      type="text"
                      placeholder="مانند: فروشگاه قطعات یدکی پایتخت"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      icon={<Building2 className="w-4 h-4 text-slate-400" />}
                      required
                    />

                    <Input
                      label="نام و نام خانوادگی مدیر (الزامی)"
                      type="text"
                      placeholder="مانند: امیرحسین رضایی"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      icon={<User className="w-4 h-4 text-slate-400" />}
                      required
                    />

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        واحد پول پیش‌فرض دیتابیس
                      </label>
                      <div className="relative">
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 transition-all"
                        >
                          <option value="تومان">تومان (رایج ایران)</option>
                          <option value="ریال">ریال</option>
                          <option value="دلار">دلار (USD)</option>
                        </select>
                        <Coins className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      icon={<ChevronLeft className="w-4 h-4" />}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 border-none text-white shadow-md shadow-blue-500/20"
                    >
                      مرحله بعد (امنیت)
                    </Button>
                  </form>
                )}

                {/* STEP 4: PIN Security */}
                {wizardStep === 4 && (
                  <form onSubmit={handleFinalSetupSubmit} className="space-y-4">
                    <Input
                      label="گذرواژه PIN برنامه (۴ تا ۶ رقم عددی)"
                      type="password"
                      placeholder="••••"
                      value={setupPin}
                      onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      icon={<Lock className="w-4 h-4 text-slate-400" />}
                      className="dir-ltr text-left tracking-widest font-black text-center"
                      required
                    />

                    <Input
                      label="تکرار رمز عبور PIN"
                      type="password"
                      placeholder="••••"
                      value={setupPinConfirm}
                      onChange={(e) => setSetupPinConfirm(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      icon={<ShieldCheck className="w-4 h-4 text-slate-400" />}
                      className="dir-ltr text-left tracking-widest font-black text-center"
                      required
                    />

                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                        این PIN فقط به صورت رمزنگاری شده روی این دستگاه ذخیره می‌شود و برای دسترسی‌های مجدد ضروری است. مسئولیت حفظ امنیت اطلاعات تماماً با مدیر نرم‌افزار است.
                      </p>
                    </div>

                    <div className="flex gap-2.5 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setWizardStep(3)}
                        className="w-1/3"
                      >
                        بازگشت
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loginLoading}
                        icon={<Check className="w-4 h-4" />}
                        className="w-2/3 bg-blue-600 hover:bg-blue-700 border-none text-white shadow-md shadow-blue-500/20"
                      >
                        {loginLoading ? 'درحال ثبت...' : 'ثبت نهایی و ورود'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Development Only Hidden Quick Login Mode */}
        {isDev && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl"
          >
            <div className="flex items-center gap-2 text-[11px] text-indigo-700 dark:text-indigo-300 font-bold">
              <Laptop className="w-4 h-4 text-indigo-500" />
              <span>حالت توسعه‌دهندگان فعال است</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              جهت سرعت‌بخشی به فرآیند تست می‌توانید بدون OTP و دیتای دستی وارد شوید. دیتای تستی کامل مشتریان، کالاها، تراکنش‌ها و اسناد برای شما ساخته خواهد شد.
            </p>
            <button
              onClick={handleDeveloperLogin}
              className="mt-1 px-4 py-1.5 text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm shadow-indigo-500/20 active:scale-95 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ورود سریع دمو توسعه‌دهندگان</span>
            </button>
          </motion.div>
        )}

        <p className="text-center text-[11px] text-slate-400 font-medium">
          سامانه امن NexJib • پایگاه داده محلی SQLite با پایداری تراکنشی
        </p>
      </div>
    </div>
  );
}
