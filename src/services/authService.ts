import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Profile,
  Business,
  BusinessMemberWithDetails,
  Role,
  AuditLog,
} from '../types/auth';

// Helper to generate a slug from business name
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `biz-${Date.now()}`;
}

export const authService = {
  // Check if Supabase client is properly configured with environment variables
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  // Get current auth session from Supabase
  async getSession() {
    if (!this.isConfigured()) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase getSession error:', error.message);
      return null;
    }
    return data.session;
  },

  // Fetch profile for user ID
  async getProfile(userId: string): Promise<Profile | null> {
    if (!this.isConfigured()) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Error fetching profile:', error.message);
      return null;
    }
    return data as Profile;
  },

  // Fetch all business memberships for user
  async getUserMemberships(userId: string): Promise<BusinessMemberWithDetails[]> {
    if (!this.isConfigured()) return [];

    const { data: members, error } = await supabase
      .from('business_members')
      .select(`
        *,
        business:businesses (*),
        role:roles (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.warn('Error fetching business memberships:', error.message);
      return [];
    }

    if (!members) return [];

    // For each membership, load its permissions
    const detailedMemberships: BusinessMemberWithDetails[] = await Promise.all(
      members.map(async (item: any) => {
        let permissions: string[] = [];
        if (item.role_id) {
          const { data: permData } = await supabase
            .from('role_permissions')
            .select('permissions (key)')
            .eq('role_id', item.role_id);

          if (permData) {
            permissions = permData
              .map((p: any) => p.permissions?.key)
              .filter(Boolean);
          }
        }

        return {
          id: item.id,
          business_id: item.business_id,
          user_id: item.user_id,
          role_id: item.role_id,
          is_active: item.is_active,
          joined_at: item.joined_at,
          business: item.business as Business,
          role: item.role as Role,
          permissions,
        };
      })
    );

    return detailedMemberships;
  },

  // Create a new business and assign owner membership to current user
  async createBusiness(
    userId: string,
    payload: {
      name: string;
      phone?: string;
      nationalId?: string;
      currency?: string;
    }
  ): Promise<BusinessMemberWithDetails> {
    if (!this.isConfigured()) {
      throw new Error('Supabase is not configured yet');
    }

    const slug = `${slugify(payload.name)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Create Business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        name: payload.name,
        slug,
        phone: payload.phone || null,
        national_id: payload.nationalId || null,
        currency: payload.currency || 'IRR',
        is_active: true,
      })
      .select('*')
      .single();

    if (bizError || !business) {
      throw new Error(bizError?.message || 'خطا در ایجاد کسب‌وکار جدید');
    }

    // 2. Find system owner role ID
    let ownerRoleId: string | null = null;
    const { data: ownerRole } = await supabase
      .from('roles')
      .select('id')
      .eq('slug', 'owner')
      .eq('is_system', true)
      .single();

    if (ownerRole) {
      ownerRoleId = ownerRole.id;
    } else {
      // Fallback: search any owner role or first available role
      const { data: fallbackRoles } = await supabase.from('roles').select('id').limit(1);
      if (fallbackRoles && fallbackRoles.length > 0) {
        ownerRoleId = fallbackRoles[0].id;
      }
    }

    if (!ownerRoleId) {
      throw new Error('نقش مالک کسب‌وکار در سیستم یافت نشد');
    }

    // 3. Create Business Member
    const { data: member, error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: business.id,
        user_id: userId,
        role_id: ownerRoleId,
        is_active: true,
      })
      .select(`
        *,
        business:businesses (*),
        role:roles (*)
      `)
      .single();

    if (memberError || !member) {
      throw new Error(memberError?.message || 'خطا در افزودن مدیر به کسب‌وکار');
    }

    // 4. Log Audit Action
    await this.logAuditAction({
      businessId: business.id,
      userId,
      action: 'CREATE',
      entityType: 'business',
      entityId: business.id,
      newData: { name: business.name },
    });

    return {
      id: member.id,
      business_id: member.business_id,
      user_id: member.user_id,
      role_id: member.role_id,
      is_active: member.is_active,
      joined_at: member.joined_at,
      business: member.business as Business,
      role: member.role as Role,
      permissions: ['*'], // Owner gets full access
    };
  },

  // Audit Logger
  async logAuditAction(payload: {
    businessId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
  }) {
    if (!this.isConfigured()) return;
    try {
      await supabase.from('audit_logs').insert({
        business_id: payload.businessId,
        user_id: payload.userId,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId || null,
        old_data: payload.oldData || null,
        new_data: payload.newData || null,
      });
    } catch (e) {
      console.warn('Failed to log audit action:', e);
    }
  },
};
