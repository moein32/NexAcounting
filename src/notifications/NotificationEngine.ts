/**
 * NexAccounting - Core Notification Engine
 * Central orchestrator for event notifications, scheduled checks, and local system notifications.
 */

import type {
  Notification,
  NotificationCategory,
  NotificationSeverity,
  NotificationType,
} from './NotificationTypes';
import { NotificationRepository } from './NotificationRepository';
import { NotificationPreferencesManager } from './NotificationPreferences';
import { NotificationRulesEngine } from './NotificationRules';
import { DailyNotificationWorker } from './workers/DailyNotificationWorker';

export class NotificationEngine {
  /**
   * Run all scheduled generators for a business.
   */
  public static runScheduledChecks(businessId: string): void {
    if (!businessId) return;
    DailyNotificationWorker.runDailyTasks(businessId);
  }

  /**
   * Create a direct event notification (e.g. Export completed, Backup success).
   */
  public static createEventNotification(params: {
    businessId: string;
    type: NotificationType;
    title?: string;
    message: string;
    severity?: NotificationSeverity;
    entityType?: string;
    entityId?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): Notification | null {
    const { businessId, type, message, entityType, entityId, metadata } = params;

    if (!businessId) return null;

    const prefs = NotificationPreferencesManager.getPreferences(businessId);
    const rule = NotificationRulesEngine.getRule(type);

    // Check category preferences
    if (rule.category === 'CHECK' && !prefs.enable_checks) return null;
    if (rule.category === 'INVENTORY' && !prefs.enable_inventory) return null;
    if (rule.category === 'BACKUP' && !prefs.enable_backup) return null;
    if (rule.category === 'SUBSCRIPTION' && !prefs.enable_subscription) return null;
    if (rule.category === 'CUSTOMER_BALANCE' && !prefs.enable_customer_balance) return null;
    if (rule.category === 'TREASURY' && !prefs.enable_treasury) return null;
    if (rule.category === 'SYSTEM' && !prefs.enable_system) return null;

    const title = params.title || rule.defaultTitle;
    const severity = params.severity || rule.defaultSeverity;
    const actionUrl = params.actionUrl || rule.defaultActionUrl;

    const notification = NotificationRepository.create({
      business_id: businessId,
      category: rule.category,
      type,
      title,
      message,
      severity,
      entity_type: entityType,
      entity_id: entityId,
      action_url: actionUrl,
      metadata,
    });

    // Dispatch local notification if permitted and outside quiet hours
    const inQuiet = NotificationPreferencesManager.isInQuietHours(prefs);
    if (!inQuiet && (severity === 'WARNING' || severity === 'ERROR' || severity === 'CRITICAL' || severity === 'SUCCESS')) {
      this.triggerLocalDeviceNotification(title, message);
    }

    return notification;
  }

  /**
   * Browser / Android Local Notification Bridge
   */
  private static triggerLocalDeviceNotification(title: string, body: string): void {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification(title, { body, icon: '/favicon.ico' });
            }
          });
        }
      }
    } catch (e) {
      // Quiet fail if browser/Android environment restricts local notifications
    }
  }
}
