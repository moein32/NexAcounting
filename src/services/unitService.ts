import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { Unit, UnitType } from '../types/catalog';

const DEMO_UNITS_STORAGE_KEY = 'nex_demo_units_data';

const INITIAL_DEMO_UNITS: Unit[] = [
  {
    id: 'unit_1',
    business_id: 'demo_biz_1',
    name: 'عدد',
    symbol: 'عدد',
    unit_type: 'count',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'unit_2',
    business_id: 'demo_biz_1',
    name: 'مترمربع',
    symbol: 'm²',
    unit_type: 'area',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'unit_3',
    business_id: 'demo_biz_1',
    name: 'متر',
    symbol: 'm',
    unit_type: 'length',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'unit_4',
    business_id: 'demo_biz_1',
    name: 'کیلوگرم',
    symbol: 'kg',
    unit_type: 'weight',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'unit_5',
    business_id: 'demo_biz_1',
    name: 'خدمت / سرویس',
    symbol: 'خدمت',
    unit_type: 'service',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'unit_6',
    business_id: 'demo_biz_1',
    name: 'ساعت',
    symbol: 'h',
    unit_type: 'time',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'unit_7',
    business_id: 'demo_biz_1',
    name: 'دستگاه',
    symbol: 'دستگاه',
    unit_type: 'count',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'unit_8',
    business_id: 'demo_biz_1',
    name: 'شاخه',
    symbol: 'شاخه',
    unit_type: 'count',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
];

function getDemoUnitsFromStorage(businessId: string): Unit[] {
  try {
    const raw = localStorage.getItem(DEMO_UNITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DEMO_UNITS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_UNITS));
      return INITIAL_DEMO_UNITS.filter((u) => u.business_id === businessId);
    }
    const parsed: Unit[] = JSON.parse(raw);
    const filtered = parsed.filter((u) => u.business_id === businessId);
    if (filtered.length === 0 && businessId === 'demo_biz_1') {
      return INITIAL_DEMO_UNITS;
    }
    return filtered;
  } catch {
    return INITIAL_DEMO_UNITS.filter((u) => u.business_id === businessId);
  }
}

function saveDemoUnitsToStorage(units: Unit[]) {
  try {
    const raw = localStorage.getItem(DEMO_UNITS_STORAGE_KEY);
    let all: Unit[] = raw ? JSON.parse(raw) : INITIAL_DEMO_UNITS;

    units.forEach((updated) => {
      const idx = all.findIndex((u) => u.id === updated.id);
      if (idx >= 0) {
        all[idx] = updated;
      } else {
        all.unshift(updated);
      }
    });
    localStorage.setItem(DEMO_UNITS_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving demo units:', e);
  }
}

export const unitService = {
  async getUnits(businessId: string): Promise<Unit[]> {
    if (!isSupabaseConfigured()) {
      return getDemoUnitsFromStorage(businessId);
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
      return [];
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
      saveDemoUnitsToStorage([newUnit]);
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
      const list = getDemoUnitsFromStorage(businessId);
      const unit = list.find((u) => u.id === unitId);
      if (!unit) throw new Error('واحد پیدا نشد');

      if (data.name !== undefined) unit.name = data.name.trim();
      if (data.symbol !== undefined) unit.symbol = data.symbol?.trim() || null;
      if (data.unit_type !== undefined) unit.unit_type = data.unit_type;
      if (data.is_active !== undefined) unit.is_active = data.is_active;

      saveDemoUnitsToStorage([unit]);
      return unit;
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
