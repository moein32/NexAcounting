import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { ItemCategory } from '../types/catalog';

const DEMO_CATEGORIES_STORAGE_KEY = 'nex_demo_item_categories';

const INITIAL_DEMO_CATEGORIES: ItemCategory[] = [
  {
    id: 'cat_1',
    business_id: 'demo_biz_1',
    parent_id: null,
    name: 'پنجره و درب',
    description: 'انواع پنجره و درب‌های ساختمانی و صنعتی',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat_1_1',
    business_id: 'demo_biz_1',
    parent_id: 'cat_1',
    name: 'پنجره UPVC',
    description: 'پنجره‌های دوجداره و سه جداره یوپی‌وی‌سی',
    is_active: true,
    created_at: new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat_1_2',
    business_id: 'demo_biz_1',
    parent_id: 'cat_1',
    name: 'پنجره آلومینیومی',
    description: 'پنجره‌های آلومینیومی ترمال بریک و نرمال',
    is_active: true,
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat_2',
    business_id: 'demo_biz_1',
    parent_id: null,
    name: 'شیشه ساختمانی',
    description: 'انواع شیشه دوجداره، سه جداره و لمینت',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat_2_1',
    business_id: 'demo_biz_1',
    parent_id: 'cat_2',
    name: 'شیشه دوجداره',
    description: 'شیشه‌های دوجداره صنعتی با گاز آرگون',
    is_active: true,
    created_at: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat_3',
    business_id: 'demo_biz_1',
    parent_id: null,
    name: 'خدمات تخصصی',
    description: 'خدمات نصب، حمل و پشتیبانی فنی',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat_3_1',
    business_id: 'demo_biz_1',
    parent_id: 'cat_3',
    name: 'نصب و اجرا',
    description: 'خدمات نصب پنجره، شیشه و تجهیزات',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat_3_2',
    business_id: 'demo_biz_1',
    parent_id: 'cat_3',
    name: 'حمل و نقل و جابجایی',
    description: 'خدمات ارسال و حمل کالا به محل مشتری',
    is_active: true,
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getDemoCategoriesFromStorage(businessId: string): ItemCategory[] {
  try {
    const raw = localStorage.getItem(DEMO_CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_CATEGORIES));
      return INITIAL_DEMO_CATEGORIES.filter((c) => c.business_id === businessId);
    }
    const parsed: ItemCategory[] = JSON.parse(raw);
    const filtered = parsed.filter((c) => c.business_id === businessId);
    if (filtered.length === 0 && businessId === 'demo_biz_1') {
      return INITIAL_DEMO_CATEGORIES;
    }
    return filtered;
  } catch {
    return INITIAL_DEMO_CATEGORIES.filter((c) => c.business_id === businessId);
  }
}

function saveDemoCategoriesToStorage(categories: ItemCategory[]) {
  try {
    const raw = localStorage.getItem(DEMO_CATEGORIES_STORAGE_KEY);
    let all: ItemCategory[] = raw ? JSON.parse(raw) : INITIAL_DEMO_CATEGORIES;

    categories.forEach((updated) => {
      const idx = all.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        all[idx] = updated;
      } else {
        all.unshift(updated);
      }
    });
    localStorage.setItem(DEMO_CATEGORIES_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving demo categories:', e);
  }
}

export const categoryService = {
  async getCategories(businessId: string): Promise<ItemCategory[]> {
    if (!isSupabaseConfigured()) {
      const flatList = getDemoCategoriesFromStorage(businessId);
      
      // Attach parent_name and build hierarchy
      return flatList.map((cat) => {
        const parent = flatList.find((p) => p.id === cat.parent_id);
        return {
          ...cat,
          parent_name: parent ? parent.name : null,
        };
      });
    }

    try {
      const { data, error } = await supabase
        .from('item_categories')
        .select('*')
        .eq('business_id', businessId)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);

      const flatList: ItemCategory[] = data || [];
      return flatList.map((cat) => {
        const parent = flatList.find((p) => p.id === cat.parent_id);
        return {
          ...cat,
          parent_name: parent ? parent.name : null,
        };
      });
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      return [];
    }
  },

  async createCategory(
    businessId: string,
    data: { name: string; parent_id?: string | null; description?: string | null },
    currentUserId?: string
  ): Promise<ItemCategory> {
    const name = data.name.trim();
    if (!name) throw new Error('نام دسته‌بندی الزامی است');

    // Prevent self-referencing or circular
    const parentId = data.parent_id || null;

    if (!isSupabaseConfigured()) {
      const newCat: ItemCategory = {
        id: `cat_${Date.now()}`,
        business_id: businessId,
        parent_id: parentId,
        name,
        description: data.description || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDemoCategoriesToStorage([newCat]);
      return newCat;
    }

    try {
      const { data: newCat, error } = await supabase
        .from('item_categories')
        .insert({
          business_id: businessId,
          parent_id: parentId,
          name,
          description: data.description || null,
          is_active: true,
        })
        .select('*')
        .single();

      if (error || !newCat) {
        throw new Error(error?.message || 'خطا در ثبت دسته‌بندی جدید');
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_CATEGORY',
          entityType: 'item_categories',
          entityId: newCat.id,
          newData: { name: newCat.name },
        });
      }

      return newCat;
    } catch (err: any) {
      console.error('Error creating category:', err);
      throw new Error(err.message || 'خطا در تعریف دسته‌بندی');
    }
  },

  async updateCategory(
    businessId: string,
    categoryId: string,
    data: { name?: string; parent_id?: string | null; description?: string | null; is_active?: boolean },
    currentUserId?: string
  ): Promise<ItemCategory> {
    // Check circular reference if setting parent_id
    if (data.parent_id === categoryId) {
      throw new Error('یک دسته‌بندی نمی‌تواند زیرمجموعه خودش باشد.');
    }

    if (!isSupabaseConfigured()) {
      const list = getDemoCategoriesFromStorage(businessId);
      const cat = list.find((c) => c.id === categoryId);
      if (!cat) throw new Error('دسته‌بندی پیدا نشد');

      if (data.name !== undefined) cat.name = data.name.trim();
      if (data.parent_id !== undefined) cat.parent_id = data.parent_id;
      if (data.description !== undefined) cat.description = data.description;
      if (data.is_active !== undefined) cat.is_active = data.is_active;
      cat.updated_at = new Date().toISOString();

      saveDemoCategoriesToStorage([cat]);
      return cat;
    }

    try {
      const { data: updated, error } = await supabase
        .from('item_categories')
        .update({
          name: data.name?.trim(),
          parent_id: data.parent_id === undefined ? undefined : data.parent_id,
          description: data.description,
          is_active: data.is_active,
        })
        .eq('id', categoryId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (error || !updated) {
        throw new Error(error?.message || 'خطا در ویرایش دسته‌بندی');
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'UPDATE_CATEGORY',
          entityType: 'item_categories',
          entityId: categoryId,
          newData: data,
        });
      }

      return updated;
    } catch (err: any) {
      console.error('Error updating category:', err);
      throw new Error(err.message || 'خطا در ویرایش دسته‌بندی');
    }
  },

  async deactivateCategory(
    businessId: string,
    categoryId: string,
    currentUserId?: string
  ): Promise<boolean> {
    return this.updateCategory(
      businessId,
      categoryId,
      { is_active: false },
      currentUserId
    ).then(() => true);
  },

  async deleteCategory(
    businessId: string,
    categoryId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const raw = localStorage.getItem(DEMO_CATEGORIES_STORAGE_KEY);
      let list: ItemCategory[] = raw ? JSON.parse(raw) : INITIAL_DEMO_CATEGORIES;
      list = list.filter((c) => c.id !== categoryId);
      localStorage.setItem(DEMO_CATEGORIES_STORAGE_KEY, JSON.stringify(list));
      return true;
    }

    try {
      // Check if items are attached to this category
      const { count, error: countError } = await supabase
        .from('items')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (countError) throw countError;

      if (count && count > 0) {
        throw new Error('این دسته‌بندی دارای کالا یا خدمت است و نمی‌توان آن را به طور کامل حذف کرد. لطفاً آن را غیرفعال کنید.');
      }

      const { error } = await supabase
        .from('item_categories')
        .delete()
        .eq('id', categoryId)
        .eq('business_id', businessId);

      if (error) throw error;

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'DELETE_CATEGORY',
          entityType: 'item_categories',
          entityId: categoryId,
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting category:', err);
      throw new Error(err.message || 'امکان حذف این دسته‌بندی وجود ندارد.');
    }
  },
};
