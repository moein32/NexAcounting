import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  X,
  Building2,
  UserCheck,
  Moon,
  Sun,
  HardDrive,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  Warehouse,
  Landmark,
  CreditCard,
  Calculator,
  BarChart3,
  Database,
  Settings,
  Bell,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useTheme } from '../hooks/useTheme';
import { MOBILE_DRAWER_SECTIONS } from './MobileRoutes';
import { cn } from '../lib/utils';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  Warehouse,
  Landmark,
  CreditCard,
  Calculator,
  BarChart3,
  Database,
  Settings,
  Bell,
};

export const MobileDrawer: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { currentBusiness, profile, user, signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (!mobileMenuOpen) return null;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-fade-in lg:hidden">
      <div className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xs bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-in-right">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black flex items-center justify-center shadow-md text-xs">
                NEX
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  نکس‌جیب
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  نسخه ویژه Android / Tablet
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Info Banner */}
          <div className="p-3 mx-3 my-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                  {currentBusiness?.name || 'کسب‌وکار پیش‌فرض'}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                  {currentBusiness?.currency || 'تومان'}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleNavClick('/settings')}
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-bold shrink-0"
              title="تغییر کسب‌وکار"
            >
              تغییر
            </button>
          </div>

          {/* Nav Sections */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            {MOBILE_DRAWER_SECTIONS.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  {section.title}
                </h4>

                {section.items?.map((item) => {
                  const Icon = iconMap[item.iconName] || LayoutDashboard;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-indigo-50 dark:active:bg-indigo-950/50 transition-colors touch-manipulation text-right min-h-[44px]"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Quick Actions & Theme Switcher */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>حالت روز</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>حالت شب</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleNavClick('/settings')}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span>پشتیبان</span>
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب کاربری</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
