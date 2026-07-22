export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
  national_id: string | null;
  economic_code: string | null;
  currency: 'IRR' | 'IRT' | 'تومان' | 'ریال' | string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  business_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role_id: string;
  is_active: boolean;
  joined_at: string;
}

export interface BusinessMemberWithDetails extends BusinessMember {
  business: Business;
  role?: Role;
  permissions?: string[];
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data?: Record<string, any> | null;
  new_data?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface UserAuthSession {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: Profile | null;
  currentBusiness: Business | null;
  currentMember: BusinessMember | null;
  currentRole: Role | null;
  permissions: string[];
  userMemberships: BusinessMemberWithDetails[];
}
