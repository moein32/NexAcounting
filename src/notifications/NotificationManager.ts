/**
 * NexAccounting - Notification Manager
 * State Coordinator and Event Subscription Service for UI Components
 */

import {
  Notification,
  NotificationFilterOptions,
  NotificationPreferences,
} from './NotificationTypes';
import { NotificationRepository } from './NotificationRepository';
import { NotificationPreferencesManager } from './NotificationPreferences';
import { NotificationEngine } from './NotificationEngine';

type NotificationChangeListener = (notifications: Notification[], unreadCount: number) => void;

export class NotificationManager {
  private static listeners: Set<NotificationChangeListener> = new Set();

  /**
   * Subscribe to notification list/unread count changes.
   */
  public static subscribe(listener: NotificationChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(businessId: string): void {
    if (!businessId) return;
    const notifications = NotificationRepository.getAll(businessId);
    const unreadCount = NotificationRepository.getUnreadCount(businessId);
    this.listeners.forEach((listener) => listener(notifications, unreadCount));
  }

  /**
   * Fetch notifications with filters.
   */
  public static getNotifications(businessId: string, filters?: NotificationFilterOptions): Notification[] {
    return NotificationRepository.getAll(businessId, filters);
  }

  /**
   * Get total unread count for badge.
   */
  public static getUnreadCount(businessId: string): number {
    return NotificationRepository.getUnreadCount(businessId);
  }

  /**
   * Mark a single notification as read and notify subscribers.
   */
  public static markAsRead(id: string, businessId: string): boolean {
    const success = NotificationRepository.markAsRead(id);
    if (success) {
      this.notifyListeners(businessId);
    }
    return success;
  }

  /**
   * Mark all as read and notify subscribers.
   */
  public static markAllAsRead(businessId: string): number {
    const count = NotificationRepository.markAllAsRead(businessId);
    if (count > 0) {
      this.notifyListeners(businessId);
    }
    return count;
  }

  /**
   * Delete notification and notify subscribers.
   */
  public static delete(id: string, businessId: string): boolean {
    const success = NotificationRepository.delete(id);
    if (success) {
      this.notifyListeners(businessId);
    }
    return success;
  }

  /**
   * Bulk delete notifications and notify subscribers.
   */
  public static bulkDelete(ids: string[], businessId: string): number {
    const count = NotificationRepository.bulkDelete(ids);
    if (count > 0) {
      this.notifyListeners(businessId);
    }
    return count;
  }

  /**
   * Delete all read notifications.
   */
  public static deleteRead(businessId: string): number {
    const count = NotificationRepository.deleteRead(businessId);
    if (count > 0) {
      this.notifyListeners(businessId);
    }
    return count;
  }

  /**
   * Run scheduled notification checks and trigger listener update.
   */
  public static refreshScheduledChecks(businessId: string): void {
    NotificationEngine.runScheduledChecks(businessId);
    this.notifyListeners(businessId);
  }

  /**
   * Get notification preferences.
   */
  public static getPreferences(businessId: string): NotificationPreferences {
    return NotificationPreferencesManager.getPreferences(businessId);
  }

  /**
   * Update notification preferences.
   */
  public static savePreferences(prefs: NotificationPreferences): NotificationPreferences {
    const updated = NotificationPreferencesManager.savePreferences(prefs);
    this.notifyListeners(prefs.business_id);
    return updated;
  }
}
