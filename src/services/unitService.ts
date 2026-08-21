import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { Unit, UnitType } from '../types/catalog';
import { UnitRepository, ItemRepository } from '../repositories';

export const unitService = {
  async getUnits(businessId: string): Promise<Unit[]> {
    if (!isSupabaseConfigured()) {
      return UnitRepository.getAll(businessId) || [];
    }

    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('business_id', businessId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching units:', err);
      throw err;
    }
  },

  async createUnit(
    businessId: string,
    data: { name: string; symbol?: string | null; unit_type: UnitType },
    currentUserId?: string
  ): Promise<Unit> {
    const name = data.name.trim();
    if (!name) throw new Error('نام واحد اندازه‌گیری الزامی است');

    if (!isSupabaseConfigured()) {
      const newUnit: Unit = {
        id: `unit_${Date.now()}`,
        business_id: businessId,
        name,
        symbol: data.symbol?.trim() || null,
        unit_type: data.unit_type || 'count',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      UnitRepository.create(newUnit);
      return newUnit;
    }

    try {
      const { data: newUnit, error } = await supabase
        .from('units')
        .insert({
          business_id: businessId,
          name,
          symbol: data.symbol?.trim() || null,
          unit_type: data.unit_type || 'count',
          is_active: true,
        })
        .select('*')
        .single();

      if (error || !newUnit) {
        throw new Error(error?.message || 'خطا در تعریف واحد جدید');
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'CREATE_UNIT',
          entityType: 'units',
          entityId: newUnit.id,
          newData: { name: newUnit.name, symbol: newUnit.symbol },
        });
      }

      return newUnit;
    } catch (err: any) {
      console.error('Error creating unit:', err);
      throw new Error(err.message || 'خطا در تعریف واحد اندازه‌گیری');
    }
  },

  async updateUnit(
    businessId: string,
    unitId: string,
    data: { name?: string; symbol?: string | null; unit_type?: UnitType; is_active?: boolean },
    currentUserId?: string
  ): Promise<Unit> {
    if (!isSupabaseConfigured()) {
      const existing = UnitRepository.getById(unitId);
      if (!existing) throw new Error('واحد پیدا نشد');

      const updates: Partial<Unit> = {};
      if (data.name !== undefined) updates.name = data.name.trim();
      if (data.symbol !== undefined) updates.symbol = data.symbol?.trim() || null;
      if (data.unit_type !== undefined) updates.unit_type = data.unit_type;
      if (data.is_active !== undefined) updates.is_active = data.is_active;

      const updated = UnitRepository.update(unitId, updates);
      return updated;
    }

    try {
      const { data: updated, error } = await supabase
        .from('units')
        .update({
          name: data.name?.trim(),
          symbol: data.symbol?.trim() || null,
          unit_type: data.unit_type,
          is_active: data.is_active,
        })
        .eq('id', unitId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (error || !updated) {
        throw new Error(error?.message || 'خطا در ویرایش واحد');
      }

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'UPDATE_UNIT',
          entityType: 'units',
          entityId: unitId,
          newData: data,
        });
      }

      return updated;
    } catch (err: any) {
      console.error('Error updating unit:', err);
      throw new Error(err.message || 'خطا در ویرایش واحد');
    }
  },

  async deleteUnit(
    businessId: string,
    unitId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const items = ItemRepository.getAll(businessId) || [];
      const inUse = items.some((i) => i.unit_id === unitId);
      if (inUse) {
        throw new Error('این واحد در کالاها یا خدمات استفاده شده است و قابل حذف نیست.');
      }
      UnitRepository.delete(unitId);
      return true;
    }

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId)
        .eq('business_id', businessId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('Error deleting unit:', err);
      throw new Error(err.message || 'خطا در حذف واحد');
    }
  },

  async deactivateUnit(
    businessId: string,
    unitId: string,
    currentUserId?: string
  ): Promise<boolean> {
    return this.updateUnit(businessId, unitId, { is_active: false }, currentUserId).then(
      () => true
    );
  },
};
