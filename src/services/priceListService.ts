import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { PriceList } from '../types/catalog';

const DEMO_PRICELISTS_STORAGE_KEY = 'nex_demo_price_lists_data';

const INITIAL_DEMO_PRICELISTS: PriceList[] = [
  {
    id: 'plist_1',
    business_id: 'demo_biz_1',
    name: 'قیمت مصرف‌کننده',
    description: 'لیست قیمت پایه فروش تک‌فروشی و عام',
    is_default: true,
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    item_count: 12,
  },
  {
    id: 'plist_2',
    business_id: 'demo_biz_1',
    name: 'قیمت عمده‌فروشی',
    description: 'قیمت خریدهای بالاي ۱۰ عدد با تخفیف ویژه',
    is_default: false,
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    item_count: 8,
  },
  {
    id: 'plist_3',
    business_id: 'demo_biz_1',
    name: 'قیمت همکار / نماینده',
    description: 'تخفیف ویژه نمایندگان و عاملیت‌های فروش',
    is_default: false,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    item_count: 10,
  },
  {
    id: 'plist_4',
    business_id: 'demo_biz_1',
    name: 'قیمت سازمانی / پروژه‌ای',
    description: 'قیمت رقابتی ویژه مناقصات و پروژه‌های بزرگ',
    is_default: false,
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    item_count: 5,
  },
];

function getDemoPriceListsFromStorage(businessId: string): PriceList[] {
  try {
    const raw = localStorage.getItem(DEMO_PRICELISTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_PRICELISTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PRICELISTS));
      return INITIAL_DEMO_PRICELISTS.filter((p) => p.business_id === businessId);
    }
    const parsed: PriceList[] = JSON.parse(raw);
    const filtered = parsed.filter((p) => p.business_id === businessId);
    if (filtered.length === 0 && businessId === 'demo_biz_1') {
      return INITIAL_DEMO_PRICELISTS;
    }
    return filtered;
  } catch {
    return INITIAL_DEMO_PRICELISTS.filter((p) => p.business_id === businessId);
  }
}

function saveDemoPriceListsToStorage(lists: PriceList[]) {
  try {
    const raw = localStorage.getItem(DEMO_PRICELISTS_STORAGE_KEY);
    let all: PriceList[] = raw ? JSON.parse(raw) : INITIAL_DEMO_PRICELISTS;

    lists.forEach((updated) => {
      const idx = all.findIndex((p) => p.id === updated.id);
      if (idx >= 0) {
        all[idx] = updated;
      } else {
        all.unshift(updated);
      }
    });
    localStorage.setItem(DEMO_PRICELISTS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving demo price lists:', e);
  }
}

export const priceListService = {
  async getPriceLists(businessId: string): Promise<PriceList[]> {
    if (!isSupabaseConfigured()) {
      return getDemoPriceListsFromStorage(businessId);
    }

    try {
      const { data, error } = await supabase
        .from('price_lists')
        .select('*')
        .eq('business_id', businessId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching price lists:', err);
      return [];
    }
  },

  async createPriceList(
    businessId: string,
    data: { name: string; description?: string | null; is_default?: boolean },
    currentUserId?: string
  ): Promise<PriceList> {
    const name = data.name.trim();
    if (!name) throw new Error('نام لیست قیمت الزامی است');

    if (!isSupabaseConfigured()) {
      const list = getDemoPriceListsFromStorage(businessId);
      if (data.is_default) {
        list.forEach((p) => (p.is_default = false));
      }

      const newPList: PriceList = {
        id: `plist_${Date.now()}`,
        business_id: businessId,
        name,
        description: data.description || null,
        is_default: !!data.is_default || list.length === 0,
        is_active: true,
        created_at: new Date().toISOString(),
        item_count: 0,
      };

      list.unshift(newPList);
      saveDemoPriceListsToStorage(list);
      return newPList;
    }

    try {
      if (data.is_default) {
        await supabase
          .from('price_lists')
          .update({ is_default: false })
          .eq('business_id', businessId);
      }

      const { data: newPList, error } = await supabase
        .from('price_lists')
        .insert({
          business_id: businessId,
          name,
          description: data.description || null,
          is_default: !!data.is_default,
          is_active: true,
        })
        .select('*')
        .single();

      if (error || !newPList) {
        throw new Error(error?.message || 'خطا در ثبت لیست قیمت');
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_PRICE_LIST',
          entityType: 'price_lists',
          entityId: newPList.id,
          newData: { name: newPList.name },
        });
      }

      return newPList;
    } catch (err: any) {
      console.error('Error creating price list:', err);
      throw new Error(err.message || 'خطا در تعریف لیست قیمت');
    }
  },

  async updatePriceList(
    businessId: string,
    priceListId: string,
    data: { name?: string; description?: string | null; is_default?: boolean; is_active?: boolean },
    currentUserId?: string
  ): Promise<PriceList> {
    if (!isSupabaseConfigured()) {
      const list = getDemoPriceListsFromStorage(businessId);
      const target = list.find((p) => p.id === priceListId);
      if (!target) throw new Error('لیست قیمت یافت نشد');

      if (data.is_default) {
        list.forEach((p) => (p.is_default = false));
      }

      if (data.name !== undefined) target.name = data.name.trim();
      if (data.description !== undefined) target.description = data.description;
      if (data.is_default !== undefined) target.is_default = data.is_default;
      if (data.is_active !== undefined) target.is_active = data.is_active;

      saveDemoPriceListsToStorage(list);
      return target;
    }

    try {
      if (data.is_default) {
        await supabase
          .from('price_lists')
          .update({ is_default: false })
          .eq('business_id', businessId);
      }

      const { data: updated, error } = await supabase
        .from('price_lists')
        .update({
          name: data.name?.trim(),
          description: data.description,
          is_default: data.is_default,
          is_active: data.is_active,
        })
        .eq('id', priceListId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (error || !updated) {
        throw new Error(error?.message || 'خطا در ویرایش لیست قیمت');
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'UPDATE_PRICE_LIST',
          entityType: 'price_lists',
          entityId: priceListId,
          newData: data,
        });
      }

      return updated;
    } catch (err: any) {
      console.error('Error updating price list:', err);
      throw new Error(err.message || 'خطا در ویرایش لیست قیمت');
    }
  },

  async setDefaultPriceList(businessId: string, priceListId: string): Promise<boolean> {
    return this.updatePriceList(businessId, priceListId, { is_default: true }).then(() => true);
  },

  async deletePriceList(
    businessId: string,
    priceListId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const raw = localStorage.getItem(DEMO_PRICELISTS_STORAGE_KEY);
      let list: PriceList[] = raw ? JSON.parse(raw) : INITIAL_DEMO_PRICELISTS;
      list = list.filter((p) => p.id !== priceListId);
      localStorage.setItem(DEMO_PRICELISTS_STORAGE_KEY, JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await supabase
        .from('price_lists')
        .delete()
        .eq('id', priceListId)
        .eq('business_id', businessId);

      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'DELETE_PRICE_LIST',
          entityType: 'price_lists',
          entityId: priceListId,
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting price list:', err);
      throw new Error(err.message || 'خطا در حذف لیست قیمت');
    }
  },
};
