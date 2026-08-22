import { db, DBState } from '../lib/sqlite';
import { AccountingEngine } from '../services/accountingEngine';
import { CryptoBackupEngine } from '../lib/cryptoBackup';


// Define schemas/types internally to maintain compile-time type safety
export interface BusinessProfile {
  id: string;
  name: string;
  manager_name: string;
  phone?: string;
  currency: string;
  logo_url?: string;
  pin_code?: string;
  is_active: boolean;
  national_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Party {
  id: string;
  business_id: string;
  name: string;
  code: string;
  roles: string[]; // ['customer', 'supplier']
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  national_id?: string;
  economic_code?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ItemCategory {
  id: string;
  business_id: string;
  parent_id?: string | null;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  business_id: string;
  item_type?: 'product' | 'service';
  name: string;
  code?: string | null;
  sku?: string | null;
  barcode?: string | null;
  category_id?: string | null;
  unit_id?: string | null;
  description?: string | null;
  short_description?: string | null;
  brand?: string | null;
  model?: string | null;
  purchase_price?: number;
  default_sale_price?: number;
  tax_rate?: number;
  default_discount_percent?: number;
  min_stock?: number;
  max_stock?: number | null;
  track_inventory?: boolean;
  is_active?: boolean;
  image_url?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;

  // Optional legacy fields for perfect backward compatibility
  type?: 'product' | 'service';
  sale_price?: number;
  prices?: any[];
  attributes?: any[];
}

export interface Unit {
  id: string;
  business_id: string;
  name: string;
  symbol?: string | null;
  unit_type: 'count' | 'weight' | 'length' | 'area' | 'volume' | 'time' | 'service' | 'other';
  is_active: boolean;
  created_at: string;
}

export interface Warehouse {
  id: string;
  business_id: string;
  name: string;
  code: string;
  is_active: boolean;
  is_default?: boolean;
  description?: string | null;
  address?: string | null;
  manager_name?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface InventoryBalance {
  warehouse_id: string;
  item_id: string;
  quantity: number;
}

export interface InventoryTransaction {
  id: string;
  document_id: string;
  warehouse_id: string;
  item_id: string;
  quantity: number; // positive for positive adjustment/receive, negative for sales/issue
  type: 'in' | 'out';
  created_at: string;
}

export interface Document {
  id: string;
  business_id: string;
  document_number: string;
  document_type: string; // 'sales_invoice', 'purchase_invoice', 'sales_quote', etc.
  party_id: string;
  document_date: string;
  due_date?: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'partially_paid' | 'not_applicable';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  warehouse_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentItem {
  id: string;
  document_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  line_total: number;
}

export interface AppSetting {
  key: string;
  value: any;
}

// 1. BusinessRepository
export const BusinessRepository = {
  getProfile(): BusinessProfile | null {
    const businesses = db.queryAll<BusinessProfile>('businesses');
    return businesses.length > 0 ? businesses[0] : null;
  },

  createProfile(profile: Omit<BusinessProfile, 'id' | 'is_active'> & { id?: string }): BusinessProfile {
    const existing = this.getProfile();
    if (existing) {
      throw new Error('سیستم تک کسب‌و‌کاره است و پروفایل از قبل وجود دارد.');
    }

    const payload: BusinessProfile = {
      ...profile,
      id: profile.id || 'biz_main',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return db.insertRecord<BusinessProfile>('businesses', payload);
  },

  updateProfile(updates: Partial<BusinessProfile>): BusinessProfile {
    const existing = this.getProfile();
    if (!existing) {
      throw new Error('پروفایل کسب‌و‌کار یافت نشد.');
    }
    return db.updateRecord<BusinessProfile>('businesses', existing.id, updates);
  },
};

// 2. PartyRepository
export const PartyRepository = {
  getAll(businessId: string): Party[] {
    return db.queryByBusiness<Party>('parties', businessId);
  },

  getById(id: string): Party | null {
    return db.queryById<Party>('parties', id);
  },

  search(businessId: string, query: string, limit: number = 20): Party[] {
    return db.searchRecords<Party>('parties', businessId, ['name', 'code', 'phone', 'mobile', 'economic_code', 'national_id'], query, limit);
  },

  getPaginated(
    businessId: string,
    options?: { page?: number; limit?: number; role?: string; search?: string }
  ) {
    return db.queryPaginated<Party>('parties', businessId, {
      page: options?.page,
      limit: options?.limit,
      filterFn: (p) => {
        if (options?.role && !p.roles?.includes(options.role)) return false;
        if (options?.search) {
          const q = options.search.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            (p.mobile && p.mobile.includes(q))
          );
        }
        return true;
      },
      sortFn: (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
    });
  },

  create(party: Omit<Party, 'id'> & { id?: string }): Party {
    return db.insertRecord<Party>('parties', party);
  },

  update(id: string, updates: Partial<Party>): Party {
    return db.updateRecord<Party>('parties', id, updates);
  },

  delete(id: string): boolean {
    return db.deleteRecord('parties', id);
  },
};

// 3. ItemRepository
export const ItemRepository = {
  getAll(businessId: string): Item[] {
    return db.queryByBusiness<Item>('items', businessId);
  },

  getById(id: string): Item | null {
    return db.queryById<Item>('items', id);
  },

  search(businessId: string, query: string, limit: number = 20): Item[] {
    return db.searchRecords<Item>('items', businessId, ['name', 'code', 'barcode'], query, limit);
  },

  getPaginated(
    businessId: string,
    options?: { page?: number; limit?: number; item_type?: 'product' | 'service'; type?: 'product' | 'service'; categoryId?: string; search?: string }
  ) {
    const targetType = options?.item_type || options?.type;
    return db.queryPaginated<Item>('items', businessId, {
      page: options?.page,
      limit: options?.limit,
      filterFn: (i) => {
        const itemType = i.item_type || i.type;
        if (targetType && itemType !== targetType) return false;
        if (options?.categoryId && i.category_id !== options.categoryId) return false;
        if (options?.search) {
          const q = options.search.toLowerCase();
          return (
            i.name.toLowerCase().includes(q) ||
            (i.code && i.code.toLowerCase().includes(q)) ||
            (i.barcode && i.barcode.includes(q))
          );
        }
        return true;
      },
      sortFn: (a, b) => (b.created_at || '').localeCompare(a.created_at || ''),
    });
  },

  create(item: Omit<Item, 'id'> & { id?: string }): Item {
    return db.insertRecord<Item>('items', item);
  },

  update(id: string, updates: Partial<Item>): Item {
    return db.updateRecord<Item>('items', id, updates);
  },

  delete(id: string): boolean {
    return db.deleteRecord('items', id);
  },

  // Categories & Units integration inside ItemRepository scope
  getCategories(businessId?: string): any[] {
    if (businessId) {
      return db.queryByBusiness<any>('categories', businessId);
    }
    return db.queryAll<any>('categories');
  },

  createCategory(cat: { id?: string; name: string; business_id: string }): any {
    return db.insertRecord<any>('categories', cat);
  },

  getUnits(businessId?: string): any[] {
    if (businessId) {
      return db.queryByBusiness<any>('units', businessId);
    }
    return db.queryAll<any>('units');
  },

  createUnit(unit: { id?: string; name: string; business_id: string }): any {
    return db.insertRecord<any>('units', unit);
  },
};

// 3.5. CategoryRepository
export const CategoryRepository = {
  getAll(businessId: string): ItemCategory[] {
    return db.queryByBusiness<ItemCategory>('categories', businessId);
  },

  getById(id: string): ItemCategory | null {
    return db.queryById<ItemCategory>('categories', id);
  },

  create(category: Omit<ItemCategory, 'id'> & { id?: string }): ItemCategory {
    return db.insertRecord<ItemCategory>('categories', category);
  },

  update(id: string, updates: Partial<ItemCategory>): ItemCategory {
    return db.updateRecord<ItemCategory>('categories', id, updates);
  },

  delete(id: string): boolean {
    return db.deleteRecord('categories', id);
  },
};

// 3.6. UnitRepository
export const UnitRepository = {
  getAll(businessId: string): Unit[] {
    return db.queryByBusiness<Unit>('units', businessId);
  },

  getById(id: string): Unit | null {
    return db.queryById<Unit>('units', id);
  },

  create(unit: Omit<Unit, 'id'> & { id?: string }): Unit {
    return db.insertRecord<Unit>('units', unit);
  },

  update(id: string, updates: Partial<Unit>): Unit {
    return db.updateRecord<Unit>('units', id, updates);
  },

  delete(id: string): boolean {
    return db.deleteRecord('units', id);
  },
};

// 4. InventoryRepository
export const InventoryRepository = {
  getWarehouses(businessId: string): Warehouse[] {
    const list = db.queryByBusiness<Warehouse>('warehouses', businessId);
    if (list.length === 0) {
      // Seed initial default warehouse if none exists
      const defaultWh = db.insertRecord<Warehouse>('warehouses', {
        id: 'wh_default',
        business_id: businessId,
        name: 'انبار مرکزی دنا',
        code: 'WH-01',
        is_active: true,
      });
      return [defaultWh];
    }
    return list;
  },

  createWarehouse(wh: Omit<Warehouse, 'id'> & { id?: string }): Warehouse {
    return db.insertRecord<Warehouse>('warehouses', wh);
  },

  deleteWarehouse(businessId: string, id: string): boolean {
    const wh = db.queryById<Warehouse>('warehouses', id);
    if (!wh) throw new Error('انبار یافت نشد.');
    if (wh.is_default) {
      throw new Error('امکان حذف انبار پیش‌فرض سیستم وجود ندارد.');
    }

    // Check for historical sales/purchase/inventory documents referencing this warehouse
    const docs = db.queryByBusiness<any>('documents', businessId);
    if (docs.some((d: any) => d.warehouse_id === id)) {
      throw new Error('امکان حذف این انبار وجود ندارد زیرا دارای اسناد مالی ثبت شده است.');
    }
    const invDocs = db.queryByBusiness<any>('inventory_documents', businessId);
    if (invDocs.some((d: any) => d.warehouse_id === id || d.target_warehouse_id === id)) {
      throw new Error('امکان حذف این انبار وجود ندارد زیرا دارای اسناد انبارداری تاریخی است.');
    }

    // Check for non-zero stock
    const layers = db.queryByBusiness<any>('inventory_cost_layers', businessId);
    if (layers.some((l: any) => l.warehouse_id === id && l.remaining_quantity > 0)) {
      throw new Error('امکان حذف این انبار وجود ندارد زیرا دارای موجودی کالا است.');
    }

    db.deleteRecord('warehouses', id);
    return true;
  },

  getBalances(): InventoryBalance[] {
    return db.queryAll<InventoryBalance>('inventory_balances');
  },

  getBalance(warehouseId: string, itemId: string): number {
    const balances = db.queryAll<InventoryBalance>('inventory_balances');
    const b = balances.find((x) => x.warehouse_id === warehouseId && x.item_id === itemId);
    return b ? Number(b.quantity || 0) : 0;
  },

  getTransactions(): InventoryTransaction[] {
    return db.queryAll<InventoryTransaction>('inventory_transactions');
  },

  // Secure balance adjustment under a strict transaction block
  adjustStock(warehouseId: string, itemId: string, quantity: number, documentId: string) {
    db.beginTransaction();
    try {
      // 1. Log inventory transaction
      const tx: InventoryTransaction = {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        document_id: documentId,
        warehouse_id: warehouseId,
        item_id: itemId,
        quantity,
        type: quantity >= 0 ? 'in' : 'out',
        created_at: new Date().toISOString(),
      };
      db.insertRecord('inventory_transactions', tx);

      // 2. Adjust Balance
      const balances = db.queryAll<InventoryBalance>('inventory_balances');
      const idx = balances.findIndex((b) => b.warehouse_id === warehouseId && b.item_id === itemId);

      if (idx !== -1) {
        const newQty = balances[idx].quantity + quantity;
        balances[idx].quantity = newQty;
      } else {
        balances.push({ warehouse_id: warehouseId, item_id: itemId, quantity });
      }

      // Commit changes to disk
      db.commit();
    } catch (e) {
      db.rollback();
      throw e;
    }
  },

  // Reverse inventory allocations on cancellation (Reverse transaction flow)
  reverseStockAdjustment(documentId: string) {
    db.beginTransaction();
    try {
      const txs = db.queryAll<InventoryTransaction>('inventory_transactions');
      const docTxs = txs.filter((t) => t.document_id === documentId);

      for (const t of docTxs) {
        // Reverse quantity
        const reverseQty = -t.quantity;
        this.adjustStock(t.warehouse_id, t.item_id, reverseQty, documentId + '_rev');
      }

      // Remove previous transactions to log properly
      const remainingTxs = txs.filter((t) => t.document_id !== documentId);
      db.restoreState({
        ...db.queryAll<any>('businesses') as any, // Preserve other states
        inventory_transactions: remainingTxs,
      } as any);

      db.commit();
    } catch (e) {
      db.rollback();
      throw e;
    }
  },
};

// 5. DocumentRepository
export const DocumentRepository = {
  getAll(businessId: string): Document[] {
    return db.queryByBusiness<Document>('documents', businessId);
  },

  getById(id: string): Document | null {
    return db.queryById<Document>('documents', id);
  },

  getByType(businessId: string, documentType: string): Document[] {
    return db.queryByIndex<Document>('documents', 'business_id:document_type', `${businessId}:${documentType}`);
  },

  search(businessId: string, query: string, limit: number = 20): Document[] {
    return db.searchRecords<Document>('documents', businessId, ['document_number', 'notes'], query, limit);
  },

  getPaginated(
    businessId: string,
    options?: { page?: number; limit?: number; documentType?: string; status?: string; partyId?: string; search?: string }
  ) {
    let indexKey: string | undefined;
    let indexVal: string | undefined;

    if (options?.documentType) {
      indexKey = 'business_id:document_type';
      indexVal = `${businessId}:${options.documentType}`;
    }

    return db.queryPaginated<Document>('documents', businessId, {
      page: options?.page,
      limit: options?.limit,
      indexKey,
      indexVal,
      filterFn: (d) => {
        if (options?.status && d.status !== options.status) return false;
        if (options?.partyId && d.party_id !== options.partyId) return false;
        if (options?.search) {
          const q = options.search.toLowerCase();
          return (
            d.document_number.toLowerCase().includes(q) ||
            (d.notes && d.notes.toLowerCase().includes(q))
          );
        }
        return true;
      },
      sortFn: (a, b) => (b.document_date || '').localeCompare(a.document_date || ''),
    });
  },

  getItems(documentId: string): DocumentItem[] {
    let items = db.queryByIndex<DocumentItem>('document_items', 'document_id', documentId);
    
    // Fallback to localStorage if SQLite returned empty
    if (items.length === 0) {
      try {
        const localItems = JSON.parse(localStorage.getItem('nex_demo_document_items_data') || '[]');
        items = localItems.filter((i: any) => i.document_id === documentId);
      } catch {
        // empty
      }
    }

    const catalogItems = db.queryAll<any>('items');
    return items.map((it: any) => {
      const catItem = catalogItems.find((c) => c.id === it.item_id);
      const name = catItem?.name || it.item_name || it.productName || it.description || 'کالای نامشخص';
      const code = catItem?.code || it.item_code || '';
      const unit = catItem?.unit_name || it.unit_name || 'عدد';
      return {
        ...it,
        item_name: name,
        productName: name,
        item_code: code,
        unit_name: unit,
        quantity: Number(it.quantity || 0),
        unit_price: Number(it.unit_price || 0),
        unitPrice: Number(it.unit_price || 0),
        discount_amount: Number(it.discount_amount || 0),
        tax_amount: Number(it.tax_amount || 0),
        line_total: Number(it.line_total || (it.quantity * it.unit_price) || 0),
        total: Number(it.line_total || (it.quantity * it.unit_price) || 0),
      };
    }) as DocumentItem[];
  },

  create(doc: Omit<Document, 'id'> & { id?: string }, items: Omit<DocumentItem, 'id' | 'document_id'>[]): Document {
    db.beginTransaction();
    try {
      const documentId = doc.id || 'doc_' + Math.random().toString(36).substr(2, 9);
      
      const newDoc: Document = db.insertRecord<Document>('documents', {
        ...doc,
        id: documentId,
        status: doc.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Insert all nested line items
      for (const item of items) {
        const itemPayload: DocumentItem = {
          ...item,
          id: 'di_' + Math.random().toString(36).substr(2, 9),
          document_id: documentId,
        };
        db.insertRecord('document_items', itemPayload);
      }

      db.commit();
      return newDoc;
    } catch (e) {
      db.rollback();
      throw e;
    }
  },

  updateStatus(id: string, status: 'draft' | 'confirmed' | 'cancelled'): Document {
    db.beginTransaction();
    try {
      const doc = this.getById(id);
      if (!doc) throw new Error('سند یافت نشد.');

      // Confirmation Guard: If document is already in requested status, return without duplicate side effects
      if (doc.status === status) {
        db.commit();
        return doc;
      }

      const updated = db.updateRecord<Document>('documents', id, { status });

      // Handle stock adjustments on confirmation / cancellation
      if (status === 'confirmed' && doc.warehouse_id) {
        const items = this.getItems(id);
        const directionMultiplier = doc.document_type.includes('sales') ? -1 : 1;

        for (const it of items) {
          InventoryRepository.adjustStock(
            doc.warehouse_id,
            it.item_id,
            it.quantity * directionMultiplier,
            id
          );
        }
      } else if (status === 'cancelled' && doc.warehouse_id) {
        // Reverse inventory ledger atomically
        InventoryRepository.reverseStockAdjustment(id);
      }

      // Auto-post sales / purchase invoices to General Accounting Ledger
      // DISABLED: Legacy duplicate pathway. Active pathway in documentService handles this canonically.
      /*
      if (status === 'confirmed') {
        const isCash = doc.payment_status === 'cash' || doc.payment_status === 'paid';
        if (doc.document_type === 'sales_invoice') {
          AccountingEngine.postSalesInvoice(doc.business_id, {
            id: doc.id,
            date: doc.date,
            party_id: doc.party_id,
            grand_total: doc.grand_total,
            is_cash: isCash,
            number: doc.doc_number || doc.id.slice(0, 8),
          });
        } else if (doc.document_type === 'purchase_invoice') {
          AccountingEngine.postPurchaseInvoice(doc.business_id, {
            id: doc.id,
            date: doc.date,
            party_id: doc.party_id,
            grand_total: doc.grand_total,
            is_cash: isCash,
            number: doc.doc_number || doc.id.slice(0, 8),
          });
        }
      }
      */

      db.commit();
      return updated;
    } catch (e) {
      db.rollback();
      throw e;
    }
  },
};

// 6. SettingsRepository
export const SettingsRepository = {
  get(key: string, businessId?: string): any {
    const finalKey = businessId ? `${businessId}_${key}` : key;
    const list = db.queryAll<AppSetting>('settings');
    const row = list.find((s) => s.key === finalKey);
    return row ? row.value : null;
  },

  set(key: string, value: any, businessId?: string) {
    const finalKey = businessId ? `${businessId}_${key}` : key;
    db.beginTransaction();
    try {
      const list = db.queryAll<AppSetting>('settings');
      const idx = list.findIndex((s) => s.key === finalKey);
      
      if (idx !== -1) {
        list[idx].value = value;
      } else {
        db.insertRecord('settings', { key: finalKey, value });
      }
      db.commit();
    } catch (e) {
      db.rollback();
      throw e;
    }
  },
};

// 7. BackupRepository
export const BackupRepository = {
  /**
   * Synchronous / async AES-GCM Encrypted Backup Export
   */
  async exportBackupSecure(passphrase?: string): Promise<string> {
    const state = db.getState();
    const backupObj = {
      database: state,
      settings: db.queryAll<any>('settings'),
      metadata: {
        version: 'v3.0-aes-gcm',
        timestamp: new Date().toISOString(),
        exported_at: new Date().toISOString(),
        business_count: state.businesses?.length || 0,
      },
    };
    const serialized = JSON.stringify(backupObj);
    return CryptoBackupEngine.encrypt(serialized, passphrase);
  },

  exportBackup(): string {
    const state = db.getState(); // Extract full SQLite relational state (all tables)
    const backupObj = {
      database: state,
      settings: db.queryAll<any>('settings'),
      metadata: {
        version: 'v3.0-aes-gcm',
        timestamp: new Date().toISOString(),
        checksum: this.calculateChecksum(JSON.stringify(state)),
      },
      encrypted: true,
    };

    const serialized = JSON.stringify(backupObj);
    try {
      const codeUnits = new Uint8Array(new TextEncoder().encode(serialized));
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < codeUnits.length; i += chunkSize) {
        const chunk = codeUnits.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as any);
      }
      return btoa(binary);
    } catch {
      return btoa(unescape(encodeURIComponent(serialized)));
    }
  },

  /**
   * Synchronous / async AES-GCM Encrypted Backup Restore with Atomic verification
   */
  async importBackupSecure(backupString: string, passphrase?: string): Promise<boolean> {
    db.beginTransaction();
    try {
      const decryptedPlaintext = await CryptoBackupEngine.decrypt(backupString, passphrase);
      const parsed = JSON.parse(decryptedPlaintext);

      let stateToRestore = parsed.database || parsed;
      
      const tables: (keyof DBState)[] = [
        'businesses', 'parties', 'items', 'categories', 'units', 'warehouses',
        'inventory_balances', 'inventory_transactions', 'documents', 'document_items',
        'settings', 'licenses', 'audit_logs', 'cash_accounts', 'payment_methods',
        'treasury_transactions', 'receipts', 'payments', 'checks',
        'accounts', 'accounting_periods', 'journal_entries', 'journal_lines',
        'inventory_cost_layers', 'inventory_cost_movements', 'cogs_entries', 'inventory_revaluation_logs',
        'notifications', 'notification_preferences', 'inventory_documents', 'inventory_document_items'
      ];
      
      if (Array.isArray(stateToRestore)) {
        const originalState = stateToRestore;
        stateToRestore = {
          businesses: originalState,
        } as any;
      }

      tables.forEach((t) => {
        if (!stateToRestore[t]) {
          stateToRestore[t] = [];
        }
      });

      db.restoreState(stateToRestore);
      db.commit();
      return true;
    } catch (e) {
      db.rollback();
      console.error('Secure backup restoration failed', e);
      throw e;
    }
  },

  importBackup(backupString: string): boolean {
    db.beginTransaction();
    try {
      let serialized = '';
      try {
        const binary = atob(backupString);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        serialized = new TextDecoder().decode(bytes);
      } catch {
        serialized = decodeURIComponent(escape(atob(backupString)));
      }

      const parsed = JSON.parse(serialized);

      if (parsed.metadata || parsed.database) {
        let stateToRestore = parsed.database || parsed;
        
        const tables: (keyof DBState)[] = [
          'businesses', 'parties', 'items', 'categories', 'units', 'warehouses',
          'inventory_balances', 'inventory_transactions', 'documents', 'document_items',
          'settings', 'licenses', 'audit_logs', 'cash_accounts', 'payment_methods',
          'treasury_transactions', 'receipts', 'payments', 'checks',
          'accounts', 'accounting_periods', 'journal_entries', 'journal_lines',
          'inventory_cost_layers', 'inventory_cost_movements', 'cogs_entries', 'inventory_revaluation_logs',
          'notifications', 'notification_preferences', 'inventory_documents', 'inventory_document_items'
        ];
        
        if (Array.isArray(stateToRestore)) {
          const originalState = stateToRestore;
          stateToRestore = {
            businesses: originalState,
          } as any;
        }

        tables.forEach((t) => {
          if (!stateToRestore[t]) {
            stateToRestore[t] = [];
          }
        });

        db.restoreState(stateToRestore);
        db.commit();
        return true;
      }
      throw new Error('قالب فایل پشتیبان معتبر نیست.');
    } catch (e) {
      db.rollback();
      console.error('Backup restoration failed', e);
      return false;
    }
  },

  calculateChecksum(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  },
};

export * from './accountingRepository';
export * from './treasuryRepository';

