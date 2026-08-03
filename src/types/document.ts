export type DocumentType =
  | 'sales_quote'
  | 'sales_order'
  | 'sales_invoice'
  | 'sales_return'
  | 'purchase_order'
  | 'purchase_invoice'
  | 'purchase_return';

export type DocumentStatus = 'draft' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'not_applicable';

export interface DocumentItem {
  id: string;
  document_id: string;
  item_id: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  line_subtotal: number;
  line_total: number;
  unit_id?: string | null;
  warehouse_id?: string | null;
  created_at?: string;

  // Joined fields for display
  item_name?: string;
  item_code?: string;
  unit_name?: string;
}

export interface Document {
  id: string;
  business_id: string;
  document_type: DocumentType;
  document_number: string;
  party_id?: string | null;
  warehouse_id?: string | null;
  reference_document_id?: string | null;
  document_date: string;
  due_date?: string | null;
  status: DocumentStatus;
  payment_status: PaymentStatus;
  currency: string;
  notes?: string | null;
  internal_notes?: string | null;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  created_by?: string | null;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;

  // Joined/Relational fields
  items?: DocumentItem[];
  party_name?: string;
  party_display_name?: string;
  warehouse_name?: string;
  reference_document_number?: string;
  creator_name?: string;
}

export interface DocumentEvent {
  id: string;
  business_id: string;
  document_id: string;
  event_type: string;
  description: string;
  metadata?: any | null;
  created_by?: string | null;
  created_at: string;
  user_name?: string;
}

export interface DocumentNumberSequence {
  id: string;
  business_id: string;
  document_type: DocumentType;
  prefix: string;
  next_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDocumentInput {
  document_type: DocumentType;
  party_id?: string | null;
  warehouse_id?: string | null;
  reference_document_id?: string | null;
  document_date?: string;
  due_date?: string | null;
  currency?: string;
  notes?: string | null;
  internal_notes?: string | null;
  shipping_total?: number;
  items: {
    item_id: string;
    description?: string | null;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    tax_percent?: number;
    unit_id?: string | null;
    warehouse_id?: string | null;
  }[];
}

export interface UpdateDocumentInput {
  party_id?: string | null;
  warehouse_id?: string | null;
  document_date?: string;
  due_date?: string | null;
  currency?: string;
  notes?: string | null;
  internal_notes?: string | null;
  shipping_total?: number;
  items?: {
    item_id: string;
    description?: string | null;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    tax_percent?: number;
    unit_id?: string | null;
    warehouse_id?: string | null;
  }[];
}
