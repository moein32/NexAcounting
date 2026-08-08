import { db } from '../lib/sqlite';
import { SettingsRepository } from '../repositories';
import { AccountingEngine } from './accountingEngine';

export type CostMethod = 'weighted_average' | 'fifo';

export interface CostLayer {
  id: string;
  business_id: string;
  item_id: string;
  warehouse_id: string;
  quantity: number;
  remaining_quantity: number;
  unit_cost: number;
  document_item_id: string;
  created_at: string;
  updated_at: string;
}

export interface CostMovement {
  id: string;
  business_id: string;
  document_item_id: string;
  layer_id: string;
  quantity: number;
  unit_cost: number;
  type: 'sales_issue' | 'sales_return_restoration' | 'purchase_return_reduction';
  created_at: string;
}

export interface CogsEntry {
  id: string;
  business_id: string;
  document_id: string;
  item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface RevaluationLog {
  id: string;
  business_id: string;
  item_id: string;
  warehouse_id: string;
  old_unit_cost: number;
  new_unit_cost: number;
  quantity: number;
  reason: string;
  created_at: string;
}

export const CostEngine = {
  getCostMethod(businessId: string): CostMethod {
    const method = SettingsRepository.get('inventory_cost_method');
    return (method === 'fifo' || method === 'weighted_average') ? method : 'weighted_average';
  },

  isCostMethodLocked(businessId: string): boolean {
    const cogs = db.queryAll<CogsEntry>('cogs_entries').filter(c => c.business_id === businessId);
    if (cogs.length > 0) return true;
    const movements = db.queryAll<CostMovement>('inventory_cost_movements').filter(m => m.business_id === businessId);
    return movements.length > 0;
  },

  setCostMethod(businessId: string, method: CostMethod): void {
    if (this.isCostMethodLocked(businessId)) {
      throw new Error('به دلیل وجود اسناد مالی و حرکتی صادر شده در این سال مالی، امکان تغییر مستقیم روش ارزش‌گذاری وجود ندارد. برای تغییر روش، ابتدا باید بازسازی کلیه Layerها انجام شود.');
    }
    SettingsRepository.set('inventory_cost_method', method);
  },

  /**
   * Process a confirmed purchase invoice to create cost layers.
   */
  handlePurchase(businessId: string, doc: any): void {
    if (!doc.items || doc.items.length === 0) return;
    const method = this.getCostMethod(businessId);
    const warehouseId = doc.warehouse_id;

    if (!warehouseId) return;

    doc.items.forEach((item: any) => {
      // Only process actual catalog items that represent physical goods
      const isProduct = this.checkIsProduct(businessId, item.item_id);
      if (!isProduct) return;

      const purchaseQty = Number(item.quantity);
      const purchasePrice = Number(item.unit_price);
      if (purchaseQty <= 0) return;

      if (method === 'weighted_average') {
        // Retrieve existing active layers for this warehouse/item
        const allLayers = db.queryAll<CostLayer>('inventory_cost_layers');
        const existingLayers = allLayers.filter(
          (l) => l.business_id === businessId && l.item_id === item.item_id && l.warehouse_id === warehouseId && l.remaining_quantity > 0
        );

        const existingQty = existingLayers.reduce((sum, l) => sum + l.remaining_quantity, 0);
        const existingValue = existingLayers.reduce((sum, l) => sum + l.remaining_quantity * l.unit_cost, 0);

        const totalQty = existingQty + purchaseQty;
        // In case of negative stock layer, reset totalQty bound to avoid infinity
        const newAvgCost = totalQty > 0 ? (existingValue + purchaseQty * purchasePrice) / totalQty : purchasePrice;

        // Update all existing active layers to the new running average cost
        existingLayers.forEach((l) => {
          l.unit_cost = newAvgCost;
          l.updated_at = new Date().toISOString();
          db.updateRecord('inventory_cost_layers', l.id, l);
        });

        // Insert new layer at the weighted average cost
        const newLayer: CostLayer = {
          id: `layer_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          business_id: businessId,
          item_id: item.item_id,
          warehouse_id: warehouseId,
          quantity: purchaseQty,
          remaining_quantity: purchaseQty,
          unit_cost: newAvgCost,
          document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.insertRecord('inventory_cost_layers', newLayer);

      } else {
        // FIFO costing: simply append new cost layer without modifying previous layers
        const newLayer: CostLayer = {
          id: `layer_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          business_id: businessId,
          item_id: item.item_id,
          warehouse_id: warehouseId,
          quantity: purchaseQty,
          remaining_quantity: purchaseQty,
          unit_cost: purchasePrice,
          document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.insertRecord('inventory_cost_layers', newLayer);
      }
    });
  },

  /**
   * Process a confirmed sales invoice to determine COGS, consume layers, and record movements.
   */
  handleSale(businessId: string, doc: any): void {
    if (!doc.items || doc.items.length === 0) return;
    const warehouseId = doc.warehouse_id;
    if (!warehouseId) return;

    let totalDocumentCOGS = 0;

    doc.items.forEach((item: any) => {
      const isProduct = this.checkIsProduct(businessId, item.item_id);
      if (!isProduct) return;

      const saleQty = Number(item.quantity);
      if (saleQty <= 0) return;

      // 1. Find active layers for this product and warehouse, sorted chronologically (FIFO order)
      const allLayers = db.queryAll<CostLayer>('inventory_cost_layers');
      const activeLayers = allLayers
        .filter((l) => l.business_id === businessId && l.item_id === item.item_id && l.warehouse_id === warehouseId && l.remaining_quantity > 0)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

      let remainingToConsume = saleQty;
      let totalItemCost = 0;

      // Iterate through layers and consume quantities
      for (const layer of activeLayers) {
        if (remainingToConsume <= 0) break;

        const qtyFromThisLayer = Math.min(layer.remaining_quantity, remainingToConsume);
        layer.remaining_quantity -= qtyFromThisLayer;
        layer.updated_at = new Date().toISOString();
        db.updateRecord('inventory_cost_layers', layer.id, layer);

        // Record cost movement
        const movement: CostMovement = {
          id: `mv_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          business_id: businessId,
          document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          layer_id: layer.id,
          quantity: qtyFromThisLayer,
          unit_cost: layer.unit_cost,
          type: 'sales_issue',
          created_at: new Date().toISOString(),
        };
        db.insertRecord('inventory_cost_movements', movement);

        totalItemCost += qtyFromThisLayer * layer.unit_cost;
        remainingToConsume -= qtyFromThisLayer;
      }

      // Handle deficit (negative stock situation)
      if (remainingToConsume > 0) {
        const fallbackPrice = this.getItemFallbackPurchasePrice(businessId, item.item_id);
        const qtyFromThisLayer = remainingToConsume;

        // Record deficit layer
        const deficitLayer: CostLayer = {
          id: `layer_deficit_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          business_id: businessId,
          item_id: item.item_id,
          warehouse_id: warehouseId,
          quantity: 0,
          remaining_quantity: -qtyFromThisLayer, // negative representing deficit
          unit_cost: fallbackPrice,
          document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.insertRecord('inventory_cost_layers', deficitLayer);

        // Record deficit movement
        const movement: CostMovement = {
          id: `mv_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          business_id: businessId,
          document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          layer_id: deficitLayer.id,
          quantity: qtyFromThisLayer,
          unit_cost: fallbackPrice,
          type: 'sales_issue',
          created_at: new Date().toISOString(),
        };
        db.insertRecord('inventory_cost_movements', movement);

        totalItemCost += qtyFromThisLayer * fallbackPrice;
        remainingToConsume = 0;
      }

      totalDocumentCOGS += totalItemCost;

      // Register Cogs Entry
      const cogsEntry: CogsEntry = {
        id: `cogs_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        business_id: businessId,
        document_id: doc.id,
        item_id: item.item_id,
        quantity: saleQty,
        unit_cost: totalItemCost / saleQty,
        total_cost: totalItemCost,
        created_at: new Date().toISOString(),
      };
      db.insertRecord('cogs_entries', cogsEntry);
    });

    // 2. Automatically generate Accounting Entry for the COGS!
    if (totalDocumentCOGS > 0) {
      this.postCOGSEntry(businessId, doc, totalDocumentCOGS);
    }
  },

  /**
   * Process a confirmed sales return to restore inventory cost.
   */
  handleSalesReturn(businessId: string, doc: any): void {
    if (!doc.items || doc.items.length === 0) return;
    const warehouseId = doc.warehouse_id;
    if (!warehouseId) return;

    let totalReturnCOGSValue = 0;

    doc.items.forEach((item: any) => {
      const isProduct = this.checkIsProduct(businessId, item.item_id);
      if (!isProduct) return;

      const returnQty = Number(item.quantity);
      if (returnQty <= 0) return;

      // Determine cost to restore:
      // Try to find the cost of this item in the previous sales / layers.
      // If we cannot find it, default to running average or fallback catalog purchase price.
      const fallbackPrice = this.getItemFallbackPurchasePrice(businessId, item.item_id);

      // Create a restored layer for this return
      const restoredLayer: CostLayer = {
        id: `layer_ret_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        business_id: businessId,
        item_id: item.item_id,
        warehouse_id: warehouseId,
        quantity: returnQty,
        remaining_quantity: returnQty,
        unit_cost: fallbackPrice,
        document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.insertRecord('inventory_cost_layers', restoredLayer);

      // Record movement
      const movement: CostMovement = {
        id: `mv_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        business_id: businessId,
        document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        layer_id: restoredLayer.id,
        quantity: returnQty,
        unit_cost: fallbackPrice,
        type: 'sales_return_restoration',
        created_at: new Date().toISOString(),
      };
      db.insertRecord('inventory_cost_movements', movement);

      const itemCost = returnQty * fallbackPrice;
      totalReturnCOGSValue += itemCost;

      // Register negative COGS Entry representing reversal
      const cogsEntry: CogsEntry = {
        id: `cogs_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        business_id: businessId,
        document_id: doc.id,
        item_id: item.item_id,
        quantity: -returnQty,
        unit_cost: fallbackPrice,
        total_cost: -itemCost,
        created_at: new Date().toISOString(),
      };
      db.insertRecord('cogs_entries', cogsEntry);
    });

    // Accounting Entry: Reverse COGS (Debit Inventory 1030, Credit COGS 5010)
    if (totalReturnCOGSValue > 0) {
      this.postSalesReturnCOGSEntry(businessId, doc, totalReturnCOGSValue);
    }
  },

  /**
   * Process a confirmed purchase return to reduce cost layers.
   */
  handlePurchaseReturn(businessId: string, doc: any): void {
    if (!doc.items || doc.items.length === 0) return;
    const warehouseId = doc.warehouse_id;
    if (!warehouseId) return;

    doc.items.forEach((item: any) => {
      const isProduct = this.checkIsProduct(businessId, item.item_id);
      if (!isProduct) return;

      const returnQty = Number(item.quantity);
      if (returnQty <= 0) return;

      // Reduce the remaining quantity of the oldest layers
      const allLayers = db.queryAll<CostLayer>('inventory_cost_layers');
      const activeLayers = allLayers
        .filter((l) => l.business_id === businessId && l.item_id === item.item_id && l.warehouse_id === warehouseId && l.remaining_quantity > 0)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)); // reduce newest/or matching layers first

      let remainingToReduce = returnQty;
      for (const layer of activeLayers) {
        if (remainingToReduce <= 0) break;

        const qtyToReduce = Math.min(layer.remaining_quantity, remainingToReduce);
        layer.remaining_quantity -= qtyToReduce;
        layer.updated_at = new Date().toISOString();
        db.updateRecord('inventory_cost_layers', layer.id, layer);

        // Record movement
        const movement: CostMovement = {
          id: `mv_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          business_id: businessId,
          document_item_id: item.id || `doc_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          layer_id: layer.id,
          quantity: qtyToReduce,
          unit_cost: layer.unit_cost,
          type: 'purchase_return_reduction',
          created_at: new Date().toISOString(),
        };
        db.insertRecord('inventory_cost_movements', movement);

        remainingToReduce -= qtyToReduce;
      }
    });
  },

  /**
   * Reverse cost layers and COGS entries when a document is cancelled.
   */
  handleCancellation(businessId: string, doc: any): void {
    if (doc.document_type === 'sales_invoice') {
      // Restore all consumed layers by finding movements associated with this invoice's items
      const docItems = db.queryAll<any>('document_items').filter(di => di.document_id === doc.id);
      const docItemIds = docItems.map(di => di.id);

      const allMovements = db.queryAll<CostMovement>('inventory_cost_movements');
      const movementsToReverse = allMovements.filter(mv => docItemIds.includes(mv.document_item_id) && mv.type === 'sales_issue');

      movementsToReverse.forEach(mv => {
        const layer = db.queryById('inventory_cost_layers', mv.layer_id) as CostLayer | null;
        if (layer) {
          layer.remaining_quantity += mv.quantity;
          layer.updated_at = new Date().toISOString();
          db.updateRecord('inventory_cost_layers', layer.id, layer);
        }
        // Delete movement
        this.deleteCostMovement(mv.id);
      });

      // Remove Cogs entries
      const cogs = db.queryAll<CogsEntry>('cogs_entries').filter(c => c.document_id === doc.id);
      cogs.forEach(c => {
        this.deleteCogsEntry(c.id);
      });

      // Reverse accounting journal entries associated with COGS
      this.reverseCOGSJournal(businessId, doc.id);

    } else if (doc.document_type === 'purchase_invoice') {
      // Find cost layers created by this purchase invoice
      const itemsList = doc.items || db.queryAll<any>('document_items').filter(di => di.document_id === doc.id);
      const docItemIds = itemsList.map((di: any) => di.id).filter(Boolean);

      const allLayers = db.queryAll<CostLayer>('inventory_cost_layers');
      const layersToDelete = allLayers.filter(
        l => docItemIds.includes(l.document_item_id) || l.document_item_id === doc.id
      );

      // COST ENGINE SAFETY GUARD: Block purchase cancellation if inventory layers were consumed by sales
      for (const layer of layersToDelete) {
        if (layer.quantity - layer.remaining_quantity > 0) {
          throw new Error('امکان لغو این خرید وجود ندارد، زیرا بخشی از موجودی آن در فروشهای بعدی مصرف شده است.');
        }
      }

      layersToDelete.forEach(l => {
        db.deleteRecord('inventory_cost_layers', l.id);
      });
    }
  },

  /**
   * Post standard COGS Accounting journal entry (Debit COGS 5010, Credit Inventory 1030)
   */
  postCOGSEntry(businessId: string, doc: any, totalCOGS: number): void {
    const description = `بهای تمام‌شده فاکتور فروش شماره ${doc.document_number}`;
    const lines = [
      {
        account_code: '5010', // COGS Expense
        party_id: null,
        debit: totalCOGS,
        credit: 0,
        description: `بدهکار: بهای تمام‌شده کالای فروش‌رفته بابت فاکتور فروش ${doc.document_number}`,
      },
      {
        account_code: '1030', // Inventory Asset
        party_id: null,
        debit: 0,
        credit: totalCOGS,
        description: `بستانکار: موجودی کالا بابت فاکتور فروش ${doc.document_number}`,
      }
    ];

    AccountingEngine.createJournalEntry(
      businessId,
      {
        date: doc.document_date,
        description,
        reference_type: 'manual', // or generic financial entry reference
        reference_id: `cogs_${doc.id}`,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * Post Sales Return COGS Accounting entry (Debit Inventory 1030, Credit COGS 5010)
   */
  postSalesReturnCOGSEntry(businessId: string, doc: any, totalCOGS: number): void {
    const description = `برگشت بهای تمام‌شده فاکتور برگشت از فروش شماره ${doc.document_number}`;
    const lines = [
      {
        account_code: '1030', // Inventory Asset
        party_id: null,
        debit: totalCOGS,
        credit: 0,
        description: `بدهکار: موجودی کالا بابت برگشت از فروش ${doc.document_number}`,
      },
      {
        account_code: '5010', // COGS Expense Reversal (credit expense)
        party_id: null,
        debit: 0,
        credit: totalCOGS,
        description: `بستانکار: بهای تمام‌شده کالای برگشتی بابت فاکتور برگشت از فروش ${doc.document_number}`,
      }
    ];

    AccountingEngine.createJournalEntry(
      businessId,
      {
        date: doc.document_date,
        description,
        reference_type: 'manual',
        reference_id: `cogs_ret_${doc.id}`,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * Reverse COGS journal entries
   */
  reverseCOGSJournal(businessId: string, docId: string): void {
    const allEntries = db.queryAll<any>('journal_entries');
    const target = allEntries.find(e => e.reference_id === `cogs_${docId}` && e.status === 'posted');
    if (target) {
      AccountingEngine.reverseEntry(target.id, businessId);
    }
  },

  /**
   * Helper to fetch inventory summary/valuation by product and warehouse.
   */
  getWarehouseProductValuation(businessId: string, warehouseId: string, itemId: string): { quantity: number; value: number; average_cost: number } {
    const layers = db.queryAll<CostLayer>('inventory_cost_layers').filter(
      l => l.business_id === businessId && l.item_id === itemId && l.warehouse_id === warehouseId && l.remaining_quantity !== 0
    );

    const quantity = layers.reduce((sum, l) => sum + l.remaining_quantity, 0);
    const value = layers.reduce((sum, l) => sum + (l.remaining_quantity * l.unit_cost), 0);
    const average_cost = quantity > 0 ? value / quantity : this.getItemFallbackPurchasePrice(businessId, itemId);

    return {
      quantity,
      value,
      average_cost,
    };
  },

  /**
   * Calculate overall product-level details (summed across all warehouses).
   */
  getProductValuation(businessId: string, itemId: string): { quantity: number; value: number; average_cost: number } {
    const layers = db.queryAll<CostLayer>('inventory_cost_layers').filter(
      l => l.business_id === businessId && l.item_id === itemId && l.remaining_quantity !== 0
    );

    const quantity = layers.reduce((sum, l) => sum + l.remaining_quantity, 0);
    const value = layers.reduce((sum, l) => sum + (l.remaining_quantity * l.unit_cost), 0);
    const average_cost = quantity > 0 ? value / quantity : this.getItemFallbackPurchasePrice(businessId, itemId);

    return {
      quantity,
      value,
      average_cost,
    };
  },

  /**
   * Revaluate inventory manually.
   */
  revaluateInventory(businessId: string, itemId: string, warehouseId: string, newUnitCost: number, reason: string): void {
    db.beginTransaction();
    try {
      const layers = db.queryAll<CostLayer>('inventory_cost_layers').filter(
        l => l.business_id === businessId && l.item_id === itemId && l.warehouse_id === warehouseId && l.remaining_quantity > 0
      );

      const totalQty = layers.reduce((sum, l) => sum + l.remaining_quantity, 0);
      if (totalQty <= 0) {
        throw new Error('کالای مورد نظر در این انبار موجودی جهت تجدید ارزیابی ندارد.');
      }

      const totalOldValue = layers.reduce((sum, l) => sum + (l.remaining_quantity * l.unit_cost), 0);
      const totalNewValue = totalQty * newUnitCost;
      const difference = totalNewValue - totalOldValue;

      // Update unit costs of all active layers to the new cost
      layers.forEach(l => {
        const log: RevaluationLog = {
          id: `rev_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          business_id: businessId,
          item_id: itemId,
          warehouse_id: warehouseId,
          old_unit_cost: l.unit_cost,
          new_unit_cost: newUnitCost,
          quantity: l.remaining_quantity,
          reason,
          created_at: new Date().toISOString()
        };
        db.insertRecord('inventory_revaluation_logs', log);

        l.unit_cost = newUnitCost;
        l.updated_at = new Date().toISOString();
        db.updateRecord('inventory_cost_layers', l.id, l);
      });

      // Post Revaluation Journal Entry
      // If value increased: Debit Inventory (1030), Credit Capital/Retained Earnings or Revaluation Surplus (3010)
      // If value decreased: Credit Inventory (1030), Debit Revaluation Loss or Expense (5040)
      if (difference !== 0) {
        const description = `تعدیل بهای موجودی انبار بابت تجدید ارزیابی: ${reason}`;
        const lines = difference > 0
          ? [
              {
                account_code: '1030', // Inventory
                debit: difference,
                credit: 0,
                description: `افزایش بهای دفتری موجودی کالا`,
              },
              {
                account_code: '4010', // Standard surplus/revenue account
                debit: 0,
                credit: difference,
                description: `مازاد تجدید ارزیابی موجودی انبار`,
              }
            ]
          : [
              {
                account_code: '5040', // Current expense / loss
                debit: Math.abs(difference),
                credit: 0,
                description: `زیان ناشی از کاهش بهای تجدید ارزیابی کالا`,
              },
              {
                account_code: '1030', // Inventory
                debit: 0,
                credit: Math.abs(difference),
                description: `کاهش بهای دفتری موجودی کالا`,
              }
            ];

        AccountingEngine.createJournalEntry(
          businessId,
          {
            date: new Date().toISOString().split('T')[0],
            description,
            reference_type: 'manual',
            reference_id: `reval_${Date.now()}`,
            status: 'posted',
          },
          lines
        );
      }

      db.commit();
    } catch (e) {
      db.rollback();
      throw e;
    }
  },

  // INTERNAL HELPERS
  checkIsProduct(businessId: string, itemId: string): boolean {
    const item = db.queryById('items', itemId) as any;
    // Assume products default to tracking stock and having type product
    return item ? item.type === 'product' : true;
  },

  getItemFallbackPurchasePrice(businessId: string, itemId: string): number {
    const item = db.queryById('items', itemId) as any;
    return item ? Number(item.purchase_price || item.price || 0) : 0;
  },

  deleteCostMovement(id: string): void {
    db.deleteRecord('inventory_cost_movements', id);
  },

  deleteCogsEntry(id: string): void {
    db.deleteRecord('cogs_entries', id);
  }
};
