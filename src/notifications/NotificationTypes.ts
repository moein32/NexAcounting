/**
 * NexAccounting - Notification Engine Professional
 * Notification Types and Interfaces
 */

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type NotificationCategory =
  | 'CHECK'
  | 'INVENTORY'
  | 'BACKUP'
  | 'SUBSCRIPTION'
  | 'CUSTOMER_BALANCE'
  | 'TREASURY'
  | 'SYSTEM';

export type NotificationType =
  // Checks
  | 'CHECK_UPCOMING'
  | 'CHECK_DUE_TODAY'
  | 'CHECK_OVERDUE'
  | 'CHECK_RETURNED'
  // Inventory
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'NEGATIVE_STOCK'
  | 'STOCK_COUNT_REMINDER'
  // Backup
  | 'NO_BACKUP_REMINDER'
  | 'BACKUP_COMPLETED'
  | 'BACKUP_FAILED'
  | 'RESTORE_COMPLETED'
  // Subscription
  | 'SUBSCRIPTION_EXPIRES_SOON'
  | 'SUBSCRIPTION_EXPIRED'
  | 'TRIAL_ENDING'
  // Customer & Supplier
  | 'CUSTOMER_DEBT_EXCEEDED'
  | 'SUPPLIER_PAYABLE_DUE'
  | 'OVERDUE_BALANCE_ALERT'
  // Treasury
  | 'LOW_CASH_BALANCE'
  | 'NEGATIVE_ACCOUNT_BALANCE'
  | 'LARGE_PAYMENT_ALERT'
  // System
  | 'DATABASE_INTEGRITY_WARNING'
  | 'STORAGE_ALMOST_FULL'
  | 'EXPORT_COMPLETED'
  | 'IMPORT_COMPLETED';

export interface Notification {
  id: string;
  business_id: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  entity_type?: 'check' | 'item' | 'document' | 'party' | 'backup' | 'subscription' | 'cash_account' | 'system' | string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  business_id: string;
  enable_checks: boolean;
  enable_inventory: boolean;
  enable_backup: boolean;
  enable_subscription: boolean;
  enable_customer_balance: boolean;
  enable_treasury: boolean;
  enable_system: boolean;
  quiet_hours_start?: string; // e.g. "22:00"
  quiet_hours_end?: string;   // e.g. "07:00"
  backup_reminder_days?: number; // e.g. 7
  created_at?: string;
  updated_at?: string;
}

export interface NotificationFilterOptions {
  category?: NotificationCategory | 'ALL';
  severity?: NotificationSeverity | 'ALL';
  is_read?: boolean | 'ALL';
  search?: string;
}
