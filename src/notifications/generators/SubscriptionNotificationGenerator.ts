/**
 * NexAccounting - Subscription Notification Generator
 * Generates alerts for subscription expiration and trial status.
 */

import { NotificationRepository } from '../NotificationRepository';
import { NotificationPreferences } from '../NotificationTypes';
import { db } from '../../lib/sqlite';

export class SubscriptionNotificationGenerator {
  public static generate(businessId: string, prefs: NotificationPreferences): void {
    if (!prefs.enable_subscription) return;

    try {
      const licenses = db.queryAll<any>('licenses').filter((l) => l.business_id === businessId || !l.business_id);
      const activeLicense = licenses.length > 0 ? licenses[0] : null;

      if (!activeLicense) return;

      const expiryDate = activeLicense.expires_at || activeLicense.expiration_date;
      if (!expiryDate) return;

      const today = new Date();
      const exp = new Date(expiryDate);
      const diffTime = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      if (diffDays <= 0) {
        if (!NotificationRepository.existsDuplicate(businessId, 'SUBSCRIPTION_EXPIRED', activeLicense.id || 'sub_main')) {
          NotificationRepository.create({
            business_id: businessId,
            category: 'SUBSCRIPTION',
            type: 'SUBSCRIPTION_EXPIRED',
            title: 'انقضای اشتراک نکس اکاونتینگ',
            message: 'اعتبار اشتراک شما به پایان رسیده است. برای تداوم امکانات آنلاین و گزارشات پیشرفته نسبت به تمدید اقدام فرمایید.',
            severity: 'CRITICAL',
            entity_type: 'subscription',
            entity_id: activeLicense.id || 'sub_main',
            action_url: '/settings',
          });
        }
      } else if (diffDays <= 7) {
        if (!NotificationRepository.existsDuplicate(businessId, 'SUBSCRIPTION_EXPIRES_SOON', activeLicense.id || 'sub_main')) {
          NotificationRepository.create({
            business_id: businessId,
            category: 'SUBSCRIPTION',
            type: 'SUBSCRIPTION_EXPIRES_SOON',
            title: 'اتمام بزودی اشتراک نرم‌افزار',
            message: `تنها ${diffDays.toLocaleString('fa-IR')} روز از اعتبار اشتراک نکس اکاونتینگ باقی مانده است.`,
            severity: 'WARNING',
            entity_type: 'subscription',
            entity_id: activeLicense.id || 'sub_main',
            action_url: '/settings',
          });
        }
      }
    } catch (e) {
      console.error('SubscriptionNotificationGenerator error:', e);
    }
  }
}
