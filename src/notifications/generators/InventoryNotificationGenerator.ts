/**
 * NexAccounting - Inventory Notification Generator
 * Automatically generates alerts for low stock, out of stock, negative stock, and inventory count reminders.
 */

import { NotificationRepository } from '../NotificationRepository';
import { NotificationPreferences } from '../NotificationTypes';
import { db } from '../../lib/sqlite';

export class InventoryNotificationGenerator {
  public static generate(businessId: string, prefs: NotificationPreferences): void {
    if (!prefs.enable_inventory) return;

    try {
      const items = db.queryAll<any>('items').filter((i) => i.business_id === businessId && i.type !== 'service');
      const balances = db.queryAll<any>('inventory_balances').filter((b) => b.business_id === businessId);

      items.forEach((item) => {
        // Sum total available quantity across warehouses
        const itemBalances = balances.filter((b) => b.item_id === item.id);
        const totalQty = itemBalances.reduce(
          (sum, b) => sum + Number(b.available_quantity || b.quantity || 0),
          0
        );

        const minStock = Number(item.min_stock || item.reorder_point || 5);
        const itemName = item.name || 'کالای نامشخص';
        const itemCode = item.code ? `(${item.code})` : '';

        // 1. Negative Stock
        if (totalQty < 0) {
          if (!NotificationRepository.existsDuplicate(businessId, 'NEGATIVE_STOCK', item.id)) {
            NotificationRepository.create({
              business_id: businessId,
              category: 'INVENTORY',
              type: 'NEGATIVE_STOCK',
              title: `موجودی منفی: ${itemName}`,
              message: `موجودی کالا ${itemName} ${itemCode} برابر با ${totalQty.toLocaleString('fa-IR')} عدد است. لطفا اصلاحات انبار انجام دهید.`,
              severity: 'CRITICAL',
              entity_type: 'item',
              entity_id: item.id,
              action_url: `/inventory/low-stock`,
            });
          }
        }
        // 2. Out of Stock
        else if (totalQty === 0) {
          if (!NotificationRepository.existsDuplicate(businessId, 'OUT_OF_STOCK', item.id)) {
            NotificationRepository.create({
              business_id: businessId,
              category: 'INVENTORY',
              type: 'OUT_OF_STOCK',
              title: `اتمام موجودی: ${itemName}`,
              message: `موجودی کالا ${itemName} ${itemCode} به صفر رسیده است.`,
              severity: 'ERROR',
              entity_type: 'item',
              entity_id: item.id,
              action_url: `/inventory/low-stock`,
            });
          }
        }
        // 3. Low Stock
        else if (totalQty <= minStock) {
          if (!NotificationRepository.existsDuplicate(businessId, 'LOW_STOCK', item.id)) {
            NotificationRepository.create({
              business_id: businessId,
              category: 'INVENTORY',
              type: 'LOW_STOCK',
              title: `هشدار نقطه سفارش: ${itemName}`,
              message: `موجودی کالا ${itemName} ${itemCode} (${totalQty.toLocaleString('fa-IR')}) کمتر از حد حداقل (${minStock.toLocaleString('fa-IR')}) است.`,
              severity: 'WARNING',
              entity_type: 'item',
              entity_id: item.id,
              action_url: `/inventory/low-stock`,
            });
          }
        }
      });
    } catch (e) {
      console.error('InventoryNotificationGenerator error:', e);
    }
  }
}
