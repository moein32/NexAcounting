-- ==============================================================================
-- NEXACCOUNTING - PHASE 6: CENTRAL DOCUMENT ENGINE MIGRATION
-- Centralized Sales & Purchases Documents, Items, Sequences, and Lifecycle Events
-- ==============================================================================

-- 1. CREATE CENTRAL DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (
        document_type IN (
            'sales_quote',
            'sales_order',
            'sales_invoice',
            'sales_return',
            'purchase_order',
            'purchase_invoice',
            'purchase_return'
        )
    ),
    document_number TEXT NOT NULL,
    party_id UUID NULL REFERENCES public.parties(id) ON DELETE SET NULL,
    warehouse_id UUID NULL REFERENCES public.warehouses(id) ON DELETE SET NULL,
    reference_document_id UUID NULL REFERENCES public.documents(id) ON DELETE SET NULL,
    document_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled', 'completed')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'not_applicable')),
    currency TEXT NOT NULL DEFAULT 'تومان',
    notes TEXT NULL,
    internal_notes TEXT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_total NUMERIC NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    tax_total NUMERIC NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    shipping_total NUMERIC NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
    grand_total NUMERIC NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ NULL,
    cancelled_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_business_document_type_number UNIQUE (business_id, document_type, document_number)
);

-- Indexes for document performance
CREATE INDEX IF NOT EXISTS idx_documents_business_id ON public.documents(business_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_status ON public.documents(business_id, document_type, status);
CREATE INDEX IF NOT EXISTS idx_documents_party_id ON public.documents(party_id);
CREATE INDEX IF NOT EXISTS idx_documents_date ON public.documents(document_date);

-- 2. CREATE DOCUMENT ITEMS TABLE (Lines)
CREATE TABLE IF NOT EXISTS public.document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
    description TEXT NULL,
    quantity NUMERIC NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    discount_percent NUMERIC NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_percent NUMERIC NOT NULL DEFAULT 0 CHECK (tax_percent >= 0 AND tax_percent <= 100),
    tax_amount NUMERIC NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    line_subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (line_subtotal >= 0),
    line_total NUMERIC NOT NULL DEFAULT 0 CHECK (line_total >= 0),
    unit_id UUID NULL REFERENCES public.units(id) ON DELETE SET NULL,
    warehouse_id UUID NULL REFERENCES public.warehouses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for items
CREATE INDEX IF NOT EXISTS idx_doc_items_document_id ON public.document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_items_item_id ON public.document_items(item_id);

-- 3. CREATE DOCUMENT EVENTS TABLE (Audit Trail / History)
CREATE TABLE IF NOT EXISTS public.document_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB NULL,
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_events_doc_id ON public.document_events(document_id);

-- 4. CREATE DOCUMENT NUMBER SEQUENCE TABLE (Atomic numbering per Business & Type)
CREATE TABLE IF NOT EXISTS public.document_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (
        document_type IN (
            'sales_quote',
            'sales_order',
            'sales_invoice',
            'sales_return',
            'purchase_order',
            'purchase_invoice',
            'purchase_return'
        )
    ),
    prefix TEXT NOT NULL,
    next_value INT NOT NULL DEFAULT 1 CHECK (next_value > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_business_type_sequence UNIQUE (business_id, document_type)
);

-- 5. TRIGGER FOR UPDATED_AT
DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_number_sequences ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR DOCUMENTS
DROP POLICY IF EXISTS "Members can view business documents" ON public.documents;
CREATE POLICY "Members can view business documents" ON public.documents
    FOR SELECT USING (public.is_business_member(business_id));

DROP POLICY IF EXISTS "Members can insert business documents" ON public.documents;
CREATE POLICY "Members can insert business documents" ON public.documents
    FOR INSERT WITH CHECK (
        public.is_business_member(business_id) AND (
            (document_type LIKE 'sales_%' AND public.has_permission(business_id, 'sales.create')) OR
            (document_type LIKE 'purchase_%' AND public.has_permission(business_id, 'purchases.create'))
        )
    );

DROP POLICY IF EXISTS "Members can update business documents" ON public.documents;
CREATE POLICY "Members can update business documents" ON public.documents
    FOR UPDATE USING (
        public.is_business_member(business_id) AND (
            (document_type LIKE 'sales_%' AND public.has_permission(business_id, 'sales.update')) OR
            (document_type LIKE 'purchase_%' AND public.has_permission(business_id, 'purchases.update'))
        )
    );

DROP POLICY IF EXISTS "Members can delete business documents" ON public.documents;
CREATE POLICY "Members can delete business documents" ON public.documents
    FOR DELETE USING (
        public.is_business_member(business_id) AND (
            (document_type LIKE 'sales_%' AND public.has_permission(business_id, 'sales.delete')) OR
            (document_type LIKE 'purchase_%' AND public.has_permission(business_id, 'purchases.delete'))
        )
    );

-- 8. RLS POLICIES FOR DOCUMENT ITEMS
DROP POLICY IF EXISTS "Members can view document items" ON public.document_items;
CREATE POLICY "Members can view document items" ON public.document_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_id AND public.is_business_member(d.business_id)
        )
    );

DROP POLICY IF EXISTS "Members can insert document items" ON public.document_items;
CREATE POLICY "Members can insert document items" ON public.document_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_id 
              AND public.is_business_member(d.business_id)
              AND (
                  (d.document_type LIKE 'sales_%' AND public.has_permission(d.business_id, 'sales.create')) OR
                  (d.document_type LIKE 'purchase_%' AND public.has_permission(d.business_id, 'purchases.create'))
              )
        )
    );

DROP POLICY IF EXISTS "Members can update document items" ON public.document_items;
CREATE POLICY "Members can update document items" ON public.document_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_id 
              AND public.is_business_member(d.business_id)
              AND (
                  (d.document_type LIKE 'sales_%' AND public.has_permission(d.business_id, 'sales.update')) OR
                  (d.document_type LIKE 'purchase_%' AND public.has_permission(d.business_id, 'purchases.update'))
              )
        )
    );

DROP POLICY IF EXISTS "Members can delete document items" ON public.document_items;
CREATE POLICY "Members can delete document items" ON public.document_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_id 
              AND public.is_business_member(d.business_id)
              AND (
                  (d.document_type LIKE 'sales_%' AND public.has_permission(d.business_id, 'sales.delete')) OR
                  (d.document_type LIKE 'purchase_%' AND public.has_permission(d.business_id, 'purchases.delete'))
              )
        )
    );

-- 9. RLS POLICIES FOR DOCUMENT EVENTS
DROP POLICY IF EXISTS "Members can view document events" ON public.document_events;
CREATE POLICY "Members can view document events" ON public.document_events
    FOR SELECT USING (public.is_business_member(business_id));

-- 10. RLS POLICIES FOR SEQUENCES
DROP POLICY IF EXISTS "Members can view sequences" ON public.document_number_sequences;
CREATE POLICY "Members can view sequences" ON public.document_number_sequences
    FOR SELECT USING (public.is_business_member(business_id));

-- 11. HELPER DB FUNCTION TO GENERATE NEXT NUMBER ATOMICALLY
CREATE OR REPLACE FUNCTION public.get_next_document_number(b_id UUID, doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    seq_prefix TEXT;
    seq_val INT;
    result_num TEXT;
BEGIN
    -- Determine default prefix if sequence doesn't exist
    seq_prefix := CASE 
        WHEN doc_type = 'sales_quote' THEN 'SQ'
        WHEN doc_type = 'sales_order' THEN 'SO'
        WHEN doc_type = 'sales_invoice' THEN 'SI'
        WHEN doc_type = 'sales_return' THEN 'SR'
        WHEN doc_type = 'purchase_order' THEN 'PO'
        WHEN doc_type = 'purchase_invoice' THEN 'PI'
        WHEN doc_type = 'purchase_return' THEN 'PR'
        ELSE 'DOC'
    END;

    -- Upsert and lock sequence row
    INSERT INTO public.document_number_sequences (business_id, document_type, prefix, next_value)
    VALUES (b_id, doc_type, seq_prefix, 1)
    ON CONFLICT (business_id, document_type) 
    DO UPDATE SET next_value = document_number_sequences.next_value
    RETURNING prefix, next_value INTO seq_prefix, seq_val;

    -- Increment for next call
    UPDATE public.document_number_sequences 
    SET next_value = next_value + 1, updated_at = NOW()
    WHERE business_id = b_id AND document_type = doc_type;

    -- Build formatted number (e.g., SI-10001)
    result_num := seq_prefix || '-' || (seq_val + 10000)::TEXT;
    
    RETURN result_num;
END;
$$;
