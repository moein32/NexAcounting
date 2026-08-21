import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import {
  Item,
  ItemType,
  ItemFilters,
  ItemDuplicateCheckResult,
  ItemPrice,
  ItemAttribute,
} from '../types/catalog';

const DEMO_ITEMS_STORAGE_KEY = 'nex_demo_items_data';
const DEMO_ITEM_PRICES_STORAGE_KEY = 'nex_demo_item_prices';
const DEMO_ITEM_ATTRIBUTES_STORAGE_KEY = 'nex_demo_item_attributes';

const INITIAL_DEMO_ITEMS: Item[] = [
  {
    id: 'item_1',
    business_id: 'demo_biz_1',
    item_type: 'product',
    name: 'پنجره دوجداره UPVC کشویی مدل وین‌تک',
    code: 'PRD-1001',
    sku: 'UPVC-WIN-1001',
    barcode: '626001234001',
    category_id: 'cat_1_1',
    unit_id: 'unit_2', // مترمربع
    description: 'پنجره دوجداره کشویی با پروفیل ۵ کاناله وین‌تک و شیشه دوجداره ۶+۴ با گاز آرگون',
    short_description: 'پنجره UPVC کشویی وین‌تک دوجداره',
    brand: 'وین‌تک (WinTech)',
    model: 'Slide-60',
    purchase_price: 1850000,
    default_sale_price: 2650000,
    tax_rate: 10,
    default_discount_percent: 5,
    min_stock: 10,
    max_stock: 100,
    track_inventory: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400',
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat_1_1',
      business_id: 'demo_biz_1',
      name: 'پنجره UPVC',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    unit: {
      id: 'unit_2',
      business_id: 'demo_biz_1',
      name: 'مترمربع',
      symbol: 'm²',
      unit_type: 'area',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    prices: [
      { id: 'ip_1', item_id: 'item_1', price_list_id: 'plist_1', price: 2650000, min_quantity: 1, price_list_name: 'قیمت مصرف‌کننده' },
      { id: 'ip_2', item_id: 'item_1', price_list_id: 'plist_2', price: 2400000, min_quantity: 10, price_list_name: 'قیمت عمده‌فروشی' },
      { id: 'ip_3', item_id: 'item_1', price_list_id: 'plist_3', price: 2250000, min_quantity: 1, price_list_name: 'قیمت همکار / نماینده' },
    ],
    attributes: [
      { id: 'ia_1', item_id: 'item_1', attribute_name: 'رنگ', attribute_value: 'سفید صدفی' },
      { id: 'ia_2', item_id: 'item_1', attribute_name: 'ضخامت پروفیل', attribute_value: '60mm' },
      { id: 'ia_3', item_id: 'item_1', attribute_name: 'نوع یراق‌آلات', attribute_value: 'روتوی آلمان (Roto)' },
    ],
  },
  {
    id: 'item_2',
    business_id: 'demo_biz_1',
    item_type: 'product',
    name: 'پنجره آلومینیومی ترمال بریک لولایی شامپاینی',
    code: 'PRD-1002',
    sku: 'ALU-WIN-2002',
    barcode: '626001234002',
    category_id: 'cat_1_2',
    unit_id: 'unit_2',
    description: 'پنجره لولایی ترمال بریک آلومینیومی با عایق پلی‌آمید و رنگ آنادایز شامپاینی',
    short_description: 'پنجره آلومینیومی ترمال بریک آنادایز',
    brand: 'آکپا (Akpa)',
    model: 'TH60',
    purchase_price: 3400000,
    default_sale_price: 4800000,
    tax_rate: 10,
    default_discount_percent: 0,
    min_stock: 5,
    max_stock: 50,
    track_inventory: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat_1_2',
      business_id: 'demo_biz_1',
      name: 'پنجره آلومینیومی',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    unit: {
      id: 'unit_2',
      business_id: 'demo_biz_1',
      name: 'مترمربع',
      symbol: 'm²',
      unit_type: 'area',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    prices: [
      { id: 'ip_4', item_id: 'item_2', price_list_id: 'plist_1', price: 4800000, min_quantity: 1, price_list_name: 'قیمت مصرف‌کننده' },
      { id: 'ip_5', item_id: 'item_2', price_list_id: 'plist_2', price: 4400000, min_quantity: 10, price_list_name: 'قیمت عمده‌فروشی' },
    ],
  },
  {
    id: 'item_3',
    business_id: 'demo_biz_1',
    item_type: 'product',
    name: 'شیشه دوجداره 6+4 صنعتی با اسپیسر آلومینیومی',
    code: 'PRD-1003',
    sku: 'GLS-DBL-3003',
    barcode: '626001234003',
    category_id: 'cat_2_1',
    unit_id: 'unit_2',
    description: 'شیشه دوجداره ۶ میل ساده و ۴ میل ساده با تزریق ۱۲ میل گاز آرگون و چسب بوتیل',
    short_description: 'شیشه دوجداره صنعتی ۶ و ۴ میل',
    brand: 'اردکان',
    model: 'Clear Double Glass',
    purchase_price: 620000,
    default_sale_price: 950000,
    tax_rate: 10,
    default_discount_percent: 0,
    min_stock: 50,
    max_stock: 500,
    track_inventory: true,
    is_active: true,
    image_url: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=400',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat_2_1',
      business_id: 'demo_biz_1',
      name: 'شیشه دوجداره',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    unit: {
      id: 'unit_2',
      business_id: 'demo_biz_1',
      name: 'مترمربع',
      symbol: 'm²',
      unit_type: 'area',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'item_4',
    business_id: 'demo_biz_1',
    item_type: 'service',
    name: 'خدمات نصب تخصصی درب و پنجره در محل',
    code: 'SRV-2001',
    sku: 'SRV-INS-001',
    barcode: null,
    category_id: 'cat_3_1',
    unit_id: 'unit_5', // خدمت
    description: 'نصب، رگلاژ، آب‌بندی و هوابندی کامل درب و پنجره‌های ساختمانی توسط تکنسین مجرب',
    short_description: 'اجرا و نصب درب و پنجره',
    brand: 'نوین پرداز',
    model: 'Inst-Service',
    purchase_price: 0,
    default_sale_price: 350000,
    tax_rate: 0,
    default_discount_percent: 0,
    min_stock: 0,
    max_stock: null,
    track_inventory: false, // Services MUST have track_inventory = false
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat_3_1',
      business_id: 'demo_biz_1',
      name: 'نصب و اجرا',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    unit: {
      id: 'unit_5',
      business_id: 'demo_biz_1',
      name: 'خدمت / سرویس',
      symbol: 'خدمت',
      unit_type: 'service',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    prices: [
      { id: 'ip_6', item_id: 'item_4', price_list_id: 'plist_1', price: 350000, min_quantity: 1, price_list_name: 'قیمت مصرف‌کننده' },
      { id: 'ip_7', item_id: 'item_4', price_list_id: 'plist_2', price: 280000, min_quantity: 10, price_list_name: 'قیمت عمده‌فروشی' },
    ],
  },
  {
    id: 'item_5',
    business_id: 'demo_biz_1',
    item_type: 'service',
    name: 'خدمات حمل و جرثقیل بالابر شیشه و قاب',
    code: 'SRV-2002',
    sku: 'SRV-TRN-002',
    barcode: null,
    category_id: 'cat_3_2',
    unit_id: 'unit_5',
    description: 'حمل تخصصی شیشه‌های ابعاد بزرگ و فریم‌های آلومینیومی با خاور کفی مجهز به مهاربند',
    short_description: 'حمل و ارسال پروژه شهری',
    brand: null,
    model: null,
    purchase_price: 0,
    default_sale_price: 800000,
    tax_rate: 0,
    default_discount_percent: 0,
    min_stock: 0,
    max_stock: null,
    track_inventory: false,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    category: {
      id: 'cat_3_2',
      business_id: 'demo_biz_1',
      name: 'حمل و نقل و جابجایی',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    unit: {
      id: 'unit_5',
      business_id: 'demo_biz_1',
      name: 'خدمت / سرویس',
      symbol: 'خدمت',
      unit_type: 'service',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
];

import { ItemRepository, CategoryRepository } from '../repositories';

function getDemoItemsFromStorage(businessId: string): Item[] {
  try {
    let list = ItemRepository.getAll(businessId) as any[];
    if (!list || list.length === 0) {
      INITIAL_DEMO_ITEMS.forEach((item) => {
        ItemRepository.create({
          ...item,
          business_id: businessId,
          type: item.item_type as 'product' | 'service',
          sale_price: item.default_sale_price || 0,
        } as any);
      });
      list = ItemRepository.getAll(businessId) as any[];
    }

    const categoriesList = CategoryRepository.getAll(businessId);
    const unitsList = ItemRepository.getUnits();

    return (list || []).map((item) => {
      const category = (categoriesList || []).find((c) => c.id === item.category_id) || item.category || null;
      const unit = (unitsList || []).find((u) => u.id === item.unit_id) || item.unit || null;
      return {
        ...item,
        item_type: item.item_type || item.type || 'product',
        default_sale_price: item.default_sale_price !== undefined ? item.default_sale_price : (item.sale_price || 0),
        purchase_price: item.purchase_price !== undefined ? item.purchase_price : 0,
        tax_rate: item.tax_rate !== undefined ? item.tax_rate : 0,
        default_discount_percent: item.default_discount_percent !== undefined ? item.default_discount_percent : 0,
        track_inventory: item.track_inventory !== undefined ? item.track_inventory : (item.item_type === 'product'),
        category,
        unit,
        prices: item.prices || [],
        attributes: item.attributes || [],
      };
    }) as any[];
  } catch (err) {
    console.error('Error in getDemoItemsFromStorage:', err);
    return INITIAL_DEMO_ITEMS.map((item) => ({ ...item, business_id: businessId }));
  }
}

function saveDemoItemsToStorage(items: Item[]) {
  try {
    items.forEach((updated) => {
      const existing = ItemRepository.getById(updated.id);
      if (existing) {
        ItemRepository.update(updated.id, {
          ...updated,
          type: updated.item_type as 'product' | 'service',
          sale_price: updated.default_sale_price || 0,
        } as any);
      } else {
        ItemRepository.create({
          ...updated,
          type: updated.item_type as 'product' | 'service',
          sale_price: updated.default_sale_price || 0,
        } as any);
      }
    });
  } catch (e) {
    console.error('Error saving items to SQLite:', e);
  }
}

export const itemService = {
  // Check duplicate SKU, Barcode, Code
  async checkDuplicates(
    businessId: string,
    data: { sku?: string | null; barcode?: string | null; code?: string | null },
    excludeItemId?: string
  ): Promise<ItemDuplicateCheckResult> {
    const cleanSku = data.sku?.trim();
    const cleanBarcode = data.barcode?.trim();
    const cleanCode = data.code?.trim();

    const result: ItemDuplicateCheckResult = {
      hasDuplicateSku: false,
      hasDuplicateBarcode: false,
      hasDuplicateCode: false,
      duplicateItemNames: {},
    };

    if (!cleanSku && !cleanBarcode && !cleanCode) {
      return result;
    }

    if (!isSupabaseConfigured()) {
      const list = getDemoItemsFromStorage(businessId);
      for (const item of list) {
        if (excludeItemId && item.id === excludeItemId) continue;

        if (cleanSku && item.sku?.trim() === cleanSku) {
          result.hasDuplicateSku = true;
          result.duplicateItemNames.sku = item.name;
        }
        if (cleanBarcode && item.barcode?.trim() === cleanBarcode) {
          result.hasDuplicateBarcode = true;
          result.duplicateItemNames.barcode = item.name;
        }
        if (cleanCode && item.code?.trim() === cleanCode) {
          result.hasDuplicateCode = true;
          result.duplicateItemNames.code = item.name;
        }
      }
      return result;
    }

    // Supabase duplicate check
    try {
      let query = supabase.from('items').select('id, name, sku, barcode, code').eq('business_id', businessId);
      if (excludeItemId) {
        query = query.neq('id', excludeItemId);
      }

      const conditions: string[] = [];
      if (cleanSku) conditions.push(`sku.eq.${cleanSku}`);
      if (cleanBarcode) conditions.push(`barcode.eq.${cleanBarcode}`);
      if (cleanCode) conditions.push(`code.eq.${cleanCode}`);

      if (conditions.length === 0) return result;

      const { data: matches } = await query.or(conditions.join(','));

      if (matches && matches.length > 0) {
        for (const match of matches) {
          if (cleanSku && match.sku === cleanSku) {
            result.hasDuplicateSku = true;
            result.duplicateItemNames.sku = match.name;
          }
          if (cleanBarcode && match.barcode === cleanBarcode) {
            result.hasDuplicateBarcode = true;
            result.duplicateItemNames.barcode = match.name;
          }
          if (cleanCode && match.code === cleanCode) {
            result.hasDuplicateCode = true;
            result.duplicateItemNames.code = match.name;
          }
        }
      }

      return result;
    } catch {
      return result;
    }
  },

  // Get Items with pagination, filter, search, sort
  async getItems(
    businessId: string,
    filters?: ItemFilters
  ): Promise<{ data: Item[]; count: number }> {
    if (!isSupabaseConfigured()) {
      let list = getDemoItemsFromStorage(businessId);

      // Filters
      if (filters?.item_type && filters.item_type !== 'all') {
        list = list.filter((i) => i.item_type === filters.item_type);
      }

      if (filters?.category_id && filters.category_id !== 'all') {
        list = list.filter((i) => i.category_id === filters.category_id);
      }

      if (filters?.status && filters.status !== 'all') {
        const isActive = filters.status === 'active';
        list = list.filter((i) => i.is_active === isActive);
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.code?.toLowerCase().includes(q) ||
            i.sku?.toLowerCase().includes(q) ||
            i.barcode?.includes(q) ||
            i.brand?.toLowerCase().includes(q) ||
            i.model?.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q)
        );
      }

      // Sort
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';

      list.sort((a, b) => {
        const valA: any = a[sortBy as keyof Item] ?? '';
        const valB: any = b[sortBy as keyof Item] ?? '';
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = list.length;
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const start = (page - 1) * pageSize;
      const paged = list.slice(start, start + pageSize);

      return { data: paged, count: total };
    }

    // Supabase query
    try {
      let query = supabase
        .from('items')
        .select(
          `
          *,
          category:item_categories (*),
          unit:units (*),
          prices:item_prices (*),
          attributes:item_attributes (*)
        `,
          { count: 'exact' }
        )
        .eq('business_id', businessId);

      if (filters?.item_type && filters.item_type !== 'all') {
        query = query.eq('item_type', filters.item_type);
      }

      if (filters?.category_id && filters.category_id !== 'all') {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim();
        query = query.or(
          `name.ilike.%${q}%,code.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%`
        );
      }

      const sortBy = filters?.sortBy || 'created_at';
      const ascending = filters?.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw new Error(error.message);

      return {
        data: (data || []) as Item[],
        count: count || 0,
      };
    } catch (err: any) {
      console.error('Error fetching items:', err);
      throw new Error(err.message || 'خطا در دریافت کالاها و خدمات');
    }
  },

  async getProducts(businessId: string, filters?: ItemFilters) {
    return this.getItems(businessId, { ...filters, item_type: 'product' });
  },

  async getServices(businessId: string, filters?: ItemFilters) {
    return this.getItems(businessId, { ...filters, item_type: 'service' });
  },

  async getItemById(businessId: string, itemId: string): Promise<Item | null> {
    if (!isSupabaseConfigured()) {
      const list = getDemoItemsFromStorage(businessId);
      const item = list.find((i) => i.id === itemId);
      return item || null;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .select(
          `
          *,
          category:item_categories (*),
          unit:units (*),
          prices:item_prices (*, price_list:price_lists(name)),
          attributes:item_attributes (*)
        `
        )
        .eq('id', itemId)
        .eq('business_id', businessId)
        .single();

      if (error || !data) return null;

      // Map prices with price_list_name
      const pricesFormatted = (data.prices || []).map((p: any) => ({
        ...p,
        price_list_name: p.price_list?.name || '',
      }));

      return {
        ...data,
        prices: pricesFormatted,
      } as Item;
    } catch (err) {
      console.error('Error fetching item by ID:', err);
      return null;
    }
  },

  async createItem(
    businessId: string,
    input: Partial<Item> & {
      name: string;
      item_type: ItemType;
      prices?: { price_list_id: string; price: number; min_quantity: number }[];
      attributes?: { attribute_name: string; attribute_value: string }[];
    },
    currentUserId?: string
  ): Promise<Item> {
    const name = input.name.trim();
    if (!name) throw new Error('نام کالا یا خدمت الزامی است');

    // Rule: SERVICE MUST HAVE track_inventory = FALSE
    const trackInventory = input.item_type === 'service' ? false : !!input.track_inventory;

    if (!isSupabaseConfigured()) {
      const newItemId = `item_${Date.now()}`;
      const now = new Date().toISOString();

      const pricesList = (input.prices || []).map((p, idx) => ({
        id: `ip_${Date.now()}_${idx}`,
        item_id: newItemId,
        price_list_id: p.price_list_id,
        price: p.price,
        min_quantity: p.min_quantity || 1,
      }));

      const attrsList = (input.attributes || []).map((a, idx) => ({
        id: `ia_${Date.now()}_${idx}`,
        item_id: newItemId,
        attribute_name: a.attribute_name,
        attribute_value: a.attribute_value,
      }));

      const newItem: Item = {
        id: newItemId,
        business_id: businessId,
        item_type: input.item_type,
        name,
        code: input.code?.trim() || null,
        sku: input.sku?.trim() || null,
        barcode: input.barcode?.trim() || null,
        category_id: input.category_id || null,
        unit_id: input.unit_id || null,
        description: input.description || null,
        short_description: input.short_description || null,
        brand: input.brand || null,
        model: input.model || null,
        purchase_price: Number(input.purchase_price) || 0,
        default_sale_price: Number(input.default_sale_price) || 0,
        tax_rate: Number(input.tax_rate) || 0,
        default_discount_percent: Number(input.default_discount_percent) || 0,
        min_stock: Number(input.min_stock) || 0,
        max_stock: input.max_stock ? Number(input.max_stock) : null,
        track_inventory: trackInventory,
        is_active: true,
        image_url: input.image_url || null,
        created_by: currentUserId || null,
        created_at: now,
        updated_at: now,
        prices: pricesList,
        attributes: attrsList,
      };

      saveDemoItemsToStorage([newItem]);
      return newItem;
    }

    // Supabase insert
    try {
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          business_id: businessId,
          item_type: input.item_type,
          name,
          code: input.code?.trim() || null,
          sku: input.sku?.trim() || null,
          barcode: input.barcode?.trim() || null,
          category_id: input.category_id || null,
          unit_id: input.unit_id || null,
          description: input.description || null,
          short_description: input.short_description || null,
          brand: input.brand || null,
          model: input.model || null,
          purchase_price: Number(input.purchase_price) || 0,
          default_sale_price: Number(input.default_sale_price) || 0,
          tax_rate: Number(input.tax_rate) || 0,
          default_discount_percent: Number(input.default_discount_percent) || 0,
          min_stock: Number(input.min_stock) || 0,
          max_stock: input.max_stock ? Number(input.max_stock) : null,
          track_inventory: trackInventory,
          is_active: true,
          image_url: input.image_url || null,
          created_by: currentUserId || null,
        })
        .select('*')
        .single();

      if (itemError || !item) {
        throw new Error(itemError?.message || 'خطا در ثبت کالا یا خدمت');
      }

      // Insert Prices
      if (input.prices && input.prices.length > 0) {
        const priceRows = (input.prices || []).map((p) => ({
          item_id: item.id,
          price_list_id: p.price_list_id,
          price: Number(p.price) || 0,
          min_quantity: Number(p.min_quantity) || 1,
        }));
        await supabase.from('item_prices').insert(priceRows);
      }

      // Insert Attributes
      if (input.attributes && input.attributes.length > 0) {
        const attrRows = (input.attributes || []).map((a) => ({
          item_id: item.id,
          attribute_name: a.attribute_name,
          attribute_value: a.attribute_value,
        }));
        await supabase.from('item_attributes').insert(attrRows);
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_ITEM',
          entityType: 'items',
          entityId: item.id,
          newData: { name: item.name, item_type: item.item_type },
        });
      }

      const created = await this.getItemById(businessId, item.id);
      return created!;
    } catch (err: any) {
      console.error('Error creating item:', err);
      throw new Error(err.message || 'خطا در ثبت کالا یا خدمت جدید');
    }
  },

  async updateItem(
    businessId: string,
    itemId: string,
    input: Partial<Item> & {
      prices?: { price_list_id: string; price: number; min_quantity: number }[];
      attributes?: { attribute_name: string; attribute_value: string }[];
    },
    currentUserId?: string
  ): Promise<Item> {
    const existing = await this.getItemById(businessId, itemId);
    if (!existing) throw new Error('کالا یا خدمت پیدا نشد');

    const itemType = input.item_type || existing.item_type;
    const trackInventory = itemType === 'service' ? false : (input.track_inventory !== undefined ? input.track_inventory : existing.track_inventory);

    if (!isSupabaseConfigured()) {
      const list = getDemoItemsFromStorage(businessId);
      const idx = list.findIndex((i) => i.id === itemId);
      if (idx < 0) throw new Error('کالا یافت نشد');

      const now = new Date().toISOString();
      const updated: Item = {
        ...list[idx],
        ...input,
        track_inventory: trackInventory,
        updated_at: now,
      };

      if (input.prices) {
        updated.prices = (input.prices || []).map((p, i) => ({
          id: `ip_${Date.now()}_${i}`,
          item_id: itemId,
          price_list_id: p.price_list_id,
          price: p.price,
          min_quantity: p.min_quantity || 1,
        }));
      }

      if (input.attributes) {
        updated.attributes = (input.attributes || []).map((a, i) => ({
          id: `ia_${Date.now()}_${i}`,
          item_id: itemId,
          attribute_name: a.attribute_name,
          attribute_value: a.attribute_value,
        }));
      }

      saveDemoItemsToStorage([updated]);
      return updated;
    }

    try {
      const { error: updateError } = await supabase
        .from('items')
        .update({
          name: input.name?.trim(),
          item_type: itemType,
          code: input.code?.trim() || null,
          sku: input.sku?.trim() || null,
          barcode: input.barcode?.trim() || null,
          category_id: input.category_id || null,
          unit_id: input.unit_id || null,
          description: input.description || null,
          short_description: input.short_description || null,
          brand: input.brand || null,
          model: input.model || null,
          purchase_price: input.purchase_price !== undefined ? Number(input.purchase_price) : undefined,
          default_sale_price: input.default_sale_price !== undefined ? Number(input.default_sale_price) : undefined,
          tax_rate: input.tax_rate !== undefined ? Number(input.tax_rate) : undefined,
          default_discount_percent: input.default_discount_percent !== undefined ? Number(input.default_discount_percent) : undefined,
          min_stock: input.min_stock !== undefined ? Number(input.min_stock) : undefined,
          max_stock: input.max_stock !== undefined ? (input.max_stock ? Number(input.max_stock) : null) : undefined,
          track_inventory: trackInventory,
          is_active: input.is_active !== undefined ? input.is_active : undefined,
          image_url: input.image_url || null,
        })
        .eq('id', itemId)
        .eq('business_id', businessId);

      if (updateError) throw new Error(updateError.message);

      // Update Prices if supplied
      if (input.prices) {
        await supabase.from('item_prices').delete().eq('item_id', itemId);
        if (input.prices.length > 0) {
          const priceRows = (input.prices || []).map((p) => ({
            item_id: itemId,
            price_list_id: p.price_list_id,
            price: Number(p.price) || 0,
            min_quantity: Number(p.min_quantity) || 1,
          }));
          await supabase.from('item_prices').insert(priceRows);
        }
      }

      // Update Attributes if supplied
      if (input.attributes) {
        await supabase.from('item_attributes').delete().eq('item_id', itemId);
        if (input.attributes.length > 0) {
          const attrRows = (input.attributes || []).map((a) => ({
            item_id: itemId,
            attribute_name: a.attribute_name,
            attribute_value: a.attribute_value,
          }));
          await supabase.from('item_attributes').insert(attrRows);
        }
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'UPDATE_ITEM',
          entityType: 'items',
          entityId: itemId,
          oldData: { name: existing.name },
          newData: { name: input.name },
        });
      }

      const updated = await this.getItemById(businessId, itemId);
      return updated!;
    } catch (err: any) {
      console.error('Error updating item:', err);
      throw new Error(err.message || 'خطا در به روز رسانی اطلاعات کالا');
    }
  },

  async deactivateItem(
    businessId: string,
    itemId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = getDemoItemsFromStorage(businessId);
      const item = list.find((i) => i.id === itemId);
      if (item) {
        item.is_active = false;
        saveDemoItemsToStorage([item]);
      }
      return true;
    }

    try {
      const { error } = await supabase
        .from('items')
        .update({ is_active: false })
        .eq('id', itemId)
        .eq('business_id', businessId);

      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'DEACTIVATE_ITEM',
          entityType: 'items',
          entityId: itemId,
          newData: { is_active: false },
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error deactivating item:', err);
      throw new Error(err.message || 'خطا در غیرفعال‌سازی کالا');
    }
  },

  async deleteItem(
    businessId: string,
    itemId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const raw = localStorage.getItem(DEMO_ITEMS_STORAGE_KEY);
      let list: Item[] = raw ? JSON.parse(raw) : INITIAL_DEMO_ITEMS;
      list = list.filter((i) => i.id !== itemId);
      localStorage.setItem(DEMO_ITEMS_STORAGE_KEY, JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('business_id', businessId);

      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'DELETE_ITEM',
          entityType: 'items',
          entityId: itemId,
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting item:', err);
      throw new Error(err.message || 'خطا در حذف کالا یا خدمت');
    }
  },

  async searchItems(businessId: string, queryStr: string): Promise<Item[]> {
    const res = await this.getItems(businessId, { search: queryStr, pageSize: 20 });
    return res.data;
  },

  async getItemPrices(itemId: string): Promise<ItemPrice[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }
    try {
      const { data, error } = await supabase
        .from('item_prices')
        .select('*, price_list:price_lists(name)')
        .eq('item_id', itemId);

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        price_list_name: p.price_list?.name || '',
      }));
    } catch {
      return [];
    }
  },

  async updateItemPrices(
    itemId: string,
    prices: { price_list_id: string; price: number; min_quantity: number }[]
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    try {
      await supabase.from('item_prices').delete().eq('item_id', itemId);
      if (prices.length > 0) {
        const rows = (prices || []).map((p) => ({
          item_id: itemId,
          price_list_id: p.price_list_id,
          price: p.price,
          min_quantity: p.min_quantity || 1,
        }));
        await supabase.from('item_prices').insert(rows);
      }
      return true;
    } catch (err) {
      console.error('Error updating item prices:', err);
      return false;
    }
  },
};
