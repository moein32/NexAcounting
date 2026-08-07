/**
 * NexAccounting - Customer & Supplier Balance Notification Generator
 * Checks customer debt limits, supplier payables, and overdue party balances.
 */

import { NotificationRepository } from '../NotificationRepository';
import { NotificationPreferences } from '../NotificationTypes';
import { db } from '../../lib/sqlite';

export class CustomerBalanceNotificationGenerator {
  public static generate(businessId: string, prefs: NotificationPreferences): void {
    if (!prefs.enable_customer_balance) return;

    try {
      const parties = db.queryAll<any>('parties').filter((p) => p.business_id === businessId && p.is_active !== false);

      parties.forEach((party) => {
        const creditLimit = Number(party.credit_limit || 0);
        const currentBalance = Number(party.balance || party.current_balance || 0);
        const partyName = party.name || 'طرف حساب';

        // 1. Customer debt exceeds credit limit
        if (party.type === 'customer' || party.type === 'both') {
          // Positive balance in party ledger usually indicates customer debt (بدهکار)
          if (creditLimit > 0 && currentBalance > creditLimit) {
            if (!NotificationRepository.existsDuplicate(businessId, 'CUSTOMER_DEBT_EXCEEDED', party.id)) {
              NotificationRepository.create({
                business_id: businessId,
                category: 'CUSTOMER_BALANCE',
                type: 'CUSTOMER_DEBT_EXCEEDED',
                title: `تخطی از سقف اعتبار: ${partyName}`,
                message: `بدهی مشتری ${partyName} (${currentBalance.toLocaleString('fa-IR')} تومان) از سقف اعتبار تعیین شده (${creditLimit.toLocaleString('fa-IR')} تومان) فراتر رفته است.`,
                severity: 'WARNING',
                entity_type: 'party',
                entity_id: party.id,
                action_url: `/parties/${party.id}`,
              });
            }
          }
        }

        // 2. Supplier payables due / Large debt
        if (party.type === 'supplier' || party.type === 'both') {
          // Negative balance in party ledger usually indicates company debt to supplier (بستانکار)
          const payableAmount = Math.abs(currentBalance);
          if (currentBalance < 0 && payableAmount >= 50000000) { // e.g. 50M Tomans threshold
            if (!NotificationRepository.existsDuplicate(businessId, 'SUPPLIER_PAYABLE_DUE', party.id)) {
              NotificationRepository.create({
                business_id: businessId,
                category: 'CUSTOMER_BALANCE',
                type: 'SUPPLIER_PAYABLE_DUE',
                title: `مانده بدهی به تأمین‌کننده: ${partyName}`,
                message: `بدهی به تأمین‌کننده ${partyName} به مبلغ ${payableAmount.toLocaleString('fa-IR')} تومان رسیده است.`,
                severity: 'INFO',
                entity_type: 'party',
                entity_id: party.id,
                action_url: `/parties/${party.id}`,
              });
            }
          }
        }
      });
    } catch (e) {
      console.error('CustomerBalanceNotificationGenerator error:', e);
    }
  }
}
