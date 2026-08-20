-- NexAccounting Migration 006: License and Subscription Architecture
-- Plans, Subscriptions, Licenses, Business Access, Device Activations

-- 1. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    max_devices INTEGER DEFAULT 1,
    max_businesses INTEGER DEFAULT 1,
    price_monthly NUMERIC DEFAULT 0,
    price_yearly NUMERIC DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Plans
INSERT INTO public.plans (code, name, description, max_devices, max_businesses, price_monthly, price_yearly, features)
VALUES 
    ('free', 'نسخه رایگان پایه', 'برای کسب‌وکارهای نوپا و تک کاربره', 1, 1, 0, 0, '["sales", "purchases", "inventory"]'::jsonb),
    ('professional', 'نسخه حرفه‌ای', 'برای شرکت‌های متوسط با خزانه و گزارشات کامل', 3, 3, 290000, 2900000, '["sales", "purchases", "inventory", "treasury", "reports", "backup"]'::jsonb),
    ('enterprise', 'نسخه سازمانی', 'برای مجموعه‌های بزرگ با چند کاربر و امنیت پیشرفته', 10, 10, 790000, 7900000, '["sales", "purchases", "inventory", "treasury", "reports", "backup", "multi_user", "audit_logs"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due', 'expired')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LICENSES TABLE
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'professional', 'enterprise')),
    max_devices INTEGER NOT NULL DEFAULT 1,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    signature TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LICENSE ACTIVATIONS / DEVICE REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.license_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    platform TEXT,
    ip_address TEXT,
    last_validated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (license_id, device_id)
);

-- 5. BUSINESS ACCESS CONTROL TABLE
CREATE TABLE IF NOT EXISTS public.business_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'accountant', 'sales', 'warehouse', 'cashier', 'viewer')),
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_access ENABLE ROW LEVEL SECURITY;

-- Read policies for plans
CREATE POLICY "Anyone can view active plans"
    ON public.plans FOR SELECT
    USING (is_active = true);

-- Policies for subscriptions
CREATE POLICY "Users can view their business subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (
        SELECT user_id FROM public.business_access WHERE business_id = subscriptions.business_id
    ));

-- Policies for licenses and activations
CREATE POLICY "Users can view business licenses"
    ON public.licenses FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.business_access WHERE business_id = licenses.business_id
    ));

CREATE POLICY "Users can manage device activations for their business"
    ON public.license_activations FOR ALL
    USING (license_id IN (
        SELECT l.id FROM public.licenses l
        JOIN public.business_access ba ON ba.business_id = l.business_id
        WHERE ba.user_id = auth.uid()
    ));

-- Trigger for updated_at
CREATE TRIGGER update_plans_modtime BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_licenses_modtime BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_access_modtime BEFORE UPDATE ON public.business_access FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
