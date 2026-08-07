/**
 * NexAccounting - Notification Badge Toolbar Button
 */

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { NotificationManager } from '../NotificationManager';
import { NotificationCenter } from './NotificationCenter';

export const NotificationBadge: React.FC = () => {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!businessId) return;

    // Load initial unread count
    setUnreadCount(NotificationManager.getUnreadCount(businessId));

    // Subscribe to updates
    const unsubscribe = NotificationManager.subscribe((_, count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [businessId]);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="مرکز اعلان‌ها و هشدارها"
          aria-label="اعلان‌ها"
        >
          <Bell className="w-5 h-5" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] h-[20px] text-[10px] font-bold text-white bg-rose-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse">
              {unreadCount > 99 ? '۹۹+' : unreadCount.toLocaleString('fa-IR')}
            </span>
          )}
        </button>
      </div>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
