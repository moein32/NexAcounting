/**
 * NexAccounting - Notification Rules Engine
 * Maps notification types to default severities, titles, categories, and action URLs.
 */

import {
  NotificationCategory,
  NotificationSeverity,
  NotificationType,
} from './NotificationTypes';

export interface NotificationRuleDefinition {
  type: NotificationType;
  category: NotificationCategory;
  defaultSeverity: NotificationSeverity;
  defaultTitle: string;
  defaultActionUrl: string;
}

export const NOTIFICATION_RULES: Record<NotificationType, NotificationRuleDefinition> = {
  // Checks
  CHECK_UPCOMING: {
    type: 'CHECK_UPCOMING',
    category: 'CHECK',
    defaultSeverity: 'INFO',
    defaultTitle: 'سررسید قریب‌الوقوع چک',
    defaultActionUrl: '/checks',
  },
  CHECK_DUE_TODAY: {
    type: 'CHECK_DUE_TODAY',
    category: 'CHECK',
    defaultSeverity: 'WARNING',
    defaultTitle: 'سررسید امروز چک',
    defaultActionUrl: '/checks',
  },
  CHECK_OVERDUE: {
    type: 'CHECK_OVERDUE',
    category: 'CHECK',
    defaultSeverity: 'ERROR',
    defaultTitle: 'چک سررسید گذشته و معوق',
    defaultActionUrl: '/checks',
  },
  CHECK_RETURNED: {
    type: 'CHECK_RETURNED',
    category: 'CHECK',
    defaultSeverity: 'CRITICAL',
    defaultTitle: 'چک برگشتی',
    defaultActionUrl: '/checks',
  },

  // Inventory
  LOW_STOCK: {
    type: 'LOW_STOCK',
    category: 'INVENTORY',
    defaultSeverity: 'WARNING',
    defaultTitle: 'هشدار نقطه سفارش و موجودی کم',
    defaultActionUrl: '/inventory/low-stock',
  },
  OUT_OF_STOCK: {
    type: 'OUT_OF_STOCK',
    category: 'INVENTORY',
    defaultSeverity: 'ERROR',
    defaultTitle: 'اتمام موجودی کالا',
    defaultActionUrl: '/inventory/low-stock',
  },
  NEGATIVE_STOCK: {
    type: 'NEGATIVE_STOCK',
    category: 'INVENTORY',
    defaultSeverity: 'CRITICAL',
    defaultTitle: 'هشدار موجودی منفی کالا',
    defaultActionUrl: '/inventory',
  },
  STOCK_COUNT_REMINDER: {
    type: 'STOCK_COUNT_REMINDER',
    category: 'INVENTORY',
    defaultSeverity: 'INFO',
    defaultTitle: 'یادآوری انبارگردانی دوره‌ای',
    defaultActionUrl: '/inventory/stock-count',
  },

  // Backup
  NO_BACKUP_REMINDER: {
    type: 'NO_BACKUP_REMINDER',
    category: 'BACKUP',
    defaultSeverity: 'WARNING',
    defaultTitle: 'یادآوری پشتیبان‌گیری از داده‌ها',
    defaultActionUrl: '/settings',
  },
  BACKUP_COMPLETED: {
    type: 'BACKUP_COMPLETED',
    category: 'BACKUP',
    defaultSeverity: 'SUCCESS',
    defaultTitle: 'پشتیبان‌گیری موفقیت‌آمیز',
    defaultActionUrl: '/settings',
  },
  BACKUP_FAILED: {
    type: 'BACKUP_FAILED',
    category: 'BACKUP',
    defaultSeverity: 'ERROR',
    defaultTitle: 'خطا در پشتیبان‌گیری',
    defaultActionUrl: '/settings',
  },
  RESTORE_COMPLETED: {
    type: 'RESTORE_COMPLETED',
    category: 'BACKUP',
    defaultSeverity: 'SUCCESS',
    defaultTitle: 'بازیابی موفقیت‌آمیز داده‌ها',
    defaultActionUrl: '/settings',
  },

  // Subscription
  SUBSCRIPTION_EXPIRES_SOON: {
    type: 'SUBSCRIPTION_EXPIRES_SOON',
    category: 'SUBSCRIPTION',
    defaultSeverity: 'WARNING',
    defaultTitle: 'اتمام نزدیک اشتراک سیستم',
    defaultActionUrl: '/settings',
  },
  SUBSCRIPTION_EXPIRED: {
    type: 'SUBSCRIPTION_EXPIRED',
    category: 'SUBSCRIPTION',
    defaultSeverity: 'CRITICAL',
    defaultTitle: 'اشتراک نرم‌افزار منقضی شده است',
    defaultActionUrl: '/settings',
  },
  TRIAL_ENDING: {
    type: 'TRIAL_ENDING',
    category: 'SUBSCRIPTION',
    defaultSeverity: 'WARNING',
    defaultTitle: 'پایان دوره آزمایشی',
    defaultActionUrl: '/settings',
  },

  // Customer & Supplier
  CUSTOMER_DEBT_EXCEEDED: {
    type: 'CUSTOMER_DEBT_EXCEEDED',
    category: 'CUSTOMER_BALANCE',
    defaultSeverity: 'WARNING',
    defaultTitle: 'تخطی مشتری از سقف اعتبار',
    defaultActionUrl: '/parties/customers',
  },
  SUPPLIER_PAYABLE_DUE: {
    type: 'SUPPLIER_PAYABLE_DUE',
    category: 'CUSTOMER_BALANCE',
    defaultSeverity: 'INFO',
    defaultTitle: 'سررسید بدهی به تأمین‌کننده',
    defaultActionUrl: '/parties/suppliers',
  },
  OVERDUE_BALANCE_ALERT: {
    type: 'OVERDUE_BALANCE_ALERT',
    category: 'CUSTOMER_BALANCE',
    defaultSeverity: 'ERROR',
    defaultTitle: 'مانده حساب معوقه سنگین',
    defaultActionUrl: '/parties',
  },

  // Treasury
  LOW_CASH_BALANCE: {
    type: 'LOW_CASH_BALANCE',
    category: 'TREASURY',
    defaultSeverity: 'WARNING',
    defaultTitle: 'موجودی کم صندوق / حساب بانکی',
    defaultActionUrl: '/treasury/accounts',
  },
  NEGATIVE_ACCOUNT_BALANCE: {
    type: 'NEGATIVE_ACCOUNT_BALANCE',
    category: 'TREASURY',
    defaultSeverity: 'CRITICAL',
    defaultTitle: 'منفی شدن تراز حساب بانکی',
    defaultActionUrl: '/treasury/accounts',
  },
  LARGE_PAYMENT_ALERT: {
    type: 'LARGE_PAYMENT_ALERT',
    category: 'TREASURY',
    defaultSeverity: 'INFO',
    defaultTitle: 'ثبت پرداخت مالی کلان',
    defaultActionUrl: '/treasury/payments',
  },

  // System
  DATABASE_INTEGRITY_WARNING: {
    type: 'DATABASE_INTEGRITY_WARNING',
    category: 'SYSTEM',
    defaultSeverity: 'CRITICAL',
    defaultTitle: 'هشدار یکپارچگی دیتابیس',
    defaultActionUrl: '/settings',
  },
  STORAGE_ALMOST_FULL: {
    type: 'STORAGE_ALMOST_FULL',
    category: 'SYSTEM',
    defaultSeverity: 'WARNING',
    defaultTitle: 'پر شدن حافظه مرورگر / دیسک',
    defaultActionUrl: '/settings',
  },
  EXPORT_COMPLETED: {
    type: 'EXPORT_COMPLETED',
    category: 'SYSTEM',
    defaultSeverity: 'SUCCESS',
    defaultTitle: 'خروجی فایل با موفقیت آماده شد',
    defaultActionUrl: '/export-center',
  },
  IMPORT_COMPLETED: {
    type: 'IMPORT_COMPLETED',
    category: 'SYSTEM',
    defaultSeverity: 'SUCCESS',
    defaultTitle: 'ورود اطلاعات با موفقیت انجام شد',
    defaultActionUrl: '/export-center',
  },
};

export class NotificationRulesEngine {
  public static getRule(type: NotificationType): NotificationRuleDefinition {
    return NOTIFICATION_RULES[type] || {
      type,
      category: 'SYSTEM',
      defaultSeverity: 'INFO',
      defaultTitle: 'اطلاعیه سیستم',
      defaultActionUrl: '/dashboard',
    };
  }
}
