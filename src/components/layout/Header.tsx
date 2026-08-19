import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { NotificationBadge } from '../../notifications';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  ChevronLeft,
  Building2,
  UserCheck,
  PanelRightClose,
  PanelRightOpen,
  LogOut,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { Badge } from '../ui/Badge';

const routeTitleMap: Record<string, { title: string; parent?: { title: string; path: string } }> = {
  '/dashboard': { title: 'داشبورد مدیریتی' },
  '/sales': { title: 'مدیریت فروش' },
  '/sales/invoices': { title: 'فاکتورهای فروش', parent: { title: 'فروش', path: '/sales' } },
  '/sales/quotations': { title: 'پیش‌فاکتورها', parent: { title: 'فروش', path: '/sales' } },
  '/sales/returns': { title: 'برگشت از فروش', parent: { title: 'فروش', path: '/sales' } },
  '/purchases': { title: 'مدیریت خرید' },
  '/purchases/invoices': { title: 'فاکتورهای خرید', parent: { title: 'خرید', path: '/purchases' } },
  '/purchases/returns': { title: 'برگشت از خرید', parent: { title: 'خرید', path: '/purchases' } },
  '/parties': { title: 'اشخاص و مشتریان' },
  '/parties/customers': { title: 'لیست مشتریان', parent: { title: 'اشخاص', path: '/parties' } },
  '/parties/suppliers': { title: 'لیست تأمین‌کنندگان', parent: { title: 'اشخاص', path: '/parties' } },
  '/products': { title: 'کالاها و خدمات' },
  '/inventory': { title: 'مدیریت انبارداری' },
  '/treasury': { title: 'خزانه و صندوق' },
  '/treasury/receipts': { title: 'دریافت‌های نقدی و غیرنقدی', parent: { title: 'خزانه', path: '/treasury' } },
  '/treasury/payments': { title: 'پرداخت‌های نقدی و غیرنقدی', parent: { title: 'خزانه', path: '/treasury' } },
  '/treasury/accounts': { title: 'حساب‌های بانکی و صندوق', parent: { title: 'خزانه', path: '/treasury' } },
  '/checks': { title: 'مدیریت چک‌ها' },
  '/checks/received': { title: 'چک‌های دریافتی', parent: { title: 'چک‌ها', path: '/checks' } },
  '/checks/issued': { title: 'چک‌های پرداختی', parent: { title: 'چک‌ها', path: '/checks' } },
  '/accounting': { title: 'حسابداری دوبل' },
  '/accounting/chart': { title: 'کدینگ و درخت حساب‌ها', parent: { title: 'حسابداری', path: '/accounting' } },
  '/accounting/journal': { title: 'دفتر روزنامه', parent: { title: 'حسابداری', path: '/accounting' } },
  '/accounting/ledger': { title: 'دفتر کل', parent: { title: 'حسابداری', path: '/accounting' } },
  '/reports': { title: 'گزارش‌های جامع مالی' },
  '/settings': { title: 'تنظیمات سیستم' },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleMobileMenu, toggleSidebarCollapse, sidebarCollapsed, theme, setTheme, setGlobalSearchOpen } = useUIStore();
  const {
    currentBusiness,
    profile,
    user,
    currentRole,
    userMemberships,
    selectBusiness,
    signOut,
  } = useAuthStore();

  useTheme();

  const currentRoute = routeTitleMap[location.pathname] || { title: 'صفحه اصلی' };

  const isDarkTheme =
    theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDarkTheme ? 'light' : 'dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const businessDropdownItems = [
    ...(userMemberships || []).map((m) => ({
      label: m.business?.name || 'کسب‌وکار',
      onClick: () => selectBusiness(m.business_id),
    })),
    {
      label: 'مدیریت و تغییر کسب‌وکار',
      icon: <Building2 className="w-4 h-4 text-blue-600" />,
      divider: true,
      onClick: () => navigate('/select-business'),
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-6 flex items-center justify-between transition-all">
      {/* Right Side: Navigation Toggle & Breadcrumbs & Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="منوی موبایل"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={sidebarCollapsed ? 'باز کردن منو' : 'بستن منو'}
        >
          {sidebarCollapsed ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
        </button>

        {/* Title and Breadcrumb */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
              نکس‌جیب
            </Link>
            {currentRoute.parent && (
              <>
                <ChevronLeft className="w-3 h-3 text-slate-300" />
                <Link to={currentRoute.parent.path} className="hover:text-blue-600 transition-colors">
                  {currentRoute.parent.title}
                </Link>
              </>
            )}
          </div>
          <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            {currentRoute.title}
          </h2>
        </div>
      </div>

      {/* Left Side: Business selector, Search, Notifications, Theme, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Business Selector */}
        {currentBusiness && (
          <div className="hidden sm:block">
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="max-w-[150px] truncate">{currentBusiness.name}</span>
                  <Badge variant="primary" size="sm">
                    {currentBusiness.currency || 'تومان'}
                  </Badge>
                </button>
              }
              items={businessDropdownItems}
            />
          </div>
        )}

        {/* Global Search Button */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="جستجوی سریع (Ctrl + K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          title="تغییر حالت شب / روز"
        >
          {isDarkTheme ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* Notification Bell */}
        <NotificationBadge />

        {/* User Profile */}
        <div className="pr-1 border-r border-slate-200 dark:border-slate-800">
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                    {profile?.full_name || user?.email || 'کاربر سیستم'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {currentRole?.name || 'مالک کسب‌وکار'}
                  </span>
                </div>
              </button>
            }
            items={[
              {
                label: 'تنظیمات حساب کاربری',
                icon: <UserCheck className="w-4 h-4" />,
                onClick: () => navigate('/settings'),
              },
              {
                label: 'مدیریت کسب‌وکارها',
                icon: <Building2 className="w-4 h-4" />,
                onClick: () => navigate('/select-business'),
              },
              {
                label: 'خروج از حساب کاربری',
                icon: <LogOut className="w-4 h-4 text-rose-500" />,
                danger: true,
                divider: true,
                onClick: handleSignOut,
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}

