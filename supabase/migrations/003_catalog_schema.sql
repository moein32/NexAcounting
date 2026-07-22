-- NexAccounting Phase 4 Database Schema Migration
-- Catalog & Item Management System (Items, Categories, Units, Price Lists, Item Prices & Attributes)

-- 1. ITEM CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.item_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    parent_id UUID NULL REFERENCES public.item_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. UNITS TABLE
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT,
    unit_type TEXT NOT NULL CHECK (unit_type IN ('count', 'weight', 'length', 'area', 'volume', 'time', 'service', 'other')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
    name TEXT NOT NULL,
    code TEXT,
    sku TEXT,
    barcode TEXT,
    category_id UUID REFERENCES public.item_categories(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    description TEXT,
    short_description TEXT,
    brand TEXT,
    model TEXT,
    purchase_price NUMERIC DEFAULT 0,
    default_sale_price NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    default_discount_percent NUMERIC DEFAULT 0,
    min_stock NUMERIC DEFAULT 0,
    max_stock NUMERIC,
    track_inventory BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_service_no_inventory CHECK (item_type != 'service' OR track_inventory = FALSE),
    CONSTRAINT unique_business_sku UNIQUE (business_id, sku),
    CONSTRAINT unique_business_barcode UNIQUE (business_id, barcode)
);

-- 4. PRICE LISTS TABLE
CREATE TABLE IF NOT EXISTS public.price_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ITEM PRICES TABLE
CREATE TABLE IF NOT EXISTS public.item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL DEFAULT 0,
    min_quantity NUMERIC DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_item_price_tier UNIQUE(item_id, price_list_id, min_quantity)
);

-- 6. ITEM ATTRIBUTES TABLE
CREATE TABLE IF NOT EXISTS public.item_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_items_business_id ON public.items(business_id);
CREATE INDEX IF NOT EXISTS idx_items_item_type ON public.items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);
CREATE INDEX IF NOT EXISTS idx_items_code ON public.items(code);
CREATE INDEX IF NOT EXISTS idx_items_sku ON public.items(sku);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON public.items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_business_id ON public.item_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_units_business_id ON public.units(business_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_business_id ON public.price_lists(business_id);
CREATE INDEX IF NOT EXISTS idx_item_prices_item_id ON public.item_prices(item_id);
CREATE INDEX IF NOT EXISTS idx_item_attributes_item_id ON public.item_attributes(item_id);

-- TRIGGERS FOR UPDATED_AT
DROP TRIGGER IF EXISTS set_item_categories_updated_at ON public.item_categories;
CREATE TRIGGER set_item_categories_updated_at
    BEFORE UPDATE ON public.item_categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_items_updated_at ON public.items;
CREATE TRIGGER set_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_item_prices_updated_at ON public.item_prices;
CREATE TRIGGER set_item_prices_updated_at
    BEFORE UPDATE ON public.item_prices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PERMISSIONS
INSERT INTO public.permissions (key, name, description) VALUES
    ('items.view', 'مشاهده کالاها و خدمات', 'امکان مشاهده لیست کالاها و خدمات'),
    ('items.create', 'ایجاد کالا و خدمت', 'امکان تعریف کالا یا خدمت جدید'),
    ('items.update', 'ویرایش کالا و خدمت', 'امکان تغییر مشخصات کالاها و خدمات'),
    ('items.delete', 'حذف کالا و خدمت', 'امکان غیرفعال‌سازی یا حذف کالا'),
    ('items.export', 'خروجی اکسل کالاها', 'امکان گرفتن خروجی از لیست کالاها'),
    ('items.import', 'ورود اکسل کالاها', 'امکان وارد کردن کالاها به صورت گروهی'),
    ('categories.view', 'مشاهده دسته‌بندی‌ها', 'امکان مشاهده لیست دسته‌بندی‌ها'),
    ('categories.create', 'ایجاد دسته‌بندی', 'امکان ساخت دسته‌بندی جدید'),
    ('categories.update', 'ویرایش دسته‌بندی', 'امکان ویرایش دسته‌بندی‌ها'),
    ('categories.delete', 'حذف دسته‌بندی', 'امکان حذف یا غیرفعال‌سازی دسته‌بندی'),
    ('price_lists.view', 'مشاهده لیست‌های قیمت', 'امکان مشاهده انواع لیست قیمت'),
    ('price_lists.create', 'ایجاد لیست قیمت', 'امکان تعریف لیست قیمت جدید'),
    ('price_lists.update', 'ویرایش لیست قیمت', 'امکان تغییر قیمت‌ها و لیست قیمت'),
    ('price_lists.delete', 'حذف لیست قیمت', 'امکان حذف لیست قیمت'),
    ('units.view', 'مشاهده واحدهای سنجش', 'امکان مشاهده لیست واحدهای اندازه‌گیری'),
    ('units.create', 'ایجاد واحد سنجش', 'امکان تعریف واحد جدید'),
    ('units.update', 'ویرایش واحد سنجش', 'امکان ویرایش واحدها'),
    ('units.delete', 'حذف واحد سنجش', 'امکان حذف واحد اندازه‌گیری')
ON CONFLICT (key) DO NOTHING;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_attributes ENABLE ROW LEVEL SECURITY;

-- Helper function to check item access
CREATE OR REPLACE FUNCTION public.can_access_item(p_item_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.items i
    WHERE i.id = p_item_id
      AND public.is_business_member(i.business_id)
  );
$$;

-- RLS POLICIES: ITEM CATEGORIES
DROP POLICY IF EXISTS "Business members can view item categories" ON public.item_categories;
CREATE POLICY "Business members can view item categories" ON public.item_categories
    FOR SELECT USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Business members with perm can create item categories" ON public.item_categories;
CREATE POLICY "Business members with perm can create item categories" ON public.item_categories
    FOR INSERT WITH CHECK (public.has_permission(business_id, 'categories.create'));

DROP POLICY IF EXISTS "Business members with perm can update item categories" ON public.item_categories;
CREATE POLICY "Business members with perm can update item categories" ON public.item_categories
    FOR UPDATE USING (public.has_permission(business_id, 'categories.update'));

DROP POLICY IF EXISTS "Business members with perm can delete item categories" ON public.item_categories;
CREATE POLICY "Business members with perm can delete item categories" ON public.item_categories
    FOR DELETE USING (public.has_permission(business_id, 'categories.delete'));

-- RLS POLICIES: UNITS
DROP POLICY IF EXISTS "Business members can view units" ON public.units;
CREATE POLICY "Business members can view units" ON public.units
    FOR SELECT USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Business members with perm can create units" ON public.units;
CREATE POLICY "Business members with perm can create units" ON public.units
    FOR INSERT WITH CHECK (public.has_permission(business_id, 'units.create'));

DROP POLICY IF EXISTS "Business members with perm can update units" ON public.units;
CREATE POLICY "Business members with perm can update units" ON public.units
    FOR UPDATE USING (public.has_permission(business_id, 'units.update'));

DROP POLICY IF EXISTS "Business members with perm can delete units" ON public.units;
CREATE POLICY "Business members with perm can delete units" ON public.units
    FOR DELETE USING (public.has_permission(business_id, 'units.delete'));

-- RLS POLICIES: ITEMS
DROP POLICY IF EXISTS "Business members can view items" ON public.items;
CREATE POLICY "Business members can view items" ON public.items
    FOR SELECT USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Business members with perm can create items" ON public.items;
CREATE POLICY "Business members with perm can create items" ON public.items
    FOR INSERT WITH CHECK (public.has_permission(business_id, 'items.create'));

DROP POLICY IF EXISTS "Business members with perm can update items" ON public.items;
CREATE POLICY "Business members with perm can update items" ON public.items
    FOR UPDATE USING (public.has_permission(business_id, 'items.update'));

DROP POLICY IF EXISTS "Business members with perm can delete items" ON public.items;
CREATE POLICY "Business members with perm can delete items" ON public.items
    FOR DELETE USING (public.has_permission(business_id, 'items.delete'));

-- RLS POLICIES: PRICE LISTS
DROP POLICY IF EXISTS "Business members can view price lists" ON public.price_lists;
CREATE POLICY "Business members can view price lists" ON public.price_lists
    FOR SELECT USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Business members with perm can create price lists" ON public.price_lists;
CREATE POLICY "Business members with perm can create price lists" ON public.price_lists
    FOR INSERT WITH CHECK (public.has_permission(business_id, 'price_lists.create'));

DROP POLICY IF EXISTS "Business members with perm can update price lists" ON public.price_lists;
CREATE POLICY "Business members with perm can update price lists" ON public.price_lists
    FOR UPDATE USING (public.has_permission(business_id, 'price_lists.update'));

DROP POLICY IF EXISTS "Business members with perm can delete price lists" ON public.price_lists;
CREATE POLICY "Business members can delete price lists" ON public.price_lists
    FOR DELETE USING (public.has_permission(business_id, 'price_lists.delete'));

-- RLS POLICIES: ITEM PRICES
DROP POLICY IF EXISTS "Business members can view item prices" ON public.item_prices;
CREATE POLICY "Business members can view item prices" ON public.item_prices
    FOR SELECT USING (public.can_access_item(item_id));

DROP POLICY IF EXISTS "Business members can insert item prices" ON public.item_prices;
CREATE POLICY "Business members can insert item prices" ON public.item_prices
    FOR INSERT WITH CHECK (public.can_access_item(item_id));

DROP POLICY IF EXISTS "Business members can update item prices" ON public.item_prices;
CREATE POLICY "Business members can update item prices" ON public.item_prices
    FOR UPDATE USING (public.can_access_item(item_id));

DROP POLICY IF EXISTS "Business members can delete item prices" ON public.item_prices;
CREATE POLICY "Business members can delete item prices" ON public.item_prices
    FOR DELETE USING (public.can_access_item(item_id));

-- RLS POLICIES: ITEM ATTRIBUTES
DROP POLICY IF EXISTS "Business members can view item attributes" ON public.item_attributes;
CREATE POLICY "Business members can view item attributes" ON public.item_attributes
    FOR SELECT USING (public.can_access_item(item_id));

DROP POLICY IF EXISTS "Business members can insert item attributes" ON public.item_attributes;
CREATE POLICY "Business members can insert item attributes" ON public.item_attributes
    FOR INSERT WITH CHECK (public.can_access_item(item_id));

DROP POLICY IF EXISTS "Business members can update item attributes" ON public.item_attributes;
CREATE POLICY "Business members can update item attributes" ON public.item_attributes
    FOR UPDATE USING (public.can_access_item(item_id));

DROP POLICY IF EXISTS "Business members can delete item attributes" ON public.item_attributes;
CREATE POLICY "Business members can delete item attributes" ON public.item_attributes
    FOR DELETE USING (public.can_access_item(item_id));
