-- ==============================================================================
-- NEXACCOUNTING - PHASE 5: INVENTORY MANAGEMENT ENGINE MIGRATION
-- Multi-Tenant Inventory, Warehouses, Balances, Documents, Transactions & Stock Counts
-- ==============================================================================

-- 1. ADD ALLOW_NEGATIVE_STOCK COLUMN TO BUSINESSES
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS allow_negative_stock BOOLEAN DEFAULT FALSE;

-- 2. CREATE WAREHOUSES TABLE
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NULL,
    description TEXT NULL,
    address TEXT NULL,
    manager_name TEXT NULL,
    phone TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_business_warehouse_code UNIQUE (business_id, code)
);

-- 3. CREATE WAREHOUSE LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE INVENTORY BALANCES TABLE
CREATE TABLE IF NOT EXISTS public.inventory_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 0,
    reserved_quantity NUMERIC NOT NULL DEFAULT 0,
    available_quantity NUMERIC GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_warehouse_item_balance UNIQUE (warehouse_id, item_id)
);

-- 5. CREATE INVENTORY TRANSACTIONS TABLE (Source of Truth)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (
      transaction_type IN (
        'opening_balance',
        'stock_in',
        'stock_out',
        'adjustment_in',
        'adjustment_out',
        'transfer_in',
        'transfer_out',
        'stock_count_in',
        'stock_count_out'
      )
    ),
    quantity NUMERIC NOT NULL CHECK (quantity >= 0),
    unit_cost NUMERIC DEFAULT 0,
    reference_type TEXT NULL,
    reference_id UUID NULL,
    description TEXT NULL,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR INVENTORY TRANSACTIONS
CREATE INDEX IF NOT EXISTS idx_inv_tx_business_wh_item ON public.inventory_transactions(business_id, warehouse_id, item_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_date ON public.inventory_transactions(transaction_date);

-- 6. CREATE INVENTORY DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    document_number TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (
      document_type IN ('opening_balance', 'receipt', 'issue', 'transfer', 'adjustment', 'stock_count')
    ),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    target_warehouse_id UUID NULL REFERENCES public.warehouses(id),
    description TEXT NULL,
    document_date TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NULL REFERENCES auth.users(id),
    approved_by UUID NULL REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE INVENTORY DOCUMENT ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.inventory_documents(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC DEFAULT 0,
    description TEXT NULL
);

-- 8. CREATE STOCK COUNTS & STOCK COUNT ITEMS TABLES
CREATE TABLE IF NOT EXISTS public.stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    count_number TEXT NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'approved', 'cancelled')),
    count_date TIMESTAMPTZ DEFAULT NOW(),
    description TEXT NULL,
    created_by UUID NULL REFERENCES auth.users(id),
    approved_by UUID NULL REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id),
    system_quantity NUMERIC NOT NULL DEFAULT 0,
    counted_quantity NUMERIC NOT NULL DEFAULT 0,
    variance NUMERIC NOT NULL DEFAULT 0,
    unit_cost NUMERIC DEFAULT 0,
    notes TEXT NULL
);

-- ==============================================================================
-- DATABASE FUNCTIONS & STORED PROCEDURES (Atomic Engine)
-- ==============================================================================

-- Function to confirm inventory document
CREATE OR REPLACE FUNCTION public.confirm_inventory_document(
    p_document_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_doc RECORD;
    v_item RECORD;
    v_allow_neg BOOLEAN;
    v_current_stock NUMERIC;
    v_tx_type_in TEXT;
    v_tx_type_out TEXT;
BEGIN
    -- 1. Fetch document
    SELECT * INTO v_doc FROM public.inventory_documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'سند انبار یافت نشد.';
    END IF;

    IF v_doc.status <> 'draft' THEN
        RAISE EXCEPTION 'فقط اسناد با وضعیت پیش‌نویس قابل تأیید هستند.';
    END IF;

    -- 2. Fetch business negative stock setting
    SELECT COALESCE(allow_negative_stock, FALSE) INTO v_allow_neg
    FROM public.businesses WHERE id = v_doc.business_id;

    -- Determine transaction types
    IF v_doc.document_type = 'receipt' THEN
        v_tx_type_in := 'stock_in';
    ELSIF v_doc.document_type = 'issue' THEN
        v_tx_type_out := 'stock_out';
    ELSIF v_doc.document_type = 'opening_balance' THEN
        v_tx_type_in := 'opening_balance';
    ELSIF v_doc.document_type = 'transfer' THEN
        IF v_doc.target_warehouse_id IS NULL THEN
            RAISE EXCEPTION 'انبار مقصد برای سند انتقال تعیین نشده است.';
        END IF;
        v_tx_type_out := 'transfer_out';
        v_tx_type_in := 'transfer_in';
    ELSIF v_doc.document_type = 'adjustment' THEN
        v_tx_type_in := 'adjustment_in';
        v_tx_type_out := 'adjustment_out';
    END IF;

    -- Iterate over items
    FOR v_item IN
        SELECT di.*, i.item_type, i.track_inventory, i.name as item_name
        FROM public.inventory_document_items di
        JOIN public.items i ON i.id = di.item_id
        WHERE di.document_id = p_document_id
    LOOP
        -- Check service or track inventory
        IF v_item.item_type = 'service' THEN
            RAISE EXCEPTION 'کالای % از نوع خدمت است و نمی‌تواند موجودی انبار داشته باشد.', v_item.item_name;
        END IF;

        IF v_item.track_inventory = FALSE THEN
            RAISE EXCEPTION 'پیگیری موجودی برای کالای % غیرفعال است.', v_item.item_name;
        END IF;

        -- Validate negative stock if OUT
        IF v_tx_type_out IS NOT NULL AND v_allow_neg = FALSE THEN
            SELECT COALESCE(quantity, 0) INTO v_current_stock
            FROM public.inventory_balances
            WHERE warehouse_id = v_doc.warehouse_id AND item_id = v_item.item_id;

            IF v_current_stock < v_item.quantity THEN
                RAISE EXCEPTION 'موجودی کالای % در انبار کافی نیست (موجودی فعلی: %, درخواست: %).', v_item.item_name, v_current_stock, v_item.quantity;
            END IF;
        END IF;

        -- Create OUT Transaction if applicable
        IF v_tx_type_out IS NOT NULL THEN
            INSERT INTO public.inventory_transactions (
                business_id, warehouse_id, item_id, transaction_type,
                quantity, unit_cost, reference_type, reference_id,
                description, transaction_date, created_by
            ) VALUES (
                v_doc.business_id, v_doc.warehouse_id, v_item.item_id, v_tx_type_out,
                v_item.quantity, v_item.unit_cost, 'inventory_document', v_doc.id,
                v_doc.description, v_doc.document_date, p_user_id
            );

            -- Update Balance
            INSERT INTO public.inventory_balances (business_id, warehouse_id, item_id, quantity, updated_at)
            VALUES (v_doc.business_id, v_doc.warehouse_id, v_item.item_id, -v_item.quantity, NOW())
            ON CONFLICT (warehouse_id, item_id)
            DO UPDATE SET
                quantity = public.inventory_balances.quantity - EXCLUDED.quantity,
                updated_at = NOW();
        END IF;

        -- Create IN Transaction if applicable
        IF v_tx_type_in IS NOT NULL THEN
            DECLARE
                v_target_wh UUID := CASE WHEN v_doc.document_type = 'transfer' THEN v_doc.target_warehouse_id ELSE v_doc.warehouse_id END;
            BEGIN
                INSERT INTO public.inventory_transactions (
                    business_id, warehouse_id, item_id, transaction_type,
                    quantity, unit_cost, reference_type, reference_id,
                    description, transaction_date, created_by
                ) VALUES (
                    v_doc.business_id, v_target_wh, v_item.item_id, v_tx_type_in,
                    v_item.quantity, v_item.unit_cost, 'inventory_document', v_doc.id,
                    v_doc.description, v_doc.document_date, p_user_id
                );

                -- Update Balance
                INSERT INTO public.inventory_balances (business_id, warehouse_id, item_id, quantity, updated_at)
                VALUES (v_doc.business_id, v_target_wh, v_item.item_id, v_item.quantity, NOW())
                ON CONFLICT (warehouse_id, item_id)
                DO UPDATE SET
                    quantity = public.inventory_balances.quantity + EXCLUDED.quantity,
                    updated_at = NOW();
            END;
        END IF;

    END LOOP;

    -- Update Document Status
    UPDATE public.inventory_documents
    SET status = 'confirmed', approved_by = p_user_id, approved_at = NOW()
    WHERE id = p_document_id;

    RETURN jsonb_build_object('success', true, 'message', 'سند انبار با موفقیت تأیید شد.');
END;
$$;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_count_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "warehouses_business_isolation" ON public.warehouses
    FOR ALL USING (
      business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid() AND is_active = true
      )
    );

CREATE POLICY "inventory_balances_business_isolation" ON public.inventory_balances
    FOR ALL USING (
      business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid() AND is_active = true
      )
    );

CREATE POLICY "inventory_transactions_business_isolation" ON public.inventory_transactions
    FOR ALL USING (
      business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid() AND is_active = true
      )
    );

CREATE POLICY "inventory_documents_business_isolation" ON public.inventory_documents
    FOR ALL USING (
      business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid() AND is_active = true
      )
    );

CREATE POLICY "stock_counts_business_isolation" ON public.stock_counts
    FOR ALL USING (
      business_id IN (
        SELECT business_id FROM public.business_members WHERE user_id = auth.uid() AND is_active = true
      )
    );
