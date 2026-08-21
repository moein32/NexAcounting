import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { ItemCategory } from '../types/catalog';
import { CategoryRepository, ItemRepository } from '../repositories';

export const categoryService = {
  async getCategories(businessId: string): Promise<ItemCategory[]> {
    if (!isSupabaseConfigured()) {
      const flatList = CategoryRepository.getAll(businessId) || [];
      
      // Attach parent_name and build hierarchy safely
      return flatList.map((cat) => {
        const parent = flatList.find((p) => p.id === cat.parent_id);
        return {
          ...cat,
          parent_name: parent ? parent.name : null,
        } as ItemCategory;
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
      CategoryRepository.create(newCat);
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
    if (data.parent_id === categoryId) {
      throw new Error('یک دسته‌بندی نمی‌تواند زیرمجموعه خودش باشد.');
    }

    if (!isSupabaseConfigured()) {
      const cat = CategoryRepository.getById(categoryId);
      if (!cat) throw new Error('دسته‌بندی پیدا نشد');

      const updates: Partial<ItemCategory> = {};
      if (data.name !== undefined) updates.name = data.name.trim();
      if (data.parent_id !== undefined) updates.parent_id = data.parent_id;
      if (data.description !== undefined) updates.description = data.description;
      if (data.is_active !== undefined) updates.is_active = data.is_active;
      updates.updated_at = new Date().toISOString();

      const updated = CategoryRepository.update(categoryId, updates);
      return updated;
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
      // Check if items are attached to this category
      const items = ItemRepository.getAll(businessId);
      const hasItems = items.some((item) => item.category_id === categoryId);
      if (hasItems) {
        throw new Error('این دسته‌بندی دارای کالا یا خدمت است و نمی‌توان آن را به طور کامل حذف کرد. لطفاً آن را غیرفعال کنید.');
      }
      CategoryRepository.delete(categoryId);
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
