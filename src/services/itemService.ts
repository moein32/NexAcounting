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
import { ItemRepository, CategoryRepository, UnitRepository } from '../repositories';

function mapToCanonicalItem(
  rawItem: any,
  categoriesList: any[],
  unitsList: any[]
): Item {
  const category =
    categoriesList.find((c) => c.id === rawItem.category_id) || rawItem.category || null;
  const unit =
    unitsList.find((u) => u.id === rawItem.unit_id) || rawItem.unit || null;
  const itemType: ItemType = (rawItem.item_type || rawItem.type || 'product') as ItemType;
  const defaultSalePrice =
    rawItem.default_sale_price !== undefined
      ? Number(rawItem.default_sale_price)
      : Number(rawItem.sale_price || 0);
  const purchasePrice =
    rawItem.purchase_price !== undefined ? Number(rawItem.purchase_price) : 0;
  const taxRate = rawItem.tax_rate !== undefined ? Number(rawItem.tax_rate) : 0;
  const defaultDiscount =
    rawItem.default_discount_percent !== undefined
      ? Number(rawItem.default_discount_percent)
      : 0;
  const trackInventory =
    itemType === 'service'
      ? false
      : rawItem.track_inventory !== undefined
      ? Boolean(rawItem.track_inventory)
      : true;

  return {
    id: rawItem.id,
    business_id: rawItem.business_id,
    item_type: itemType,
    name: rawItem.name || '',
    code: rawItem.code || null,
    sku: rawItem.sku || null,
    barcode: rawItem.barcode || null,
    category_id: rawItem.category_id || null,
    unit_id: rawItem.unit_id || null,
    description: rawItem.description || null,
    short_description: rawItem.short_description || null,
    brand: rawItem.brand || null,
    model: rawItem.model || null,
    purchase_price: purchasePrice,
    default_sale_price: defaultSalePrice,
    tax_rate: taxRate,
    default_discount_percent: defaultDiscount,
    min_stock: Number(rawItem.min_stock) || 0,
    max_stock: rawItem.max_stock != null ? Number(rawItem.max_stock) : null,
    track_inventory: trackInventory,
    is_active: rawItem.is_active !== undefined ? Boolean(rawItem.is_active) : true,
    image_url: rawItem.image_url || null,
    created_by: rawItem.created_by || null,
    created_at: rawItem.created_at || new Date().toISOString(),
    updated_at: rawItem.updated_at || new Date().toISOString(),
    category,
    unit,
    prices: rawItem.prices || [],
    attributes: rawItem.attributes || [],
  };
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
      const list = ItemRepository.getAll(businessId) || [];
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
      let query = supabase
        .from('items')
        .select('id, name, sku, barcode, code')
        .eq('business_id', businessId);
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
      const rawList = ItemRepository.getAll(businessId) || [];
      const categoriesList = CategoryRepository.getAll(businessId) || [];
      const unitsList = UnitRepository.getAll(businessId) || [];

      let list = rawList.map((i) => mapToCanonicalItem(i, categoriesList, unitsList));

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
            (i.code && i.code.toLowerCase().includes(q)) ||
            (i.sku && i.sku.toLowerCase().includes(q)) ||
            (i.barcode && i.barcode.includes(q)) ||
            (i.brand && i.brand.toLowerCase().includes(q)) ||
            (i.model && i.model.toLowerCase().includes(q)) ||
            (i.description && i.description.toLowerCase().includes(q))
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
      const raw = ItemRepository.getById(itemId);
      if (!raw || raw.business_id !== businessId) return null;

      const categoriesList = CategoryRepository.getAll(businessId) || [];
      const unitsList = UnitRepository.getAll(businessId) || [];
      return mapToCanonicalItem(raw, categoriesList, unitsList);
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
      const newItemId = input.id || `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();

      const pricesList = (input.prices || []).map((p, idx) => ({
        id: `ip_${Date.now()}_${idx}`,
        item_id: newItemId,
        price_list_id: p.price_list_id,
        price: Number(p.price) || 0,
        min_quantity: p.min_quantity || 1,
      }));

      const attrsList = (input.attributes || []).map((a, idx) => ({
        id: `ia_${Date.now()}_${idx}`,
        item_id: newItemId,
        attribute_name: a.attribute_name,
        attribute_value: a.attribute_value,
      }));

      const defaultSalePrice = Number(input.default_sale_price) || 0;

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
        default_sale_price: defaultSalePrice,
        tax_rate: Number(input.tax_rate) || 0,
        default_discount_percent: Number(input.default_discount_percent) || 0,
        min_stock: Number(input.min_stock) || 0,
        max_stock: input.max_stock ? Number(input.max_stock) : null,
        track_inventory: trackInventory,
        is_active: input.is_active !== undefined ? input.is_active : true,
        image_url: input.image_url || null,
        created_by: currentUserId || null,
        created_at: now,
        updated_at: now,
        prices: pricesList,
        attributes: attrsList,
      };

      // Support legacy fields at boundary
      ItemRepository.create({
        ...newItem,
        type: newItem.item_type,
        sale_price: defaultSalePrice,
      } as any);

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
    const trackInventory =
      itemType === 'service'
        ? false
        : input.track_inventory !== undefined
        ? input.track_inventory
        : existing.track_inventory;

    if (!isSupabaseConfigured()) {
      const now = new Date().toISOString();
      const updates: Partial<Item> & { type?: string; sale_price?: number } = {
        ...input,
        item_type: itemType,
        track_inventory: trackInventory,
        updated_at: now,
      };

      if (input.item_type) {
        updates.type = input.item_type;
      }
      if (input.default_sale_price !== undefined) {
        updates.sale_price = Number(input.default_sale_price);
      }

      if (input.prices) {
        updates.prices = (input.prices || []).map((p, i) => ({
          id: `ip_${Date.now()}_${i}`,
          item_id: itemId,
          price_list_id: p.price_list_id,
          price: Number(p.price) || 0,
          min_quantity: p.min_quantity || 1,
        }));
      }

      if (input.attributes) {
        updates.attributes = (input.attributes || []).map((a, i) => ({
          id: `ia_${Date.now()}_${i}`,
          item_id: itemId,
          attribute_name: a.attribute_name,
          attribute_value: a.attribute_value,
        }));
      }

      ItemRepository.update(itemId, updates as any);
      const updated = await this.getItemById(businessId, itemId);
      return updated!;
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
          purchase_price:
            input.purchase_price !== undefined ? Number(input.purchase_price) : undefined,
          default_sale_price:
            input.default_sale_price !== undefined ? Number(input.default_sale_price) : undefined,
          tax_rate: input.tax_rate !== undefined ? Number(input.tax_rate) : undefined,
          default_discount_percent:
            input.default_discount_percent !== undefined
              ? Number(input.default_discount_percent)
              : undefined,
          min_stock: input.min_stock !== undefined ? Number(input.min_stock) : undefined,
          max_stock:
            input.max_stock !== undefined
              ? input.max_stock
                ? Number(input.max_stock)
                : null
              : undefined,
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
      ItemRepository.update(itemId, { is_active: false, updated_at: new Date().toISOString() });
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
      ItemRepository.delete(itemId);
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
      const item: any = ItemRepository.getById(itemId);
      return item?.prices || [];
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
    if (!isSupabaseConfigured()) {
      ItemRepository.update(itemId, { prices: prices as any } as any);
      return true;
    }

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
