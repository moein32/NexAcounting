/**
 * NexAccounting - Check Notification Generator
 * Automatically generates alerts for upcoming, due, overdue, and returned checks.
 */

import { NotificationRepository } from '../NotificationRepository';
import { NotificationPreferences } from '../NotificationTypes';
import { db } from '../../lib/sqlite';

export class CheckNotificationGenerator {
  public static generate(businessId: string, prefs: NotificationPreferences): void {
    if (!prefs.enable_checks) return;

    try {
      const checks = db.queryAll<any>('checks').filter((c) => c.business_id === businessId);
      const today = new Date().toISOString().split('T')[0];

      checks.forEach((check) => {
        const dueDate = check.due_date ? check.due_date.split('T')[0] : '';
        if (!dueDate) return;

        const checkTitle = check.check_number ? `چک شماره ${check.check_number}` : 'چک بدون شماره';
        const partyName = check.party_name || 'طرف حساب نامشخص';
        const amountFormatted = Number(check.amount || 0).toLocaleString('fa-IR');

        // 1. Returned Check
        if (check.status === 'returned' || check.status === 'bounce') {
          if (!NotificationRepository.existsDuplicate(businessId, 'CHECK_RETURNED', check.id)) {
            NotificationRepository.create({
              business_id: businessId,
              category: 'CHECK',
              type: 'CHECK_RETURNED',
              title: `هشدار چک برگشتی: ${checkTitle}`,
              message: `${checkTitle} متعلق به ${partyName} به مبلغ ${amountFormatted} تومان برگشت خورده است.`,
              severity: 'CRITICAL',
              entity_type: 'check',
              entity_id: check.id,
              action_url: `/checks`,
            });
          }
        }

        // Pending checks logic
        if (check.status === 'pending' || check.status === 'registered' || check.status === 'received') {
          // Compare dates
          if (dueDate === today) {
            if (!NotificationRepository.existsDuplicate(businessId, 'CHECK_DUE_TODAY', check.id)) {
              NotificationRepository.create({
                business_id: businessId,
                category: 'CHECK',
                type: 'CHECK_DUE_TODAY',
                title: `سررسید امروز: ${checkTitle}`,
                message: `امروز سررسید ${checkTitle} (${partyName}) به مبلغ ${amountFormatted} تومان است.`,
                severity: 'WARNING',
                entity_type: 'check',
                entity_id: check.id,
                action_url: `/checks`,
              });
            }
          } else if (dueDate < today) {
            if (!NotificationRepository.existsDuplicate(businessId, 'CHECK_OVERDUE', check.id)) {
              NotificationRepository.create({
                business_id: businessId,
                category: 'CHECK',
                type: 'CHECK_OVERDUE',
                title: `معوقه چک: ${checkTitle}`,
                message: `${checkTitle} (${partyName}) به مبلغ ${amountFormatted} تومان سررسید گذشته است.`,
                severity: 'ERROR',
                entity_type: 'check',
                entity_id: check.id,
                action_url: `/checks`,
              });
            }
          } else {
            // Check if due in next 3 days
            const diffDays = Math.ceil(
              (new Date(dueDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24)
            );
            if (diffDays >= 1 && diffDays <= 3) {
              if (!NotificationRepository.existsDuplicate(businessId, 'CHECK_UPCOMING', check.id)) {
                NotificationRepository.create({
                  business_id: businessId,
                  category: 'CHECK',
                  type: 'CHECK_UPCOMING',
                  title: `سررسید بزودی: ${checkTitle}`,
                  message: `${checkTitle} (${partyName}) به مبلغ ${amountFormatted} تومان ${diffDays} روز دیگر سررسید می‌شود.`,
                  severity: 'INFO',
                  entity_type: 'check',
                  entity_id: check.id,
                  action_url: `/checks`,
                });
              }
            }
          }
        }
      });
    } catch (e) {
      console.error('CheckNotificationGenerator error:', e);
    }
  }
}
