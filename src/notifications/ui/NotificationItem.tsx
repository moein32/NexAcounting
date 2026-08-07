/**
 * NexAccounting - Notification Item UI Component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Info,
  Trash2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Notification, NotificationSeverity } from '../NotificationTypes';
import { formatPersianDate } from '../../lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onCloseCenter?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onCloseCenter,
}) => {
  const navigate = useNavigate();

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          label: 'بسیار مهم',
        };
      case 'ERROR':
        return {
          bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50',
          icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
          label: 'خطا',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          label: 'هشدار',
        };
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          label: 'موفقیت',
        };
      case 'INFO':
      default:
        return {
          bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
          icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          label: 'اطلاعیه',
        };
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'CHECK': return 'چک و اسناد';
      case 'INVENTORY': return 'موجودی انبار';
      case 'BACKUP': return 'پشتیبان‌گیری';
      case 'SUBSCRIPTION': return 'اشتراک سیستم';
      case 'CUSTOMER_BALANCE': return 'طرف حساب و بدهی';
      case 'TREASURY': return 'خزانه و بانک';
      case 'SYSTEM': return 'سیستمی';
      default: return category;
    }
  };

  const severityInfo = getSeverityBadge(notification.severity);

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      if (onCloseCenter) onCloseCenter();
    }
  };

  const formattedTime = formatPersianDate(notification.created_at);

  return (
    <div
      onClick={handleClick}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        notification.is_read
          ? 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 opacity-80 hover:opacity-100'
          : 'bg-blue-50/40 dark:bg-slate-800/80 border-blue-200/80 dark:border-blue-800/80 text-slate-900 dark:text-slate-100 shadow-sm'
      } hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Icon & Category */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2.5 rounded-xl border flex-shrink-0 ${severityInfo.bg}`}>
            {severityInfo.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {getCategoryLabel(notification.category)}
              </span>

              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${severityInfo.bg}`}>
                {severityInfo.label}
              </span>

              {!notification.is_read && (
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" title="خوانده نشده" />
              )}
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mb-1">
              {notification.title}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {notification.message}
            </p>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedTime}
              </span>

              {notification.action_url && (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  مشاهده جزئیات
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Delete Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex-shrink-0"
          title="حذف این اعلان"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
