-- NexAccounting Phase 2 Database Schema Migration
-- Multi-Tenant Foundation, Profiles, Businesses, Roles, Permissions, Business Members & Audit Logs

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    postal_code TEXT,
    national_id TEXT,
    economic_code TEXT,
    currency TEXT DEFAULT 'IRR',
    timezone TEXT DEFAULT 'Asia/Tehran',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

-- 7. ROLE_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 8. BUSINESS_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_business_user UNIQUE(business_id, user_id)
);

-- 9. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON public.business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON public.business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_roles_business_id ON public.roles(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON public.audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 11. TRIGGERS FOR UPDATED_AT
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. SEED BASE SYSTEM PERMISSIONS
INSERT INTO public.permissions (key, name, description) VALUES
    ('dashboard.view', 'مشاهده داشبورد', 'دسترسی به صفحه اصلی و آمارهای داشبورد'),
    ('sales.view', 'مشاهده فروش', 'دسترسی به لیست فاکتورها و پیش‌فاکتورهای فروش'),
    ('sales.create', 'ایجاد فاکتور فروش', 'امکان صدور فاکتور و پیش‌فاکتور فروش جدید'),
    ('sales.update', 'ویرایش فروش', 'امکان ویرایش فاکتورهای فروش'),
    ('sales.delete', 'حذف فروش', 'امکان حذف یا ابطال فاکتورهای فروش'),
    ('purchases.view', 'مشاهده خرید', 'دسترسی به لیست فاکتورهای خرید'),
    ('purchases.create', 'ایجاد خرید', 'امکان ثبت فاکتور خرید جدید'),
    ('purchases.update', 'ویرایش خرید', 'امکان ویرایش فاکتور خرید'),
    ('purchases.delete', 'حذف خرید', 'امکان حذف فاکتور خرید'),
    ('parties.view', 'مشاهده اشخاص', 'مشاهده لیست مشتریان و تأمین‌کنندگان'),
    ('parties.create', 'ایجاد شخص', 'تعریف مشتری یا تأمین‌کننده جدید'),
    ('parties.update', 'ویرایش شخص', 'ویرایش اطلاعات اشخاص و طرف‌های حساب'),
    ('parties.delete', 'حذف شخص', 'حذف پرونده اشخاص'),
    ('products.view', 'مشاهده کالاها', 'مشاهده کالاها و خدمات'),
    ('products.create', 'ایجاد کالا', 'تعریف کالا یا خدمت جدید'),
    ('products.update', 'ویرایش کالا', 'ویرایش اطلاعات کالاها'),
    ('products.delete', 'حذف کالا', 'حذف کالاها از لیست'),
    ('inventory.view', 'مشاهده انبار', 'مشاهده کاردکس و موجودی انبار'),
    ('inventory.create', 'ثبت اسناد انبار', 'ثبت حواله و رسید انبار'),
    ('inventory.update', 'ویرایش انبار', 'اصلاح موجودی و انبارگردانی'),
    ('treasury.view', 'مشاهده خزانه', 'مشاهده حساب‌های بانکی، صندوق و دریافت/پرداخت'),
    ('treasury.create', 'ثبت تراکنش خزانه', 'ثبت دریافت و پرداخت نقدی و بانکی'),
    ('treasury.update', 'ویرایش خزانه', 'ویرایش تراکنش‌های خزانهداری'),
    ('checks.view', 'مشاهده چک‌ها', 'مشاهده چک‌های دریافتی و پرداختی'),
    ('checks.create', 'ثبت چک', 'ثبت و واگذاری چک‌های جدید'),
    ('checks.update', 'تغییر وضعیت چک', 'پاس کردن، برگشت یا خرج کردن چک'),
    ('accounting.view', 'مشاهده حسابداری', 'مشاهده کدینگ حساب‌ها و اسناد حسابداری'),
    ('accounting.create', 'ثبت سند حسابداری', 'ثبت سند حسابداری دستی'),
    ('accounting.update', 'ویرایش سند حسابداری', 'ویرایش اسناد حسابداری'),
    ('reports.view', 'مشاهده گزارش‌ها', 'دسترسی به گزارش‌های مالی و مدیریتی'),
    ('settings.view', 'مشاهده تنظیمات', 'دسترسی به تنظیمات سیستم و کسب‌وکار'),
    ('settings.update', 'ویرایش تنظیمات', 'تغییر تنظیمات مالی و کسب‌وکار'),
    ('users.view', 'مشاهده کاربران', 'مشاهده اعضای کسب‌وکار'),
    ('users.manage', 'مدیریت کاربران', 'دعوت و مدیریت دسترسی اعضای کسب‌وکار')
ON CONFLICT (key) DO NOTHING;

-- 14. SEED BASE SYSTEM ROLES
INSERT INTO public.roles (name, slug, description, is_system) VALUES
    ('مالک کسب‌وکار', 'owner', 'دسترسی کامل به تمام امکانات و تنظیمات کسب‌وکار', TRUE),
    ('مدیر سیستم', 'admin', 'مدیریت عملیات مالی، تنظیمات و کاربران', TRUE),
    ('حسابدار', 'accountant', 'دسترسی به اسناد حسابداری، گزارش‌ها، دریافت و پرداخت', TRUE),
    ('کارشناس فروش', 'sales', 'ثبت و مدیریت فاکتورها و مشتریان', TRUE),
    ('انباردار', 'warehouse', 'مدیریت موجودی، رسیدها و حواله‌های انبار', TRUE),
    ('صندوق‌دار', 'cashier', 'ثبت دریافت و پرداخت‌های روزانه', TRUE),
    ('مشاهده‌کننده', 'viewer', 'فقط مشاهده گزارش‌ها و اطلاعات بدون امکان ثبت یا ویرایش', TRUE)
ON CONFLICT DO NOTHING;

-- LINK OWNER ROLE TO ALL PERMISSIONS
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'owner' AND r.is_system = TRUE
ON CONFLICT DO NOTHING;

-- 15. HELPER SECURITY DEFINER FUNCTIONS (Prevents Recursive RLS)
CREATE OR REPLACE FUNCTION public.is_business_member(b_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = b_id
      AND user_id = auth.uid()
      AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(b_id UUID, perm_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members bm
    JOIN public.role_permissions rp ON rp.role_id = bm.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE bm.business_id = b_id
      AND bm.user_id = auth.uid()
      AND bm.is_active = TRUE
      AND p.key = perm_key
  );
$$;

-- 16. ROW LEVEL SECURITY (RLS) SETUP
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS POLICIES: BUSINESSES
DROP POLICY IF EXISTS "Members can view their business" ON public.businesses;
CREATE POLICY "Members can view their business" ON public.businesses
    FOR SELECT USING (public.is_business_member(id));

DROP POLICY IF EXISTS "Authenticated users can create a business" ON public.businesses;
CREATE POLICY "Authenticated users can create a business" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners/Admins can update their business" ON public.businesses;
CREATE POLICY "Owners/Admins can update their business" ON public.businesses
    FOR UPDATE USING (public.has_permission(id, 'settings.update'));

-- RLS POLICIES: BUSINESS_MEMBERS
DROP POLICY IF EXISTS "Members can view co-members in their business" ON public.business_members;
CREATE POLICY "Members can view co-members in their business" ON public.business_members
    FOR SELECT USING (user_id = auth.uid() OR public.is_business_member(business_id));

DROP POLICY IF EXISTS "Users can insert membership during business setup" ON public.business_members;
CREATE POLICY "Users can insert membership during business setup" ON public.business_members
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.has_permission(business_id, 'users.manage'));

DROP POLICY IF EXISTS "Managers can update members" ON public.business_members;
CREATE POLICY "Managers can update members" ON public.business_members
    FOR UPDATE USING (public.has_permission(business_id, 'users.manage'));

-- RLS POLICIES: ROLES
DROP POLICY IF EXISTS "Anyone can view system or business roles" ON public.roles;
CREATE POLICY "Anyone can view system or business roles" ON public.roles
    FOR SELECT USING (is_system = TRUE OR (business_id IS NOT NULL AND public.is_business_member(business_id)));

-- RLS POLICIES: PERMISSIONS & ROLE_PERMISSIONS
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS POLICIES: AUDIT_LOGS
DROP POLICY IF EXISTS "Members can view audit logs" ON public.audit_logs;
CREATE POLICY "Members can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members can insert audit logs" ON public.audit_logs;
CREATE POLICY "Members can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_business_member(business_id) AND user_id = auth.uid());
