/**
 * NexAccounting - Notification Center Drawer / Popover Component
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Settings,
  RefreshCw,
  SlidersHorizontal,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { NotificationManager } from '../NotificationManager';
import {
  Notification,
  NotificationCategory,
  NotificationSeverity,
} from '../NotificationTypes';
import { NotificationItem } from './NotificationItem';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import { Button } from '../../components/ui/Button';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<NotificationSeverity | 'ALL'>('ALL');
  const [readStatus, setReadStatus] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const loadNotifications = () => {
    if (!businessId) return;
    const all = NotificationManager.getNotifications(businessId);
    setNotifications(all);
    setUnreadCount(NotificationManager.getUnreadCount(businessId));
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, businessId]);

  useEffect(() => {
    const unsubscribe = NotificationManager.subscribe(() => {
      if (isOpen) {
        loadNotifications();
      }
    });
    return () => unsubscribe();
  }, [isOpen, businessId]);

  if (!isOpen) return null;

  // Filter logic
  const filteredNotifications = notifications.filter((n) => {
    if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
    if (selectedSeverity !== 'ALL' && n.severity !== selectedSeverity) return false;
    if (readStatus === 'UNREAD' && n.is_read) return false;
    if (readStatus === 'READ' && !n.is_read) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    NotificationManager.markAsRead(id, businessId);
  };

  const handleMarkAllAsRead = () => {
    NotificationManager.markAllAsRead(businessId);
  };

  const handleDelete = (id: string) => {
    NotificationManager.delete(id, businessId);
  };

  const handleDeleteRead = () => {
    NotificationManager.deleteRead(businessId);
  };

  const handleRefresh = () => {
    NotificationManager.refreshScheduledChecks(businessId);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-fade-in">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="absolute inset-y-0 left-0 max-w-full flex pl-0 md:pl-10">
          <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-slide-in-left">
            {/* Top Bar Header */}
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      مرکز اعلان‌ها
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-900">
                        {unreadCount.toLocaleString('fa-IR')} جدید
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    مدیریت هشدارها و پیام‌های سیستم
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleRefresh}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="به‌روزرسانی و بررسی مجدد"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="تنظیمات اطلاع‌رسانی"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Filter Controls */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="جستجو در عنوان یا متن اعلان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Tabs: All | Unread | Read */}
              <div className="flex items-center justify-between gap-1 text-xs bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  onClick={() => setReadStatus('ALL')}
                  className={`flex-1 py-1 text-center font-bold rounded-lg transition-all ${
                    readStatus === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  همه ({notifications.length.toLocaleString('fa-IR')})
                </button>
                <button
                  onClick={() => setReadStatus('UNREAD')}
                  className={`flex-1 py-1 text-center font-bold rounded-lg transition-all ${
                    readStatus === 'UNREAD'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  خوانده‌نشده ({unreadCount.toLocaleString('fa-IR')})
                </button>
                <button
                  onClick={() => setReadStatus('READ')}
                  className={`flex-1 py-1 text-center font-bold rounded-lg transition-all ${
                    readStatus === 'READ'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  خوانده‌شده ({(notifications.length - unreadCount).toLocaleString('fa-IR')})
                </button>
              </div>

              {/* Category Filter Pills Horizontal Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'ALL', label: 'همه دسته‌ها' },
                  { id: 'CHECK', label: 'چک‌ها' },
                  { id: 'INVENTORY', label: 'انبار' },
                  { id: 'BACKUP', label: 'پشتیبان' },
                  { id: 'SUBSCRIPTION', label: 'اشتراک' },
                  { id: 'CUSTOMER_BALANCE', label: 'اشخاص' },
                  { id: 'TREASURY', label: 'خزانه' },
                  { id: 'SYSTEM', label: 'سیستم' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Severity Selector Dropdown */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">سطح اهمیت:</span>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value as any)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
                >
                  <option value="ALL">همه سطوح</option>
                  <option value="CRITICAL">بسیار مهم (Critical)</option>
                  <option value="ERROR">خطا (Error)</option>
                  <option value="WARNING">هشدار (Warning)</option>
                  <option value="SUCCESS">موفقیت (Success)</option>
                  <option value="INFO">اطلاعیه (Info)</option>
                </select>
              </div>
            </div>

            {/* Notification List Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                    هیچ اعلانی یافت نشد
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    با توجه به فیلترهای انتخابی یا شرایط جاری سیستم، هیچ اعلانی وجود ندارد.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onCloseCenter={onClose}
                  />
                ))
              )}
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
              <button
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                خوانده شدن همه
              </button>

              <button
                onClick={handleDeleteRead}
                disabled={notifications.every((n) => !n.is_read)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                حذف خوانده‌شده‌ها
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};
