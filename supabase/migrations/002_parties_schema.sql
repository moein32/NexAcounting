-- NexAccounting Phase 3 Database Schema Migration
-- Party Management System (Parties, Party Roles, Contacts, Addresses & Financial Profiles)

-- 1. PARTIES TABLE
CREATE TABLE IF NOT EXISTS public.parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    party_type TEXT NOT NULL CHECK (party_type IN ('individual', 'company', 'organization', 'other')),
    display_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    national_id TEXT,
    economic_code TEXT,
    registration_number TEXT,
    postal_code TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    country TEXT DEFAULT 'IR',
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PARTY_ROLES TABLE
CREATE TABLE IF NOT EXISTS public.party_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'supplier', 'employee', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_party_role UNIQUE(party_id, role)
);

-- 3. PARTY_CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.party_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PARTY_ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.party_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    title TEXT,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'IR',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PARTY_FINANCIAL_PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.party_financial_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID UNIQUE NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
    credit_limit NUMERIC DEFAULT 0,
    opening_balance NUMERIC DEFAULT 0,
    opening_balance_type TEXT DEFAULT 'debit' CHECK (opening_balance_type IN ('debit', 'credit')),
    payment_terms_days INTEGER DEFAULT 0,
    default_discount_percent NUMERIC DEFAULT 0,
    tax_exempt BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_parties_business_id ON public.parties(business_id);
CREATE INDEX IF NOT EXISTS idx_parties_display_name ON public.parties(display_name);
CREATE INDEX IF NOT EXISTS idx_parties_phone ON public.parties(phone);
CREATE INDEX IF NOT EXISTS idx_parties_mobile ON public.parties(mobile);
CREATE INDEX IF NOT EXISTS idx_parties_national_id ON public.parties(national_id);
CREATE INDEX IF NOT EXISTS idx_parties_economic_code ON public.parties(economic_code);
CREATE INDEX IF NOT EXISTS idx_party_roles_party_id ON public.party_roles(party_id);
CREATE INDEX IF NOT EXISTS idx_party_contacts_party_id ON public.party_contacts(party_id);
CREATE INDEX IF NOT EXISTS idx_party_addresses_party_id ON public.party_addresses(party_id);
CREATE INDEX IF NOT EXISTS idx_party_financial_profiles_party_id ON public.party_financial_profiles(party_id);

-- 7. TRIGGERS FOR UPDATED_AT
DROP TRIGGER IF EXISTS set_parties_updated_at ON public.parties;
CREATE TRIGGER set_parties_updated_at
    BEFORE UPDATE ON public.parties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_party_financial_profiles_updated_at ON public.party_financial_profiles;
CREATE TRIGGER set_party_financial_profiles_updated_at
    BEFORE UPDATE ON public.party_financial_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. ADD NEW PERMISSIONS FOR PARTIES
INSERT INTO public.permissions (key, name, description) VALUES
    ('parties.view', 'مشاهده طرف‌های حساب', 'دسترسی به فهرست مشتریان و تأمین‌کنندگان'),
    ('parties.create', 'ایجاد طرف حساب', 'امکان ثبت مشتری یا تأمین‌کننده جدید'),
    ('parties.update', 'ویرایش طرف حساب', 'امکان ویرایش مشخصات طرف‌های حساب'),
    ('parties.delete', 'حذف طرف حساب', 'امکان غیرفعال‌سازی یا حذف طرف حساب')
ON CONFLICT (key) DO NOTHING;

-- LINK ALL PARTY PERMISSIONS TO OWNER AND ADMIN ROLES
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug IN ('owner', 'admin', 'accountant', 'sales') 
  AND p.key IN ('parties.view', 'parties.create', 'parties.update', 'parties.delete')
ON CONFLICT DO NOTHING;

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_financial_profiles ENABLE ROW LEVEL SECURITY;

-- Helper to check party ownership via business membership
CREATE OR REPLACE FUNCTION public.can_access_party(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parties p
    WHERE p.id = p_id
      AND public.is_business_member(p.business_id)
  );
$$;

-- RLS POLICIES FOR PARTIES
DROP POLICY IF EXISTS "Business members can view parties" ON public.parties;
CREATE POLICY "Business members can view parties" ON public.parties
    FOR SELECT USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Business members with perm can create parties" ON public.parties;
CREATE POLICY "Business members with perm can create parties" ON public.parties
    FOR INSERT WITH CHECK (public.has_permission(business_id, 'parties.create'));

DROP POLICY IF EXISTS "Business members with perm can update parties" ON public.parties;
CREATE POLICY "Business members with perm can update parties" ON public.parties
    FOR UPDATE USING (public.has_permission(business_id, 'parties.update'));

DROP POLICY IF EXISTS "Business members with perm can delete parties" ON public.parties;
CREATE POLICY "Business members with perm can delete parties" ON public.parties
    FOR DELETE USING (public.has_permission(business_id, 'parties.delete'));

-- RLS POLICIES FOR PARTY_ROLES
DROP POLICY IF EXISTS "Business members can view party roles" ON public.party_roles;
CREATE POLICY "Business members can view party roles" ON public.party_roles
    FOR SELECT USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can insert party roles" ON public.party_roles;
CREATE POLICY "Business members can insert party roles" ON public.party_roles
    FOR INSERT WITH CHECK (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can update party roles" ON public.party_roles;
CREATE POLICY "Business members can update party roles" ON public.party_roles
    FOR UPDATE USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can delete party roles" ON public.party_roles;
CREATE POLICY "Business members can delete party roles" ON public.party_roles
    FOR DELETE USING (public.can_access_party(party_id));

-- RLS POLICIES FOR PARTY_CONTACTS
DROP POLICY IF EXISTS "Business members can view party contacts" ON public.party_contacts;
CREATE POLICY "Business members can view party contacts" ON public.party_contacts
    FOR SELECT USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can insert party contacts" ON public.party_contacts;
CREATE POLICY "Business members can insert party contacts" ON public.party_contacts
    FOR INSERT WITH CHECK (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can update party contacts" ON public.party_contacts;
CREATE POLICY "Business members can update party contacts" ON public.party_contacts
    FOR UPDATE USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can delete party contacts" ON public.party_contacts;
CREATE POLICY "Business members can delete party contacts" ON public.party_contacts
    FOR DELETE USING (public.can_access_party(party_id));

-- RLS POLICIES FOR PARTY_ADDRESSES
DROP POLICY IF EXISTS "Business members can view party addresses" ON public.party_addresses;
CREATE POLICY "Business members can view party addresses" ON public.party_addresses
    FOR SELECT USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can insert party addresses" ON public.party_addresses;
CREATE POLICY "Business members can insert party addresses" ON public.party_addresses
    FOR INSERT WITH CHECK (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can update party addresses" ON public.party_addresses;
CREATE POLICY "Business members can update party addresses" ON public.party_addresses
    FOR UPDATE USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can delete party addresses" ON public.party_addresses;
CREATE POLICY "Business members can delete party addresses" ON public.party_addresses
    FOR DELETE USING (public.can_access_party(party_id));

-- RLS POLICIES FOR PARTY_FINANCIAL_PROFILES
DROP POLICY IF EXISTS "Business members can view financial profiles" ON public.party_financial_profiles;
CREATE POLICY "Business members can view financial profiles" ON public.party_financial_profiles
    FOR SELECT USING (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can insert financial profiles" ON public.party_financial_profiles;
CREATE POLICY "Business members can insert financial profiles" ON public.party_financial_profiles
    FOR INSERT WITH CHECK (public.can_access_party(party_id));

DROP POLICY IF EXISTS "Business members can update financial profiles" ON public.party_financial_profiles;
CREATE POLICY "Business members can update financial profiles" ON public.party_financial_profiles
    FOR UPDATE USING (public.can_access_party(party_id));
