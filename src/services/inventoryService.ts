import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { itemService } from './itemService';
import { unitService } from './unitService';
import {
  Warehouse,
  WarehouseLocation,
  InventoryBalance,
  InventoryTransaction,
  InventoryDocument,
  InventoryDocumentItem,
  StockCount,
  StockCountItem,
  TransactionType,
  InventoryDocumentType,
  InventoryDocumentStatus,
  InventoryFilters,
} from '../types/inventory';
import { Item } from '../types/catalog';

const STORAGE_KEYS = {
  WAREHOUSES: 'nex_demo_warehouses',
  LOCATIONS: 'nex_demo_warehouse_locations',
  BALANCES: 'nex_demo_inventory_balances',
  TRANSACTIONS: 'nex_demo_inventory_transactions',
  DOCUMENTS: 'nex_demo_inventory_documents',
  DOCUMENT_ITEMS: 'nex_demo_inventory_document_items',
  STOCK_COUNTS: 'nex_demo_stock_counts',
  STOCK_COUNT_ITEMS: 'nex_demo_stock_count_items',
  ALLOW_NEG: 'nex_demo_allow_negative_stock',
};

// Initial Demo Data
const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh_1',
    business_id: 'demo_biz_1',
    name: 'انبار مرکزی',
    code: 'WH-001',
    description: 'انبار اصلی نگهداری محصولات نهایی و ملزومات تولید',
    address: 'تهران، جاده دماوند، منطقه صنعتی خرمدشت، خیابان سوم شرقی',
    manager_name: 'علیرضا رضایی',
    phone: '02177334455',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'wh_2',
    business_id: 'demo_biz_1',
    name: 'انبار مواد اولیه',
    code: 'WH-002',
    description: 'محل ذخیره‌سازی پروفیل‌های UPVC، آلومینیوم و شیشه خام',
    address: 'تهران، بزرگراه فتح، کیلومتر ۹، کوچه صنایع سنتی',
    manager_name: 'حمید صالحی',
    phone: '02166889900',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'wh_3',
    business_id: 'demo_biz_1',
    name: 'انبار شعبه تهران',
    code: 'WH-003',
    description: 'انبار توزیع موقت و پروژه‌ای غرب تهران',
    address: 'تهران، صادقیه، بلوار فردوس، پلاک ۱۴',
    manager_name: 'سارا حسینی',
    phone: '02144556677',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  }
];

const INITIAL_LOCATIONS: WarehouseLocation[] = [
  { id: 'loc_1_1', warehouse_id: 'wh_1', name: 'قفسه A-01', code: 'A-01', description: 'بخش جنوبی انبار مرکزی', is_active: true, created_at: new Date().toISOString() },
  { id: 'loc_1_2', warehouse_id: 'wh_1', name: 'قفسه A-02', code: 'A-02', description: 'بخش جنوبی انبار مرکزی', is_active: true, created_at: new Date().toISOString() },
  { id: 'loc_1_3', warehouse_id: 'wh_1', name: 'قفسه B-01', code: 'B-01', description: 'بخش میانی انبار مرکزی', is_active: true, created_at: new Date().toISOString() },
  { id: 'loc_2_1', warehouse_id: 'wh_2', name: 'سالن اصلی ۱', code: 'S-01', description: 'پروفیل‌های آلومینیوم', is_active: true, created_at: new Date().toISOString() }
];

const INITIAL_BALANCES: InventoryBalance[] = [
  { id: 'bal_1_1', business_id: 'demo_biz_1', warehouse_id: 'wh_1', item_id: 'item_1', quantity: 25, reserved_quantity: 2, available_quantity: 23, updated_at: new Date().toISOString() },
  { id: 'bal_1_2', business_id: 'demo_biz_1', warehouse_id: 'wh_1', item_id: 'item_2', quantity: 12, reserved_quantity: 0, available_quantity: 12, updated_at: new Date().toISOString() },
  { id: 'bal_1_3', business_id: 'demo_biz_1', warehouse_id: 'wh_1', item_id: 'item_3', quantity: 85, reserved_quantity: 5, available_quantity: 80, updated_at: new Date().toISOString() },
  { id: 'bal_2_1', business_id: 'demo_biz_1', warehouse_id: 'wh_2', item_id: 'item_1', quantity: 5, reserved_quantity: 0, available_quantity: 5, updated_at: new Date().toISOString() },
  { id: 'bal_2_2', business_id: 'demo_biz_1', warehouse_id: 'wh_2', item_id: 'item_2', quantity: 2, reserved_quantity: 0, available_quantity: 2, updated_at: new Date().toISOString() }
];

const INITIAL_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'tx_1',
    business_id: 'demo_biz_1',
    warehouse_id: 'wh_1',
    item_id: 'item_1',
    transaction_type: 'opening_balance',
    quantity: 25,
    unit_cost: 1850000,
    reference_type: 'system',
    reference_id: null,
    description: 'موجودی اولیه سیستم',
    transaction_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    created_by: 'demo_user',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx_2',
    business_id: 'demo_biz_1',
    warehouse_id: 'wh_1',
    item_id: 'item_2',
    transaction_type: 'opening_balance',
    quantity: 12,
    unit_cost: 3400000,
    reference_type: 'system',
    reference_id: null,
    description: 'موجودی اولیه سیستم',
    transaction_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    created_by: 'demo_user',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx_3',
    business_id: 'demo_biz_1',
    warehouse_id: 'wh_1',
    item_id: 'item_3',
    transaction_type: 'opening_balance',
    quantity: 85,
    unit_cost: 620000,
    reference_type: 'system',
    reference_id: null,
    description: 'موجودی اولیه سیستم',
    transaction_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    created_by: 'demo_user',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  }
];

// LocalStorage helpers
import { db } from '../lib/sqlite';
import { InventoryRepository, ItemRepository } from '../repositories';

function getDemoItems(businessId: string): any[] {
  try {
    const dbItems = ItemRepository.getAll(businessId);
    if (dbItems && dbItems.length > 0) {
      return dbItems;
    }
    const raw = localStorage.getItem('nex_items_data') || localStorage.getItem('nex_demo_items_data');
    if (raw) {
      return JSON.parse(raw).filter((i: any) => i.business_id === businessId || !i.business_id);
    }
    return [];
  } catch {
    return [];
  }
}

function getFromStorage<T>(key: string, initial: T[]): T[] {
  try {
    if (key === STORAGE_KEYS.WAREHOUSES) {
      const list = db.queryAll<Warehouse>('warehouses');
      if (list.length === 0) return initial as unknown as T[];
      return list as unknown as T[];
    }
    if (key === STORAGE_KEYS.BALANCES) {
      const list = InventoryRepository.getBalances() as unknown as T[];
      if (list.length === 0) return initial;
      return list;
    }
    if (key === STORAGE_KEYS.TRANSACTIONS) {
      const list = InventoryRepository.getTransactions() as unknown as T[];
      if (list.length === 0) return initial;
      return list;
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function setToStorage<T>(key: string, data: T[]) {
  try {
    if (key === STORAGE_KEYS.WAREHOUSES) {
      (data as unknown as Warehouse[]).forEach((wh) => {
        const existing = db.queryById('warehouses', wh.id);
        if (existing) {
          db.updateRecord('warehouses', wh.id, wh);
        } else {
          db.insertRecord('warehouses', wh);
        }
      });
      return;
    }
    if (key === STORAGE_KEYS.BALANCES) {
      (data as unknown as InventoryBalance[]).forEach((bal) => {
        const list = db.queryAll<InventoryBalance>('inventory_balances');
        const idx = list.findIndex((b) => b.warehouse_id === bal.warehouse_id && b.item_id === bal.item_id);
        if (idx !== -1) {
          list[idx].quantity = bal.quantity;
          db.updateRecord('inventory_balances', list[idx].warehouse_id + '_' + list[idx].item_id, list[idx]);
        } else {
          db.insertRecord('inventory_balances', bal);
        }
      });
      return;
    }
    if (key === STORAGE_KEYS.TRANSACTIONS) {
      (data as unknown as InventoryTransaction[]).forEach((tx) => {
        const existing = db.queryById('inventory_transactions', tx.id);
        if (existing) {
          db.updateRecord('inventory_transactions', tx.id, tx);
        } else {
          db.insertRecord('inventory_transactions', tx);
        }
      });
      return;
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving storage', key, e);
  }
}

export const inventoryService = {
  // --- SETTINGS ---
  getAllowNegativeStock(businessId: string): boolean {
    const policy = this.getNegativeStockPolicy(businessId);
    return policy !== 'block';
  },

  getNegativeStockPolicy(businessId: string): 'block' | 'warn' | 'allow' {
    const settingKey = `${STORAGE_KEYS.ALLOW_NEG}_${businessId}_policy`;
    try {
      const val = localStorage.getItem(settingKey);
      if (val === 'warn' || val === 'allow' || val === 'block') return val;
      // Fallback check old boolean setting
      const oldVal = localStorage.getItem(`${STORAGE_KEYS.ALLOW_NEG}_${businessId}`);
      if (oldVal === 'true') return 'allow';
      return 'block'; // Default strict policy
    } catch {
      return 'block';
    }
  },

  setNegativeStockPolicy(businessId: string, policy: 'block' | 'warn' | 'allow') {
    const settingKey = `${STORAGE_KEYS.ALLOW_NEG}_${businessId}_policy`;
    try {
      localStorage.setItem(settingKey, policy);
      localStorage.setItem(`${STORAGE_KEYS.ALLOW_NEG}_${businessId}`, policy !== 'block' ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  },

  setAllowNegativeStock(businessId: string, allowed: boolean) {
    this.setNegativeStockPolicy(businessId, allowed ? 'allow' : 'block');
  },

  // --- WAREHOUSES ---
  async getWarehouses(businessId: string): Promise<Warehouse[]> {
    if (!isSupabaseConfigured()) {
      let warehouses = db.queryByBusiness<Warehouse>('warehouses', businessId);
      if (warehouses.length === 0) {
        const defaultWh: Warehouse = {
          id: `wh_default_${businessId}`,
          business_id: businessId,
          name: 'انبار مرکزی دنا',
          code: 'WH-01',
          description: 'انبار اصلی ثبت و دریافت کالاها',
          address: null,
          manager_name: null,
          phone: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.insertRecord('warehouses', defaultWh);
        warehouses = [defaultWh];
      }

      const balances = getFromStorage<InventoryBalance>(STORAGE_KEYS.BALANCES, INITIAL_BALANCES);
      const locations = getFromStorage<WarehouseLocation>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);

      return warehouses.map((w) => {
        const whBalances = balances.filter((b) => b.warehouse_id === w.id);
        const whLocs = locations.filter((l) => l.warehouse_id === w.id);
        return {
          ...w,
          item_count: whBalances.filter(b => b.quantity > 0).length,
          locations_count: whLocs.length,
          total_quantity: whBalances.reduce((sum, b) => sum + Number(b.quantity), 0),
        };
      });
    }

    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('business_id', businessId)
        .order('name');

      if (error) throw error;

      // Enrich with counts using nested count queries if supported, or fetch manually
      const warehouses = (data || []) as Warehouse[];
      const enriched: Warehouse[] = [];

      for (const w of warehouses) {
        const { count: locCount } = await supabase
          .from('warehouse_locations')
          .select('*', { count: 'exact', head: true })
          .eq('warehouse_id', w.id);

        const { data: bData } = await supabase
          .from('inventory_balances')
          .select('quantity')
          .eq('warehouse_id', w.id);

        const totalQty = (bData || []).reduce((sum, b) => sum + Number(b.quantity || 0), 0);
        const itemCount = (bData || []).filter(b => Number(b.quantity || 0) > 0).length;

        enriched.push({
          ...w,
          locations_count: locCount || 0,
          item_count: itemCount,
          total_quantity: totalQty,
        });
      }

      return enriched;
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      throw new Error(err.message || 'خطا در دریافت لیست انبارها');
    }
  },

  async createWarehouse(
    businessId: string,
    input: Partial<Warehouse>,
    currentUserId?: string
  ): Promise<Warehouse> {
    const name = input.name?.trim();
    if (!name) throw new Error('نام انبار الزامی است');

    if (!isSupabaseConfigured()) {
      const list = db.queryByBusiness<Warehouse>('warehouses', businessId);
      const code = input.code?.trim() || null;

      if (code && list.some((w) => w.code === code)) {
        throw new Error('کد انبار وارد شده تکراری است');
      }

      const id = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const newWh: Warehouse = {
        id,
        business_id: businessId,
        name,
        code,
        description: input.description || null,
        address: input.address || null,
        manager_name: input.manager_name || null,
        phone: input.phone || null,
        is_active: input.is_active !== undefined ? input.is_active : true,
        created_at: now,
        updated_at: now,
      };

      db.insertRecord<Warehouse>('warehouses', newWh);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_WAREHOUSE',
          entityType: 'warehouses',
          entityId: id,
          newData: newWh,
        });
      }

      return newWh;
    }

    try {
      const { data, error } = await supabase
        .from('warehouses')
        .insert({
          business_id: businessId,
          name,
          code: input.code?.trim() || null,
          description: input.description || null,
          address: input.address || null,
          manager_name: input.manager_name || null,
          phone: input.phone || null,
          is_active: input.is_active !== undefined ? input.is_active : true,
        })
        .select('*')
        .single();

      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_WAREHOUSE',
          entityType: 'warehouses',
          entityId: data.id,
          newData: data,
        });
      }

      return data as Warehouse;
    } catch (err: any) {
      console.error('Error creating warehouse:', err);
      throw new Error(err.message || 'خطا در ثبت انبار جدید');
    }
  },

  async updateWarehouse(
    businessId: string,
    id: string,
    input: Partial<Warehouse>,
    currentUserId?: string
  ): Promise<Warehouse> {
    if (!isSupabaseConfigured()) {
      const existing = db.queryById<Warehouse>('warehouses', id);
      if (!existing) throw new Error('انبار یافت نشد');

      const code = input.code?.trim() || null;
      const list = db.queryByBusiness<Warehouse>('warehouses', businessId);
      if (code && list.some((w) => w.code === code && w.id !== id)) {
        throw new Error('کد انبار وارد شده تکراری است');
      }

      const updatedWh: Warehouse = {
        ...existing,
        ...input,
        updated_at: new Date().toISOString(),
      };

      db.updateRecord<Warehouse>('warehouses', id, updatedWh);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'UPDATE_WAREHOUSE',
          entityType: 'warehouses',
          entityId: id,
          newData: updatedWh,
        });
      }

      return updatedWh;
    }

    try {
      const { data, error } = await supabase
        .from('warehouses')
        .update({
          name: input.name?.trim(),
          code: input.code?.trim() || null,
          description: input.description,
          address: input.address,
          manager_name: input.manager_name,
          phone: input.phone,
          is_active: input.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'UPDATE_WAREHOUSE',
          entityType: 'warehouses',
          entityId: id,
          newData: data,
        });
      }

      return data as Warehouse;
    } catch (err: any) {
      console.error('Error updating warehouse:', err);
      throw new Error(err.message || 'خطا در بروزرسانی اطلاعات انبار');
    }
  },

  async deactivateWarehouse(
    businessId: string,
    id: string,
    currentUserId?: string
  ): Promise<boolean> {
    await this.updateWarehouse(businessId, id, { is_active: false }, currentUserId);
    return true;
  },

  async deleteWarehouse(
    businessId: string,
    id: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return InventoryRepository.deleteWarehouse(businessId, id);
    }
    try {
      const wh = await supabase.from('warehouses').select('*').eq('id', id).single();
      if (!wh.data) throw new Error('انبار یافت نشد');
      if (wh.data.is_default) throw new Error('امکان حذف انبار پیش‌فرض سیستم وجود ندارد.');

      const { data: docs } = await supabase.from('documents').select('id').eq('warehouse_id', id).limit(1);
      if (docs && docs.length > 0) {
        throw new Error('امکان حذف این انبار وجود ندارد زیرا دارای اسناد مالی ثبت شده است.');
      }

      const { data: invDocs } = await supabase.from('inventory_documents').select('id').or(`warehouse_id.eq.${id},target_warehouse_id.eq.${id}`).limit(1);
      if (invDocs && invDocs.length > 0) {
        throw new Error('امکان حذف این انبار وجود ندارد زیرا دارای اسناد انبارداری تاریخی است.');
      }

      const { error } = await supabase.from('warehouses').delete().eq('id', id).eq('business_id', businessId);
      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'DELETE_WAREHOUSE',
          entityType: 'warehouses',
          entityId: id,
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting warehouse:', err);
      throw new Error(err.message || 'خطا در حذف انبار');
    }
  },

  // --- LOCATIONS ---
  async getWarehouseLocations(warehouseId: string): Promise<WarehouseLocation[]> {
    if (!isSupabaseConfigured()) {
      return getFromStorage<WarehouseLocation>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS)
        .filter((l) => l.warehouse_id === warehouseId);
    }
    try {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .order('name');
      if (error) throw error;
      return data as WarehouseLocation[];
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  async createWarehouseLocation(
    warehouseId: string,
    input: Partial<WarehouseLocation>
  ): Promise<WarehouseLocation> {
    if (!isSupabaseConfigured()) {
      const list = getFromStorage<WarehouseLocation>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
      const newLoc: WarehouseLocation = {
        id: `loc_${Date.now()}`,
        warehouse_id: warehouseId,
        name: input.name || 'قفسه جدید',
        code: input.code || null,
        description: input.description || null,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      list.push(newLoc);
      setToStorage(STORAGE_KEYS.LOCATIONS, list);
      return newLoc;
    }

    const { data, error } = await supabase
      .from('warehouse_locations')
      .insert({
        warehouse_id: warehouseId,
        name: input.name,
        code: input.code || null,
        description: input.description || null,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as WarehouseLocation;
  },

  // --- INVENTORY BALANCES (GETTERS) ---
  async getInventoryBalances(businessId: string, filters?: InventoryFilters): Promise<InventoryBalance[]> {
    if (!isSupabaseConfigured()) {
      let balances = getFromStorage<InventoryBalance>(STORAGE_KEYS.BALANCES, INITIAL_BALANCES)
        .filter((b) => b.business_id === businessId);

      const items = getDemoItems(businessId);
      const warehouses = getFromStorage<Warehouse>(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);

      if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
        balances = balances.filter((b) => b.warehouse_id === filters.warehouse_id);
      }

      let enriched = balances.map((b) => {
        const item = items.find((i) => i.id === b.item_id);
        const wh = warehouses.find((w) => w.id === b.warehouse_id);
        return {
          ...b,
          warehouse_name: wh?.name || 'انبار نامشخص',
          item_name: item?.name || 'کالای نامشخص',
          item_code: item?.code || '',
          item_sku: item?.sku || '',
          item_type: item?.item_type || 'product',
          unit_name: item?.unit?.name || 'عدد',
          unit_cost: item?.purchase_price || 0,
          min_stock: item?.min_stock || 0,
        };
      });

      // Search filter
      if (filters?.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        enriched = enriched.filter((b) =>
          b.item_name.toLowerCase().includes(s) ||
          b.item_code.toLowerCase().includes(s) ||
          b.item_sku.toLowerCase().includes(s) ||
          b.warehouse_name.toLowerCase().includes(s)
        );
      }

      return enriched;
    }

    try {
      let query = supabase
        .from('inventory_balances')
        .select(`
          *,
          warehouse:warehouses (name),
          item:items (name, code, sku, purchase_price, min_stock, item_type, track_inventory)
        `)
        .eq('business_id', businessId);

      if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      let enriched: InventoryBalance[] = (data || []).map((b: any) => ({
        id: b.id,
        business_id: b.business_id,
        warehouse_id: b.warehouse_id,
        item_id: b.item_id,
        quantity: Number(b.quantity),
        reserved_quantity: Number(b.reserved_quantity || 0),
        available_quantity: Number(b.available_quantity || 0),
        updated_at: b.updated_at,
        warehouse_name: b.warehouse?.name || 'انبار نامشخص',
        item_name: b.item?.name || 'کالای نامشخص',
        item_code: b.item?.code || '',
        item_sku: b.item?.sku || '',
        item_type: b.item?.item_type || 'product',
        unit_cost: b.item?.purchase_price || 0,
        min_stock: b.item?.min_stock || 0,
      }));

      // Filter out service types or track_inventory = false (shouldn't exist anyway but safety)
      enriched = enriched.filter(b => b.item_type !== 'service');

      if (filters?.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        enriched = enriched.filter((b) =>
          b.item_name.toLowerCase().includes(s) ||
          b.item_code.toLowerCase().includes(s) ||
          b.item_sku.toLowerCase().includes(s) ||
          b.warehouse_name.toLowerCase().includes(s)
        );
      }

      return enriched;
    } catch (err: any) {
      console.error('Error fetching inventory balances:', err);
      throw new Error(err.message || 'خطا در دریافت موجودی انبارها');
    }
  },

  async getInventoryBalance(
    businessId: string,
    warehouseId: string,
    itemId: string
  ): Promise<InventoryBalance | null> {
    const list = await this.getInventoryBalances(businessId, { warehouse_id: warehouseId });
    return list.find((b) => b.item_id === itemId) || null;
  },

  async getItemStock(businessId: string, itemId: string): Promise<number> {
    const list = await this.getInventoryBalances(businessId);
    return list
      .filter((b) => b.item_id === itemId)
      .reduce((sum, b) => sum + b.quantity, 0);
  },

  async getWarehouseStock(businessId: string, warehouseId: string): Promise<InventoryBalance[]> {
    return this.getInventoryBalances(businessId, { warehouse_id: warehouseId });
  },

  // --- DOCUMENTS & TRANSACTIONS ENGINE ---
  async getInventoryDocuments(businessId: string, filters?: InventoryFilters): Promise<InventoryDocument[]> {
    if (!isSupabaseConfigured()) {
      let docs = getFromStorage<InventoryDocument>(STORAGE_KEYS.DOCUMENTS, []);
      const whs = getFromStorage<Warehouse>(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
      const items = getFromStorage<InventoryDocumentItem>(STORAGE_KEYS.DOCUMENT_ITEMS, []);

      docs = docs.filter((d) => d.business_id === businessId);

      if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
        docs = docs.filter((d) => d.warehouse_id === filters.warehouse_id || d.target_warehouse_id === filters.warehouse_id);
      }
      if (filters?.document_type && filters.document_type !== 'all') {
        docs = docs.filter((d) => d.document_type === filters.document_type);
      }
      if (filters?.status && filters.status !== 'all') {
        docs = docs.filter((d) => d.status === filters.status);
      }

      let enriched = docs.map((d) => {
        const wh = whs.find((w) => w.id === d.warehouse_id);
        const tWh = d.target_warehouse_id ? whs.find((w) => w.id === d.target_warehouse_id) : null;
        const docItems = items.filter((i) => i.document_id === d.id);
        return {
          ...d,
          warehouse_name: wh?.name || 'انبار مبدا نامشخص',
          target_warehouse_name: tWh?.name || 'انبار مقصد نامشخص',
          items_count: docItems.length,
          items: docItems,
        };
      });

      if (filters?.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        enriched = enriched.filter((d) =>
          d.document_number.toLowerCase().includes(s) ||
          d.description?.toLowerCase().includes(s) ||
          d.warehouse_name.toLowerCase().includes(s)
        );
      }

      return enriched.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    try {
      let query = supabase
        .from('inventory_documents')
        .select(`
          *,
          warehouse:warehouses!inventory_documents_warehouse_id_fkey (name),
          target_warehouse:warehouses!inventory_documents_target_warehouse_id_fkey (name)
        `)
        .eq('business_id', businessId);

      if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
        query = query.or(`warehouse_id.eq.${filters.warehouse_id},target_warehouse_id.eq.${filters.warehouse_id}`);
      }
      if (filters?.document_type && filters.document_type !== 'all') {
        query = query.eq('document_type', filters.document_type);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      let enriched: InventoryDocument[] = [];
      for (const d of (data || [])) {
        // Fetch items count
        const { count } = await supabase
          .from('inventory_document_items')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', d.id);

        enriched.push({
          id: d.id,
          business_id: d.business_id,
          document_number: d.document_number,
          document_type: d.document_type as InventoryDocumentType,
          status: d.status as InventoryDocumentStatus,
          warehouse_id: d.warehouse_id,
          target_warehouse_id: d.target_warehouse_id,
          description: d.description,
          document_date: d.document_date,
          created_by: d.created_by,
          approved_by: d.approved_by,
          approved_at: d.approved_at,
          created_at: d.created_at,
          warehouse_name: d.warehouse?.name || '',
          target_warehouse_name: d.target_warehouse?.name || '',
          items_count: count || 0,
        });
      }

      if (filters?.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        enriched = enriched.filter((d) =>
          d.document_number.toLowerCase().includes(s) ||
          d.description?.toLowerCase().includes(s) ||
          d.warehouse_name.toLowerCase().includes(s)
        );
      }

      return enriched.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در دریافت اسناد انبارگردانی');
    }
  },

  async getInventoryDocumentById(businessId: string, id: string): Promise<InventoryDocument | null> {
    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<InventoryDocument>(STORAGE_KEYS.DOCUMENTS, []);
      const doc = docs.find((d) => d.id === id && d.business_id === businessId);
      if (!doc) return null;

      const items = getFromStorage<InventoryDocumentItem>(STORAGE_KEYS.DOCUMENT_ITEMS, []);
      const catalogItems = getDemoItems(businessId);
      const whs = getFromStorage<Warehouse>(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);

      const wh = whs.find((w) => w.id === doc.warehouse_id);
      const tWh = doc.target_warehouse_id ? whs.find((w) => w.id === doc.target_warehouse_id) : null;

      const enrichedItems = items
        .filter((item) => item.document_id === doc.id)
        .map((item) => {
          const catItem = catalogItems.find((ci) => ci.id === item.item_id);
          return {
            ...item,
            item_name: catItem?.name || 'کالای نامشخص',
            item_code: catItem?.code || '',
            item_sku: catItem?.sku || '',
            unit_name: catItem?.unit?.name || 'عدد',
          };
        });

      return {
        ...doc,
        warehouse_name: wh?.name || '',
        target_warehouse_name: tWh?.name || '',
        items_count: enrichedItems.length,
        items: enrichedItems,
      };
    }

    try {
      const { data: d, error } = await supabase
        .from('inventory_documents')
        .select(`
          *,
          warehouse:warehouses!inventory_documents_warehouse_id_fkey (name),
          target_warehouse:warehouses!inventory_documents_target_warehouse_id_fkey (name)
        `)
        .eq('id', id)
        .eq('business_id', businessId)
        .single();

      if (error || !d) return null;

      // Fetch items
      const { data: itemRows, error: itemError } = await supabase
        .from('inventory_document_items')
        .select(`
          *,
          item:items (name, code, sku, units (name))
        `)
        .eq('document_id', id);

      if (itemError) throw itemError;

      const enrichedItems = (itemRows || []).map((i: any) => ({
        id: i.id,
        document_id: i.document_id,
        item_id: i.item_id,
        quantity: Number(i.quantity),
        unit_cost: Number(i.unit_cost || 0),
        description: i.description,
        item_name: i.item?.name || 'کالای نامشخص',
        item_code: i.item?.code || '',
        item_sku: i.item?.sku || '',
        unit_name: i.item?.units?.name || 'عدد',
      }));

      return {
        id: d.id,
        business_id: d.business_id,
        document_number: d.document_number,
        document_type: d.document_type as InventoryDocumentType,
        status: d.status as InventoryDocumentStatus,
        warehouse_id: d.warehouse_id,
        target_warehouse_id: d.target_warehouse_id,
        description: d.description,
        document_date: d.document_date,
        created_by: d.created_by,
        approved_by: d.approved_by,
        approved_at: d.approved_at,
        created_at: d.created_at,
        warehouse_name: d.warehouse?.name || '',
        target_warehouse_name: d.target_warehouse?.name || '',
        items_count: enrichedItems.length,
        items: enrichedItems,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  async createInventoryDocument(
    businessId: string,
    input: Partial<InventoryDocument> & { items?: Partial<InventoryDocumentItem>[] },
    currentUserId?: string
  ): Promise<InventoryDocument> {
    const warehouseId = input.warehouse_id;
    const docType = input.document_type;
    if (!warehouseId || !docType) {
      throw new Error('انبار و نوع سند اجباری است');
    }

    const documentNumber = input.document_number || `INV-${docType.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const documentDate = input.document_date || new Date().toISOString();

    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<InventoryDocument>(STORAGE_KEYS.DOCUMENTS, []);
      const docItems = getFromStorage<InventoryDocumentItem>(STORAGE_KEYS.DOCUMENT_ITEMS, []);

      const newDoc: InventoryDocument = {
        id: `doc_${Date.now()}`,
        business_id: businessId,
        document_number: documentNumber,
        document_type: docType,
        status: 'draft',
        warehouse_id: warehouseId,
        target_warehouse_id: input.target_warehouse_id || null,
        description: input.description || null,
        document_date: documentDate,
        created_by: currentUserId || null,
        created_at: new Date().toISOString(),
      };

      docs.unshift(newDoc);
      setToStorage(STORAGE_KEYS.DOCUMENTS, docs);

      if (input.items && input.items.length > 0) {
        const catalogItems = getDemoItems(businessId);
        input.items.forEach((item, idx) => {
          const item_id = item.item_id!;
          const catItem = catalogItems.find(i => i.id === item_id);

          // Validation
          if (catItem?.item_type === 'service') {
            throw new Error(`آیتم ${catItem.name} از نوع خدمت است و نمی‌تواند وارد انبار شود.`);
          }
          if (catItem?.track_inventory === false) {
            throw new Error(`آیتم ${catItem.name} فاقد پیگیری موجودی است.`);
          }

          const newItemRow: InventoryDocumentItem = {
            id: `item_row_${Date.now()}_${idx}`,
            document_id: newDoc.id,
            item_id,
            quantity: Number(item.quantity) || 0,
            unit_cost: Number(item.unit_cost) || 0,
            description: item.description || null,
          };
          docItems.push(newItemRow);
        });
        setToStorage(STORAGE_KEYS.DOCUMENT_ITEMS, docItems);
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_INVENTORY_DOCUMENT',
          entityType: 'inventory_documents',
          entityId: newDoc.id,
          newData: newDoc,
        });
      }

      return newDoc;
    }

    try {
      // 1. Insert inventory_documents
      const { data: doc, error: docError } = await supabase
        .from('inventory_documents')
        .insert({
          business_id: businessId,
          document_number: documentNumber,
          document_type: docType,
          status: 'draft',
          warehouse_id: warehouseId,
          target_warehouse_id: input.target_warehouse_id || null,
          description: input.description || null,
          document_date: documentDate,
          created_by: currentUserId || null,
        })
        .select('*')
        .single();

      if (docError || !doc) throw new Error(docError?.message || 'خطا در ثبت سند انبار');

      // 2. Insert items
      if (input.items && input.items.length > 0) {
        // Safety validation
        for (const item of input.items) {
          const catItem = await itemService.getItemById(businessId, item.item_id!);
          if (catItem?.item_type === 'service') {
            throw new Error(`آیتم ${catItem.name} از نوع خدمت است و نمی‌تواند وارد انبار شود.`);
          }
          if (catItem?.track_inventory === false) {
            throw new Error(`آیتم ${catItem.name} فاقد پیگیری موجودی است.`);
          }
        }

        const itemRows = input.items.map((item) => ({
          document_id: doc.id,
          item_id: item.item_id!,
          quantity: Number(item.quantity) || 0,
          unit_cost: Number(item.unit_cost) || 0,
          description: item.description || null,
        }));

        const { error: itemsError } = await supabase
          .from('inventory_document_items')
          .insert(itemRows);

        if (itemsError) throw itemsError;
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_INVENTORY_DOCUMENT',
          entityType: 'inventory_documents',
          entityId: doc.id,
          newData: doc,
        });
      }

      return doc as InventoryDocument;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در ایجاد سند انبارداری');
    }
  },

  async confirmInventoryDocument(
    businessId: string,
    documentId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<InventoryDocument>(STORAGE_KEYS.DOCUMENTS, []);
      const docItems = getFromStorage<InventoryDocumentItem>(STORAGE_KEYS.DOCUMENT_ITEMS, []);
      const balances = getFromStorage<InventoryBalance>(STORAGE_KEYS.BALANCES, INITIAL_BALANCES);
      const transactions = getFromStorage<InventoryTransaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
      const catalogItems = getDemoItems(businessId);

      const docIndex = docs.findIndex((d) => d.id === documentId && d.business_id === businessId);
      if (docIndex < 0) throw new Error('سند پیدا نشد');

      const doc = docs[docIndex];
      if (doc.status !== 'draft') {
        throw new Error('تنها اسناد پیش‌نویس قابل تأیید هستند');
      }

      const activeItems = docItems.filter((i) => i.document_id === documentId);
      if (activeItems.length === 0) {
        throw new Error('سند فاقد آیتم است');
      }

      const policy = this.getNegativeStockPolicy(businessId);

      // Determine Transaction types
      let txInType: TransactionType | null = null;
      let txOutType: TransactionType | null = null;

      if (doc.document_type === 'receipt') txInType = 'stock_in';
      else if (doc.document_type === 'issue') txOutType = 'stock_out';
      else if (doc.document_type === 'opening_balance') txInType = 'opening_balance';
      else if (doc.document_type === 'transfer') {
        if (!doc.target_warehouse_id) throw new Error('انبار مقصد مشخص نشده است');
        txOutType = 'transfer_out';
        txInType = 'transfer_in';
      } else if (doc.document_type === 'adjustment') {
        txInType = 'adjustment_in';
        txOutType = 'adjustment_out';
      }

      // Check stock levels first for outgoing transactions according to negative stock policy
      if (txOutType && policy !== 'allow') {
        for (const itemRow of activeItems) {
          const currentBal = balances.find(
            (b) => b.warehouse_id === doc.warehouse_id && b.item_id === itemRow.item_id
          );
          const currentQty = currentBal ? currentBal.quantity : 0;
          if (currentQty < itemRow.quantity) {
            const catItem = catalogItems.find(ci => ci.id === itemRow.item_id) || ItemRepository.getById(itemRow.item_id);
            const itemName = catItem?.name || catItem?.title || 'کالای منتخب';
            if (policy === 'block') {
              throw new Error(
                `خروج موجودی منفی مسدود شده است! موجودی کالای "${itemName}" در انبار کافی نیست (موجودی فعلی: ${currentQty}، درخواستی: ${itemRow.quantity}). لطفاً ابتدا رسید ورود به انبار (خرید یا موجودی اولیه) ثبت کنید یا از بخش تنظیمات > تنظیمات انبار، اجازه موجودی منفی را فعال نمایید.`
              );
            } else if (policy === 'warn') {
              console.warn(
                `هشدار موجودی منفی: موجودی کالای "${itemName}" کافی نیست (موجودی: ${currentQty}، درخواستی: ${itemRow.quantity})`
              );
            }
          }
        }
      }

      // Create transactions & update balances
      activeItems.forEach((itemRow) => {
        // 1. OUT Transaction
        if (txOutType) {
          const newTxOut: InventoryTransaction = {
            id: `tx_${Date.now()}_out_${itemRow.id}`,
            business_id: businessId,
            warehouse_id: doc.warehouse_id,
            item_id: itemRow.item_id,
            transaction_type: txOutType,
            quantity: itemRow.quantity,
            unit_cost: itemRow.unit_cost,
            reference_type: 'inventory_document',
            reference_id: doc.id,
            description: doc.description,
            transaction_date: doc.document_date,
            created_by: currentUserId || null,
            created_at: new Date().toISOString(),
          };
          transactions.push(newTxOut);

          // Update Balance
          let bal = balances.find((b) => b.warehouse_id === doc.warehouse_id && b.item_id === itemRow.item_id);
          if (!bal) {
            bal = {
              id: `bal_${Date.now()}_${itemRow.item_id}`,
              business_id: businessId,
              warehouse_id: doc.warehouse_id,
              item_id: itemRow.item_id,
              quantity: 0,
              reserved_quantity: 0,
              available_quantity: 0,
              updated_at: new Date().toISOString(),
            };
            balances.push(bal);
          }
          bal.quantity -= itemRow.quantity;
          bal.available_quantity = bal.quantity - bal.reserved_quantity;
          bal.updated_at = new Date().toISOString();
        }

        // 2. IN Transaction
        if (txInType) {
          const targetWh = doc.document_type === 'transfer' ? doc.target_warehouse_id! : doc.warehouse_id;
          const newTxIn: InventoryTransaction = {
            id: `tx_${Date.now()}_in_${itemRow.id}`,
            business_id: businessId,
            warehouse_id: targetWh,
            item_id: itemRow.item_id,
            transaction_type: txInType,
            quantity: itemRow.quantity,
            unit_cost: itemRow.unit_cost,
            reference_type: 'inventory_document',
            reference_id: doc.id,
            description: doc.description,
            transaction_date: doc.document_date,
            created_by: currentUserId || null,
            created_at: new Date().toISOString(),
          };
          transactions.push(newTxIn);

          // Update Balance
          let bal = balances.find((b) => b.warehouse_id === targetWh && b.item_id === itemRow.item_id);
          if (!bal) {
            bal = {
              id: `bal_${Date.now()}_${itemRow.item_id}`,
              business_id: businessId,
              warehouse_id: targetWh,
              item_id: itemRow.item_id,
              quantity: 0,
              reserved_quantity: 0,
              available_quantity: 0,
              updated_at: new Date().toISOString(),
            };
            balances.push(bal);
          }
          bal.quantity += itemRow.quantity;
          bal.available_quantity = bal.quantity - bal.reserved_quantity;
          bal.updated_at = new Date().toISOString();
        }
      });

      // Update Doc
      doc.status = 'confirmed';
      doc.approved_by = currentUserId || null;
      doc.approved_at = new Date().toISOString();

      setToStorage(STORAGE_KEYS.DOCUMENTS, docs);
      setToStorage(STORAGE_KEYS.BALANCES, balances);
      setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CONFIRM_INVENTORY_DOCUMENT',
          entityType: 'inventory_documents',
          entityId: documentId,
        });
      }

      return true;
    }

    try {
      // Call direct postgres SQL RPC
      const { data, error } = await supabase.rpc('confirm_inventory_document', {
        p_document_id: documentId,
        p_user_id: currentUserId,
      });

      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CONFIRM_INVENTORY_DOCUMENT',
          entityType: 'inventory_documents',
          entityId: documentId,
        });
      }

      return true;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در تأیید سند انبار');
    }
  },

  async cancelInventoryDocument(
    businessId: string,
    documentId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const docs = getFromStorage<InventoryDocument>(STORAGE_KEYS.DOCUMENTS, []);
      const docIndex = docs.findIndex((d) => d.id === documentId && d.business_id === businessId);
      if (docIndex < 0) throw new Error('سند یافت نشد');

      const doc = docs[docIndex];
      if (doc.status === 'cancelled') {
        throw new Error('این سند پیش‌تر باطل شده است');
      }

      // If document was confirmed, we must reverse the transactions!
      if (doc.status === 'confirmed') {
        const transactions = getFromStorage<InventoryTransaction>(STORAGE_KEYS.TRANSACTIONS, []);
        const balances = getFromStorage<InventoryBalance>(STORAGE_KEYS.BALANCES, []);

        // Find existing transactions for this doc
        const originalTxs = transactions.filter(
          (t) => t.reference_type === 'inventory_document' && t.reference_id === doc.id
        );

        // Create reverse transactions!
        originalTxs.forEach((orig) => {
          // Identify reverse type
          let revType: TransactionType;
          let factor: number;

          if (orig.transaction_type.endsWith('_in')) {
            revType = orig.transaction_type.replace('_in', '_out') as TransactionType;
            factor = -1; // subtract from balance
          } else if (orig.transaction_type.endsWith('_out')) {
            revType = orig.transaction_type.replace('_out', '_in') as TransactionType;
            factor = 1; // add to balance
          } else if (orig.transaction_type === 'stock_in') {
            revType = 'stock_out';
            factor = -1;
          } else if (orig.transaction_type === 'stock_out') {
            revType = 'stock_in';
            factor = 1;
          } else if (orig.transaction_type === 'opening_balance') {
            revType = 'stock_out';
            factor = -1;
          } else {
            revType = 'adjustment_out';
            factor = -1;
          }

          const revTx: InventoryTransaction = {
            id: `tx_${Date.now()}_rev_${orig.id}`,
            business_id: businessId,
            warehouse_id: orig.warehouse_id,
            item_id: orig.item_id,
            transaction_type: revType,
            quantity: orig.quantity,
            unit_cost: orig.unit_cost,
            reference_type: 'inventory_document_cancellation',
            reference_id: doc.id,
            description: `برگشتی/ابطال سند ${doc.document_number} - ${orig.description || ''}`,
            transaction_date: new Date().toISOString(),
            created_by: currentUserId || null,
            created_at: new Date().toISOString(),
          };
          transactions.push(revTx);

          // Update balances
          const bal = balances.find((b) => b.warehouse_id === orig.warehouse_id && b.item_id === orig.item_id);
          if (bal) {
            bal.quantity += orig.quantity * factor;
            bal.available_quantity = bal.quantity - bal.reserved_quantity;
            bal.updated_at = new Date().toISOString();
          }
        });

        setToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
        setToStorage(STORAGE_KEYS.BALANCES, balances);
      }

      doc.status = 'cancelled';
      setToStorage(STORAGE_KEYS.DOCUMENTS, docs);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CANCEL_INVENTORY_DOCUMENT',
          entityType: 'inventory_documents',
          entityId: documentId,
        });
      }

      return true;
    }

    try {
      // In Supabase we implement cancellation as an atomic query
      const { data: doc, error: fetchErr } = await supabase
        .from('inventory_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchErr || !doc) throw new Error('سند یافت نشد');
      if (doc.status === 'cancelled') throw new Error('این سند پیش‌تر باطل شده است');

      if (doc.status === 'confirmed') {
        // Fetch original confirmed transactions to reverse them
        const { data: origTxs, error: txError } = await supabase
          .from('inventory_transactions')
          .select('*')
          .eq('reference_id', documentId);

        if (txError) throw txError;

        // Perform reversals and inserts safely
        for (const tx of (origTxs || [])) {
          let revType = 'adjustment_out';
          let factor = -1;

          if (tx.transaction_type.endsWith('_in')) {
            revType = tx.transaction_type.replace('_in', '_out');
            factor = -1;
          } else if (tx.transaction_type.endsWith('_out')) {
            revType = tx.transaction_type.replace('_out', '_in');
            factor = 1;
          } else if (tx.transaction_type === 'stock_in') {
            revType = 'stock_out';
            factor = -1;
          } else if (tx.transaction_type === 'stock_out') {
            revType = 'stock_in';
            factor = 1;
          } else if (tx.transaction_type === 'opening_balance') {
            revType = 'stock_out';
            factor = -1;
          }

          // Insert reversal transaction
          await supabase.from('inventory_transactions').insert({
            business_id: businessId,
            warehouse_id: tx.warehouse_id,
            item_id: tx.item_id,
            transaction_type: revType,
            quantity: tx.quantity,
            unit_cost: tx.unit_cost,
            reference_type: 'inventory_document_cancellation',
            reference_id: documentId,
            description: `برگشتی/ابطال سند ${doc.document_number}`,
            created_by: currentUserId,
          });

          // Update Balance
          const { data: currentBal } = await supabase
            .from('inventory_balances')
            .select('quantity')
            .eq('warehouse_id', tx.warehouse_id)
            .eq('item_id', tx.item_id)
            .single();

          const newQty = Number(currentBal?.quantity || 0) + (Number(tx.quantity) * factor);
          await supabase
            .from('inventory_balances')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('warehouse_id', tx.warehouse_id)
            .eq('item_id', tx.item_id);
        }
      }

      await supabase
        .from('inventory_documents')
        .update({ status: 'cancelled' })
        .eq('id', documentId);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CANCEL_INVENTORY_DOCUMENT',
          entityType: 'inventory_documents',
          entityId: documentId,
        });
      }

      return true;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در ابطال سند');
    }
  },

  // Direct actions wrappers
  async transferInventory(
    businessId: string,
    input: {
      sourceWarehouseId: string;
      targetWarehouseId: string;
      items: { itemId: string; quantity: number; unitCost: number; description?: string }[];
      description?: string;
      date?: string;
    },
    currentUserId?: string
  ): Promise<InventoryDocument> {
    const doc = await this.createInventoryDocument(
      businessId,
      {
        document_type: 'transfer',
        warehouse_id: input.sourceWarehouseId,
        target_warehouse_id: input.targetWarehouseId,
        description: input.description || 'حواله انتقال بین انبارها',
        document_date: input.date || new Date().toISOString(),
        items: input.items.map((i) => ({
          item_id: i.itemId,
          quantity: i.quantity,
          unit_cost: i.unitCost,
          description: i.description || null,
        })),
      },
      currentUserId
    );

    // Auto-confirm for instant transfer operation
    await this.confirmInventoryDocument(businessId, doc.id, currentUserId);

    if (currentUserId) {
      await authService.logAuditAction({
        businessId,
        userId: currentUserId,
        action: 'TRANSFER_INVENTORY',
        entityType: 'inventory_documents',
        entityId: doc.id,
      });
    }

    const reloaded = await this.getInventoryDocumentById(businessId, doc.id);
    return reloaded!;
  },

  async adjustInventory(
    businessId: string,
    input: {
      warehouseId: string;
      items: { itemId: string; quantity: number; unitCost: number; isAddition: boolean; description?: string }[];
      description?: string;
      date?: string;
    },
    currentUserId?: string
  ): Promise<InventoryDocument> {
    // Determine items formatted
    const doc = await this.createInventoryDocument(
      businessId,
      {
        document_type: 'adjustment',
        warehouse_id: input.warehouseId,
        description: input.description || 'سند اصلاحیه/تعدیل موجودی',
        document_date: input.date || new Date().toISOString(),
        items: input.items.map((i) => ({
          item_id: i.itemId,
          quantity: i.quantity,
          unit_cost: i.unitCost,
          description: i.description || (i.isAddition ? 'افزایش تعدیل' : 'کاهش تعدیل'),
        })),
      },
      currentUserId
    );

    // Auto confirm
    await this.confirmInventoryDocument(businessId, doc.id, currentUserId);

    if (currentUserId) {
      await authService.logAuditAction({
        businessId,
        userId: currentUserId,
        action: 'ADJUST_INVENTORY',
        entityType: 'inventory_documents',
        entityId: doc.id,
      });
    }

    const reloaded = await this.getInventoryDocumentById(businessId, doc.id);
    return reloaded!;
  },

  // --- TRANSACTIONS HISTORY ---
  async getInventoryTransactions(businessId: string, filters?: InventoryFilters): Promise<InventoryTransaction[]> {
    if (!isSupabaseConfigured()) {
      let txs = getFromStorage<InventoryTransaction>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
      const whs = getFromStorage<Warehouse>(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
      const items = getDemoItems(businessId);

      txs = txs.filter((t) => t.business_id === businessId);

      if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
        txs = txs.filter((t) => t.warehouse_id === filters.warehouse_id);
      }
      if (filters?.transaction_type && filters.transaction_type !== 'all') {
        txs = txs.filter((t) => t.transaction_type === filters.transaction_type);
      }

      let enriched = txs.map((t) => {
        const wh = whs.find((w) => w.id === t.warehouse_id);
        const item = items.find((i) => i.id === t.item_id);
        return {
          ...t,
          warehouse_name: wh?.name || 'انبار نامشخص',
          item_name: item?.name || 'کالای نامشخص',
          item_code: item?.code || '',
          unit_name: item?.unit?.name || 'عدد',
        };
      });

      if (filters?.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        enriched = enriched.filter((t) =>
          t.item_name.toLowerCase().includes(s) ||
          t.item_code.toLowerCase().includes(s) ||
          t.warehouse_name.toLowerCase().includes(s) ||
          t.description?.toLowerCase().includes(s)
        );
      }

      return enriched.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
    }

    try {
      let query = supabase
        .from('inventory_transactions')
        .select(`
          *,
          warehouse:warehouses (name),
          item:items (name, code, units (name))
        `)
        .eq('business_id', businessId);

      if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
        query = query.eq('warehouse_id', filters.warehouse_id);
      }
      if (filters?.transaction_type && filters.transaction_type !== 'all') {
        query = query.eq('transaction_type', filters.transaction_type);
      }

      const { data, error } = await query;
      if (error) throw error;

      let enriched: InventoryTransaction[] = (data || []).map((t: any) => ({
        id: t.id,
        business_id: t.business_id,
        warehouse_id: t.warehouse_id,
        item_id: t.item_id,
        transaction_type: t.transaction_type as TransactionType,
        quantity: Number(t.quantity),
        unit_cost: Number(t.unit_cost || 0),
        reference_type: t.reference_type,
        reference_id: t.reference_id,
        description: t.description,
        transaction_date: t.transaction_date,
        created_by: t.created_by,
        created_at: t.created_at,
        warehouse_name: t.warehouse?.name || '',
        item_name: t.item?.name || 'کالای نامشخص',
        item_code: t.item?.code || '',
        unit_name: t.item?.units?.name || 'عدد',
      }));

      if (filters?.search?.trim()) {
        const s = filters.search.trim().toLowerCase();
        enriched = enriched.filter((t) =>
          t.item_name.toLowerCase().includes(s) ||
          t.item_code.toLowerCase().includes(s) ||
          t.warehouse_name.toLowerCase().includes(s) ||
          t.description?.toLowerCase().includes(s)
        );
      }

      return enriched.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در دریافت گردش کالا');
    }
  },

  async getStockHistory(businessId: string, itemId: string, warehouseId?: string): Promise<InventoryTransaction[]> {
    const list = await this.getInventoryTransactions(businessId, { warehouse_id: warehouseId });
    return list.filter((t) => t.item_id === itemId);
  },

  // --- STOCK CONSTRAINTS / LOW STOCK ---
  async getLowStockItems(businessId: string, warehouseId?: string): Promise<InventoryBalance[]> {
    const balances = await this.getInventoryBalances(businessId, { warehouse_id: warehouseId });
    return balances.filter((b) => b.quantity < (b.min_stock || 0));
  },

  // --- STOCK COUNTS (انبارگردانی) ---
  async getStockCounts(businessId: string): Promise<StockCount[]> {
    if (!isSupabaseConfigured()) {
      const counts = getFromStorage<StockCount>(STORAGE_KEYS.STOCK_COUNTS, []);
      const whs = getFromStorage<Warehouse>(STORAGE_KEYS.WAREHOUSES, INITIAL_WAREHOUSES);
      const items = getFromStorage<StockCountItem>(STORAGE_KEYS.STOCK_COUNT_ITEMS, []);

      const bizCounts = counts.filter((c) => c.business_id === businessId);
      return bizCounts.map((c) => {
        const wh = whs.find((w) => w.id === c.warehouse_id);
        const countItems = items.filter((ci) => ci.stock_count_id === c.id);
        const hasVariance = countItems.some((ci) => ci.variance !== 0);

        return {
          ...c,
          warehouse_name: wh?.name || '',
          items_count: countItems.length,
          has_variance: hasVariance,
          items: countItems,
        };
      }).sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    try {
      const { data, error } = await supabase
        .from('stock_counts')
        .select(`
          *,
          warehouse:warehouses (name)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched: StockCount[] = [];
      for (const c of (data || [])) {
        // Fetch items count and variance check
        const { data: cItems } = await supabase
          .from('stock_count_items')
          .select('variance')
          .eq('stock_count_id', c.id);

        const itemsCount = cItems?.length || 0;
        const hasVariance = (cItems || []).some((ci) => Number(ci.variance) !== 0);

        enriched.push({
          id: c.id,
          business_id: c.business_id,
          count_number: c.count_number,
          warehouse_id: c.warehouse_id,
          title: c.title,
          status: c.status as any,
          count_date: c.count_date,
          description: c.description,
          created_by: c.created_by,
          approved_by: c.approved_by,
          approved_at: c.approved_at,
          created_at: c.created_at,
          warehouse_name: c.warehouse?.name || '',
          items_count: itemsCount,
          has_variance: hasVariance,
        });
      }

      return enriched;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در دریافت لیست انبارگردانی‌ها');
    }
  },

  async getStockCountById(businessId: string, id: string): Promise<StockCount | null> {
    if (!isSupabaseConfigured()) {
      const counts = await this.getStockCounts(businessId);
      return counts.find((c) => c.id === id) || null;
    }

    try {
      const { data: c, error } = await supabase
        .from('stock_counts')
        .select(`
          *,
          warehouse:warehouses (name)
        `)
        .eq('id', id)
        .eq('business_id', businessId)
        .single();

      if (error || !c) return null;

      // Fetch count items
      const { data: rows, error: itemError } = await supabase
        .from('stock_count_items')
        .select(`
          *,
          item:items (name, code, units (name))
        `)
        .eq('stock_count_id', id);

      if (itemError) throw itemError;

      const items: StockCountItem[] = (rows || []).map((ri: any) => ({
        id: ri.id,
        stock_count_id: ri.stock_count_id,
        item_id: ri.item_id,
        system_quantity: Number(ri.system_quantity),
        counted_quantity: Number(ri.counted_quantity),
        variance: Number(ri.variance),
        unit_cost: Number(ri.unit_cost || 0),
        notes: ri.notes,
        item_name: ri.item?.name || 'کالای نامشخص',
        item_code: ri.item?.code || '',
        unit_name: ri.item?.units?.name || 'عدد',
      }));

      return {
        id: c.id,
        business_id: c.business_id,
        count_number: c.count_number,
        warehouse_id: c.warehouse_id,
        title: c.title,
        status: c.status as any,
        count_date: c.count_date,
        description: c.description,
        created_by: c.created_by,
        approved_by: c.approved_by,
        approved_at: c.approved_at,
        created_at: c.created_at,
        warehouse_name: c.warehouse?.name || '',
        items_count: items.length,
        has_variance: items.some((i) => i.variance !== 0),
        items,
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  async createStockCount(
    businessId: string,
    input: Partial<StockCount> & { items: { itemId: string; countedQuantity: number }[] },
    currentUserId?: string
  ): Promise<StockCount> {
    const warehouseId = input.warehouse_id;
    if (!warehouseId) throw new Error('انبار الزامی است');

    const countNumber = input.count_number || `SC-${Date.now().toString().slice(-6)}`;
    const title = input.title?.trim() || `انبارگردانی ${countNumber}`;

    if (!isSupabaseConfigured()) {
      const counts = getFromStorage<StockCount>(STORAGE_KEYS.STOCK_COUNTS, []);
      const countItems = getFromStorage<StockCountItem>(STORAGE_KEYS.STOCK_COUNT_ITEMS, []);
      const balances = await this.getInventoryBalances(businessId, { warehouse_id: warehouseId });
      const catalogItems = getDemoItems(businessId);

      const newSc: StockCount = {
        id: `sc_${Date.now()}`,
        business_id: businessId,
        count_number: countNumber,
        warehouse_id: warehouseId,
        title,
        status: 'draft',
        count_date: input.count_date || new Date().toISOString(),
        description: input.description || null,
        created_by: currentUserId || null,
        created_at: new Date().toISOString(),
      };

      counts.unshift(newSc);
      setToStorage(STORAGE_KEYS.STOCK_COUNTS, counts);

      const itemsRows: StockCountItem[] = (input.items as any[]).map((it, idx) => {
        const bal = balances.find((b) => b.item_id === it.itemId);
        const sysQty = bal ? bal.quantity : 0;
        const countQty = Number(it.countedQuantity) || 0;
        const variance = countQty - sysQty;
        const catItem = catalogItems.find((ci) => ci.id === it.itemId);

        return {
          id: `sci_${Date.now()}_${idx}`,
          stock_count_id: newSc.id,
          item_id: it.itemId,
          system_quantity: sysQty,
          counted_quantity: countQty,
          variance,
          unit_cost: catItem?.purchase_price || 0,
          notes: '',
        };
      });

      setToStorage(STORAGE_KEYS.STOCK_COUNT_ITEMS, [...countItems, ...itemsRows]);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_STOCK_COUNT',
          entityType: 'stock_counts',
          entityId: newSc.id,
          newData: newSc,
        });
      }

      return newSc;
    }

    try {
      const { data: sc, error: scError } = await supabase
        .from('stock_counts')
        .insert({
          business_id: businessId,
          count_number: countNumber,
          warehouse_id: warehouseId,
          title,
          status: 'draft',
          count_date: input.count_date || new Date().toISOString(),
          description: input.description || null,
          created_by: currentUserId,
        })
        .select('*')
        .single();

      if (scError || !sc) throw new Error(scError?.message || 'خطا در ثبت اولیه انبارگردانی');

      // Fetch existing balances to pre-fill system quantity
      const { data: bRows } = await supabase
        .from('inventory_balances')
        .select('item_id, quantity')
        .eq('warehouse_id', warehouseId);

      const balanceMap = new Map((bRows || []).map((b) => [b.item_id, Number(b.quantity)]));

      const itemRows = [];
      for (const it of input.items) {
        const catItem = await itemService.getItemById(businessId, it.itemId);
        const sysQty = balanceMap.get(it.itemId) || 0;
        const countQty = Number(it.countedQuantity) || 0;
        const variance = countQty - sysQty;

        itemRows.push({
          stock_count_id: sc.id,
          item_id: it.itemId,
          system_quantity: sysQty,
          counted_quantity: countQty,
          variance,
          unit_cost: catItem?.purchase_price || 0,
        });
      }

      const { error: itemsError } = await supabase
        .from('stock_count_items')
        .insert(itemRows);

      if (itemsError) throw itemsError;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_STOCK_COUNT',
          entityType: 'stock_counts',
          entityId: sc.id,
          newData: sc,
        });
      }

      return sc as StockCount;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در ثبت انبارگردانی جدید');
    }
  },

  async approveStockCount(
    businessId: string,
    id: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const counts = getFromStorage<StockCount>(STORAGE_KEYS.STOCK_COUNTS, []);
      const countItems = getFromStorage<StockCountItem>(STORAGE_KEYS.STOCK_COUNT_ITEMS, []);

      const cIndex = counts.findIndex((c) => c.id === id && c.business_id === businessId);
      if (cIndex < 0) throw new Error('انبارگردانی یافت نشد');

      const sc = counts[cIndex];
      if (sc.status !== 'draft' && sc.status !== 'in_progress') {
        throw new Error('تنها انبارگردانی‌های پیش‌نویس قابل تأیید نهایی هستند');
      }

      const scItems = countItems.filter((ci) => ci.stock_count_id === id);
      if (scItems.length === 0) {
        throw new Error('انبارگردانی فاقد آیتم شمارش شده است');
      }

      // Generate adjustment items from variances!
      const itemsToAdjust = scItems
        .filter((ci) => ci.variance !== 0)
        .map((ci) => ({
          itemId: ci.item_id,
          quantity: Math.abs(ci.variance),
          unitCost: ci.unit_cost,
          isAddition: ci.variance > 0,
          description: `تعدیل اتوماتیک انبارگردانی شماره ${sc.count_number}`,
        }));

      if (itemsToAdjust.length > 0) {
        // Create actual adjustment
        await this.adjustInventory(
          businessId,
          {
            warehouseId: sc.warehouse_id,
            items: itemsToAdjust,
            description: `سند تعدیل خودکار حاصل از انبارگردانی ${sc.count_number}`,
            date: sc.count_date,
          },
          currentUserId
        );
      }

      sc.status = 'approved';
      sc.approved_by = currentUserId || null;
      sc.approved_at = new Date().toISOString();

      setToStorage(STORAGE_KEYS.STOCK_COUNTS, counts);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'APPROVE_STOCK_COUNT',
          entityType: 'stock_counts',
          entityId: id,
        });
      }

      return true;
    }

    try {
      // Direct approve on Supabase
      const { data: sc, error: scErr } = await supabase
        .from('stock_counts')
        .select('*')
        .eq('id', id)
        .eq('business_id', businessId)
        .single();

      if (scErr || !sc) throw new Error('انبارگردانی پیدا نشد');

      const { data: scItems, error: itemsErr } = await supabase
        .from('stock_count_items')
        .select('*')
        .eq('stock_count_id', id);

      if (itemsErr) throw itemsErr;

      const itemsToAdjust = (scItems || [])
        .filter((ci) => Number(ci.variance) !== 0)
        .map((ci) => ({
          itemId: ci.item_id,
          quantity: Math.abs(Number(ci.variance)),
          unitCost: Number(ci.unit_cost || 0),
          isAddition: Number(ci.variance) > 0,
          description: `تعدیل اتوماتیک انبارگردانی شماره ${sc.count_number}`,
        }));

      if (itemsToAdjust.length > 0) {
        await this.adjustInventory(
          businessId,
          {
            warehouseId: sc.warehouse_id,
            items: itemsToAdjust,
            description: `سند تعدیل خودکار حاصل از انبارگردانی ${sc.count_number}`,
            date: sc.count_date,
          },
          currentUserId
        );
      }

      await supabase
        .from('stock_counts')
        .update({
          status: 'approved',
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'APPROVE_STOCK_COUNT',
          entityType: 'stock_counts',
          entityId: id,
        });
      }

      return true;
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'خطا در تایید نهایی انبارگردانی');
    }
  },

  async cancelStockCount(
    businessId: string,
    id: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const counts = getFromStorage<StockCount>(STORAGE_KEYS.STOCK_COUNTS, []);
      const cIndex = counts.findIndex((c) => c.id === id && c.business_id === businessId);
      if (cIndex < 0) throw new Error('انبارگردانی یافت نشد');

      counts[cIndex].status = 'cancelled';
      setToStorage(STORAGE_KEYS.STOCK_COUNTS, counts);
      return true;
    }

    const { error } = await supabase
      .from('stock_counts')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('business_id', businessId);

    if (error) throw error;
    return true;
  },

  // --- DASHBOARD ANALYTICS ---
  async getInventoryDashboardData(businessId: string) {
    const warehouses = await this.getWarehouses(businessId);
    const balances = await this.getInventoryBalances(businessId);
    const transactions = await this.getInventoryTransactions(businessId);

    const lowStockItems = balances.filter((b) => b.quantity < (b.min_stock || 0));
    const outOfStockItems = balances.filter((b) => b.quantity <= 0);

    const totalStockValue = balances.reduce((sum, b) => sum + (Number(b.quantity) * Number(b.unit_cost || 0)), 0);

    return {
      totalWarehouses: warehouses.filter(w => w.is_active).length,
      totalStockItems: balances.filter((b) => b.quantity > 0).length,
      lowStockItemsCount: lowStockItems.length,
      outOfStockItemsCount: outOfStockItems.length,
      recentTransactions: transactions.slice(0, 10),
      inventoryValue: totalStockValue,
    };
  }
};
