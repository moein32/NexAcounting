/**
 * NexAccounting - Notification Preferences Management
 */

import { NotificationPreferences } from './NotificationTypes';
import { db } from '../lib/sqlite';

export const DEFAULT_NOTIFICATION_PREFERENCES = (businessId: string): NotificationPreferences => ({
  business_id: businessId,
  enable_checks: true,
  enable_inventory: true,
  enable_backup: true,
  enable_subscription: true,
  enable_customer_balance: true,
  enable_treasury: true,
  enable_system: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  backup_reminder_days: 7,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export class NotificationPreferencesManager {
  public static getPreferences(businessId: string): NotificationPreferences {
    try {
      const prefs = db.queryAll<NotificationPreferences>('notification_preferences')
        .find((p) => p.business_id === businessId);
      if (prefs) {
        return {
          ...DEFAULT_NOTIFICATION_PREFERENCES(businessId),
          ...prefs,
        };
      }
    } catch (e) {
      console.warn('Failed to load notification preferences from DB:', e);
    }
    return DEFAULT_NOTIFICATION_PREFERENCES(businessId);
  }

  public static savePreferences(prefs: NotificationPreferences): NotificationPreferences {
    const existing = db.queryAll<NotificationPreferences>('notification_preferences')
      .find((p) => p.business_id === prefs.business_id);

    const updated: NotificationPreferences = {
      ...prefs,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      db.updateRecord<NotificationPreferences>('notification_preferences', existing.business_id, updated);
    } else {
      db.insertRecord<NotificationPreferences>('notification_preferences', updated);
    }
    return updated;
  }

  /**
   * Checks whether the current local time falls within configured quiet hours.
   */
  public static isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes === endMinutes) return false;

    if (startMinutes < endMinutes) {
      // e.g. 13:00 to 17:00
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight quiet hours, e.g. 22:00 to 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }
}
