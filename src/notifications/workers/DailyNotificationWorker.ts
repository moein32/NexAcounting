/**
 * NexAccounting - Daily Notification Worker
 * Executes scheduled daily tasks, expired notification cleanup, and rule evaluations.
 */

import { NotificationRepository } from '../NotificationRepository';
import { NotificationPreferencesManager } from '../NotificationPreferences';
import { CheckNotificationGenerator } from '../generators/CheckNotificationGenerator';
import { InventoryNotificationGenerator } from '../generators/InventoryNotificationGenerator';
import { SubscriptionNotificationGenerator } from '../generators/SubscriptionNotificationGenerator';
import { BackupNotificationGenerator } from '../generators/BackupNotificationGenerator';
import { CustomerBalanceNotificationGenerator } from '../generators/CustomerBalanceNotificationGenerator';

export class DailyNotificationWorker {
  /**
   * Run full daily scan for a business.
   */
  public static runDailyTasks(businessId: string): void {
    if (!businessId) return;

    try {
      // 1. Clean up expired notifications
      NotificationRepository.deleteExpired(businessId);

      // 2. Get user preferences
      const prefs = NotificationPreferencesManager.getPreferences(businessId);

      // 3. Run generators
      CheckNotificationGenerator.generate(businessId, prefs);
      InventoryNotificationGenerator.generate(businessId, prefs);
      SubscriptionNotificationGenerator.generate(businessId, prefs);
      BackupNotificationGenerator.generate(businessId, prefs);
      CustomerBalanceNotificationGenerator.generate(businessId, prefs);

      // 4. Prune read notifications if count exceeds 200
      const all = NotificationRepository.getAll(businessId);
      if (all.length > 200) {
        const readNotifications = all.filter((n) => n.is_read);
        const toDeleteCount = all.length - 200;
        const idsToDelete = readNotifications
          .slice(-toDeleteCount)
          .map((n) => n.id);
        if (idsToDelete.length > 0) {
          NotificationRepository.bulkDelete(idsToDelete);
        }
      }
    } catch (e) {
      console.error('DailyNotificationWorker failed:', e);
    }
  }
}
