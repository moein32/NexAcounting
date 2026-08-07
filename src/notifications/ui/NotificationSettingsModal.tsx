/**
 * NexAccounting - Notification Settings Modal
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Moon,
  Clock,
  ShieldCheck,
  Package,
  HardDrive,
  CreditCard,
  Users,
  Settings as SettingsIcon,
  Save,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { NotificationManager } from '../NotificationManager';
import { NotificationPreferences } from '../NotificationTypes';
import { Button } from '../../components/ui/Button';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';

  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    NotificationManager.getPreferences(businessId)
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPrefs(NotificationManager.getPreferences(businessId));
      setSavedSuccess(false);
    }
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  const handleSave = () => {
    NotificationManager.savePreferences(prefs);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تنظیمات هشدارها و اطلاع‌رسانی
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                شخصی‌سازی هشدارهای خودکار سیستم و ساعات سکوت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {savedSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              تنظیمات اطلاع‌رسانی با موفقیت ذخیره شد.
            </div>
          )}

          {/* Alert Categories */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              دسته‌بندی هشدارهای خودکار
            </h4>

            <div className="space-y-3">
              {/* Checks */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      هشدارهای چک و اسناد
                    </span>
                    <p className="text-[11px] text-slate-500">سررسید چک‌های دریافتی/پرداختی و چک‌های برگشتی</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.enable_checks}
                  onChange={() => handleToggle('enable_checks')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Inventory */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      هشدارهای موجودی انبار
                    </span>
                    <p className="text-[11px] text-slate-500">موجودی کم، اتمام موجودی و موجودی منفی</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.enable_inventory}
                  onChange={() => handleToggle('enable_inventory')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Backup */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      یادآوری پشتیبان‌گیری
                    </span>
                    <p className="text-[11px] text-slate-500">هشدار عدم تهیه پشتیبان در مهلت مقرر</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.enable_backup}
                  onChange={() => handleToggle('enable_backup')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Customer / Supplier */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      مانده حساب و بدهی اشخاص
                    </span>
                    <p className="text-[11px] text-slate-500">تخطی از سقف اعتبار و طلب‌های معوقه</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.enable_customer_balance}
                  onChange={() => handleToggle('enable_customer_balance')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Subscription */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-rose-500" />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      هشدارهای اشتراک و سیستم
                    </span>
                    <p className="text-[11px] text-slate-500">اعتبار اشتراک نرم‌افزار و هشدارهای حافظه</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.enable_subscription}
                  onChange={() => handleToggle('enable_subscription')}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ساعات سکوت (Quiet Hours)
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              در طول این ساعات، اعلان‌های صوتی یا پاپ‌آپ غیرضروری نمایش داده نخواهند شد.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  شروع ساعات سکوت
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_start || '22:00'}
                  onChange={(e) => setPrefs({ ...prefs, quiet_hours_start: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  پایان ساعات سکوت
                </label>
                <input
                  type="time"
                  value={prefs.quiet_hours_end || '07:00'}
                  onChange={(e) => setPrefs({ ...prefs, quiet_hours_end: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <Button variant="secondary" onClick={onClose} size="sm">
            انصراف
          </Button>
          <Button onClick={handleSave} size="sm" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            ذخیره تنظیمات
          </Button>
        </div>
      </div>
    </div>
  );
};
