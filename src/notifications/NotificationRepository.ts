/**
 * NexAccounting - Notification Repository
 * SQLite Data Access Layer for Notifications
 */

import {
  Notification,
  NotificationFilterOptions,
  NotificationSeverity,
  NotificationType,
} from './NotificationTypes';
import { db } from '../lib/sqlite';

export class NotificationRepository {
  /**
   * Fetch all notifications for a business with optional filtering.
   */
  public static getAll(businessId: string, filters?: NotificationFilterOptions): Notification[] {
    let notifications = db.queryAll<Notification>('notifications')
      .filter((n) => n.business_id === businessId);

    if (filters) {
      if (filters.category && filters.category !== 'ALL') {
        notifications = notifications.filter((n) => n.category === filters.category);
      }
      if (filters.severity && filters.severity !== 'ALL') {
        notifications = notifications.filter((n) => n.severity === filters.severity);
      }
      if (filters.is_read !== undefined && filters.is_read !== 'ALL') {
        notifications = notifications.filter((n) => n.is_read === filters.is_read);
      }
      if (filters.search && filters.search.trim()) {
        const query = filters.search.trim().toLowerCase();
        notifications = notifications.filter(
          (n) =>
            n.title.toLowerCase().includes(query) ||
            n.message.toLowerCase().includes(query)
        );
      }
    }

    // Sort by created_at descending (newest first)
    return notifications.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get total unread count for business.
   */
  public static getUnreadCount(businessId: string): number {
    return db
      .queryAll<Notification>('notifications')
      .filter((n) => n.business_id === businessId && !n.is_read).length;
  }

  /**
   * Get single notification by ID.
   */
  public static getById(id: string): Notification | null {
    const notifications = db.queryAll<Notification>('notifications');
    return notifications.find((n) => n.id === id) || null;
  }

  /**
   * Check if an active/unread duplicate notification already exists.
   */
  public static existsDuplicate(
    businessId: string,
    type: NotificationType,
    entityId?: string
  ): boolean {
    const all = db.queryAll<Notification>('notifications');
    return all.some(
      (n) =>
        n.business_id === businessId &&
        n.type === type &&
        (!entityId || n.entity_id === entityId) &&
        !n.is_read
    );
  }

  /**
   * Create and persist a new notification.
   */
  public static create(
    payload: Omit<Notification, 'id' | 'is_read' | 'created_at'> & {
      id?: string;
      is_read?: boolean;
      created_at?: string;
    }
  ): Notification {
    const notification: Notification = {
      id: payload.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      business_id: payload.business_id,
      category: payload.category,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      severity: payload.severity,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      is_read: payload.is_read ?? false,
      created_at: payload.created_at || new Date().toISOString(),
      expires_at: payload.expires_at,
      action_url: payload.action_url,
      metadata: payload.metadata,
    };

    return db.insertRecord<Notification>('notifications', notification);
  }

  /**
   * Mark a single notification as read.
   */
  public static markAsRead(id: string): boolean {
    const existing = this.getById(id);
    if (!existing) return false;
    db.updateRecord<Notification>('notifications', id, { ...existing, is_read: true });
    return true;
  }

  /**
   * Mark all notifications for a business as read.
   */
  public static markAllAsRead(businessId: string): number {
    const all = db.queryAll<Notification>('notifications');
    let count = 0;
    all.forEach((n) => {
      if (n.business_id === businessId && !n.is_read) {
        db.updateRecord<Notification>('notifications', n.id, { ...n, is_read: true });
        count++;
      }
    });
    return count;
  }

  /**
   * Delete a single notification.
   */
  public static delete(id: string): boolean {
    return db.deleteRecord('notifications', id);
  }

  /**
   * Bulk delete array of notification IDs.
   */
  public static bulkDelete(ids: string[]): number {
    let count = 0;
    ids.forEach((id) => {
      if (db.deleteRecord('notifications', id)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Delete all read notifications for a business.
   */
  public static deleteRead(businessId: string): number {
    const all = db.queryAll<Notification>('notifications');
    let count = 0;
    all.forEach((n) => {
      if (n.business_id === businessId && n.is_read) {
        if (db.deleteRecord('notifications', n.id)) {
          count++;
        }
      }
    });
    return count;
  }

  /**
   * Clear all notifications for a business.
   */
  public static clearAll(businessId: string): number {
    const all = db.queryAll<Notification>('notifications');
    let count = 0;
    all.forEach((n) => {
      if (n.business_id === businessId) {
        if (db.deleteRecord('notifications', n.id)) {
          count++;
        }
      }
    });
    return count;
  }

  /**
   * Delete expired notifications.
   */
  public static deleteExpired(businessId: string): number {
    const all = db.queryAll<Notification>('notifications');
    const now = new Date().getTime();
    let count = 0;
    all.forEach((n) => {
      if (n.business_id === businessId) {
        if (n.expires_at && new Date(n.expires_at).getTime() < now) {
          if (db.deleteRecord('notifications', n.id)) count++;
        }
      }
    });
    return count;
  }
}
