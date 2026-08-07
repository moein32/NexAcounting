/**
 * NexAccounting - Notification Service Facade
 * High-level API for application modules to dispatch notifications and query state.
 */

import { NotificationEngine } from './NotificationEngine';
import { NotificationManager } from './NotificationManager';
import { NotificationScheduler } from './NotificationScheduler';
import {
  Notification,
  NotificationFilterOptions,
  NotificationPreferences,
  NotificationSeverity,
  NotificationType,
} from './NotificationTypes';

export class NotificationService {
  /**
   * Initialize scheduler for business.
   */
  public static initScheduler(businessId: string): void {
    NotificationScheduler.init(businessId);
  }

  /**
   * Fetch notifications list.
   */
  public static getNotifications(
    businessId: string,
    filters?: NotificationFilterOptions
  ): Notification[] {
    return NotificationManager.getNotifications(businessId, filters);
  }

  /**
   * Get unread notification count.
   */
  public static getUnreadCount(businessId: string): number {
    return NotificationManager.getUnreadCount(businessId);
  }

  /**
   * Mark notification as read.
   */
  public static markAsRead(id: string, businessId: string): boolean {
    return NotificationManager.markAsRead(id, businessId);
  }

  /**
   * Mark all notifications as read.
   */
  public static markAllAsRead(businessId: string): number {
    return NotificationManager.markAllAsRead(businessId);
  }

  /**
   * Delete single notification.
   */
  public static delete(id: string, businessId: string): boolean {
    return NotificationManager.delete(id, businessId);
  }

  /**
   * Bulk delete notifications.
   */
  public static bulkDelete(ids: string[], businessId: string): number {
    return NotificationManager.bulkDelete(ids, businessId);
  }

  /**
   * Delete all read notifications.
   */
  public static deleteRead(businessId: string): number {
    return NotificationManager.deleteRead(businessId);
  }

  /**
   * Get user preferences.
   */
  public static getPreferences(businessId: string): NotificationPreferences {
    return NotificationManager.getPreferences(businessId);
  }

  /**
   * Save user preferences.
   */
  public static savePreferences(prefs: NotificationPreferences): NotificationPreferences {
    return NotificationManager.savePreferences(prefs);
  }

  /**
   * Dispatch custom notification.
   */
  public static dispatch(
    businessId: string,
    type: NotificationType,
    message: string,
    options?: {
      title?: string;
      severity?: NotificationSeverity;
      entityType?: string;
      entityId?: string;
      actionUrl?: string;
      metadata?: Record<string, any>;
    }
  ): Notification | null {
    return NotificationEngine.createEventNotification({
      businessId,
      type,
      title: options?.title,
      message,
      severity: options?.severity,
      entityType: options?.entityType,
      entityId: options?.entityId,
      actionUrl: options?.actionUrl,
      metadata: options?.metadata,
    });
  }

  // --- Convenience Helpers ---

  public static notifyExportCompleted(businessId: string, filename: string, recordCount?: number): void {
    this.dispatch(businessId, 'EXPORT_COMPLETED', `فایل خروجی ${filename} با ${recordCount ? recordCount.toLocaleString('fa-IR') + ' ردیف ' : ''}با موفقیت تولید شد.`, {
      actionUrl: '/export-center',
      severity: 'SUCCESS',
    });
  }

  public static notifyImportCompleted(businessId: string, entityType: string, importedCount: number): void {
    this.dispatch(businessId, 'IMPORT_COMPLETED', `تعداد ${importedCount.toLocaleString('fa-IR')} ردیف اطلاعات ${entityType} با موفقیت در دیتابیس ثبت شد.`, {
      actionUrl: '/export-center',
      severity: 'SUCCESS',
    });
  }

  public static notifyBackupCompleted(businessId: string, filename?: string): void {
    localStorage.setItem('nex_last_backup_time', new Date().toISOString());
    this.dispatch(businessId, 'BACKUP_COMPLETED', `نسخه پشتیبان دیتابیس ${filename ? `(${filename}) ` : ''}با موفقیت ذخیره شد.`, {
      actionUrl: '/settings',
      severity: 'SUCCESS',
    });
  }

  public static notifyRestoreCompleted(businessId: string): void {
    this.dispatch(businessId, 'RESTORE_COMPLETED', 'اطلاعات دیتابیس با موفقیت از فایل پشتیبان بازیابی شد.', {
      actionUrl: '/settings',
      severity: 'SUCCESS',
    });
  }

  public static notifyDatabaseIntegrityWarning(businessId: string, issueDetails: string): void {
    this.dispatch(businessId, 'DATABASE_INTEGRITY_WARNING', `ناهمخوانی یا ناهماهنگی در داده‌های مالی شناسایی شد: ${issueDetails}`, {
      actionUrl: '/settings',
      severity: 'CRITICAL',
    });
  }

  public static notifyStorageAlmostFull(businessId: string, usedPercentage: number): void {
    this.dispatch(businessId, 'STORAGE_ALMOST_FULL', `حافظه محلی ذخیره‌سازی به ${usedPercentage}% رسیده است.`, {
      actionUrl: '/settings',
      severity: 'WARNING',
    });
  }
}
