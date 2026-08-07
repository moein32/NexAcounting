/**
 * NexAccounting - Backup Notification Generator
 * Checks last database backup date and alerts user if backup is overdue.
 */

import { NotificationRepository } from '../NotificationRepository';
import { NotificationPreferences } from '../NotificationTypes';

export class BackupNotificationGenerator {
  public static generate(businessId: string, prefs: NotificationPreferences): void {
    if (!prefs.enable_backup) return;

    try {
      const lastBackupRaw = localStorage.getItem('nex_last_backup_time');
      const reminderDays = prefs.backup_reminder_days || 7;

      if (!lastBackupRaw) {
        if (!NotificationRepository.existsDuplicate(businessId, 'NO_BACKUP_REMINDER')) {
          NotificationRepository.create({
            business_id: businessId,
            category: 'BACKUP',
            type: 'NO_BACKUP_REMINDER',
            title: 'یادآوری تهیه پشتیبان نخستین',
            message: 'هنوز هیچ نسخه پشتیبانی از اطلاعات دیتابیس تهیه نشده است. پیشنهاد می‌شود برای حفظ داده‌ها یک نسخه خروجی تهیه کنید.',
            severity: 'WARNING',
            entity_type: 'backup',
            action_url: '/settings',
          });
        }
        return;
      }

      const lastBackupDate = new Date(lastBackupRaw);
      const now = new Date();
      const diffTime = now.getTime() - lastBackupDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

      if (diffDays >= reminderDays) {
        if (!NotificationRepository.existsDuplicate(businessId, 'NO_BACKUP_REMINDER')) {
          NotificationRepository.create({
            business_id: businessId,
            category: 'BACKUP',
            type: 'NO_BACKUP_REMINDER',
            title: 'یادآوری پشتیبان‌گیری دوره‌ای',
            message: `بیش از ${diffDays.toLocaleString('fa-IR')} روز از آخرین پشتیبان‌گیری سیستم می‌گذرد. برای جلوگیری از فقدان اطلاعات نسخه پشتیبان جدید دریافت نمایید.`,
            severity: 'WARNING',
            entity_type: 'backup',
            action_url: '/settings',
          });
        }
      }
    } catch (e) {
      console.error('BackupNotificationGenerator error:', e);
    }
  }
}
