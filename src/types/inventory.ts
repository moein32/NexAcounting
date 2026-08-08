export type TransactionType =
  | 'opening_balance'
  | 'stock_in'
  | 'stock_out'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'transfer_in'
  | 'transfer_out'
  | 'stock_count_in'
  | 'stock_count_out';

export type InventoryDocumentType =
  | 'opening_balance'
  | 'receipt'
  | 'issue'
  | 'transfer'
  | 'adjustment'
  | 'stock_count';

export type InventoryDocumentStatus = 'draft' | 'confirmed' | 'cancelled';

export interface Warehouse {
  id: string;
  business_id: string;
  name: string;
  code: string | null;
  description: string | null;
  address: string | null;
  manager_name: string | null;
  phone: string | null;
  is_active: boolean;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
  // Derived fields
  item_count?: number;
  locations_count?: number;
  total_quantity?: number;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InventoryBalance {
  id: string;
  business_id: string;
  warehouse_id: string;
  item_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  updated_at: string;
  // Joined/Derived
  warehouse_name?: string;
  item_name?: string;
  item_code?: string;
  item_sku?: string;
  item_type?: 'product' | 'service';
  unit_name?: string;
  unit_cost?: number;
  min_stock?: number;
}

export interface InventoryTransaction {
  id: string;
  business_id: string;
  warehouse_id: string;
  item_id: string;
  transaction_type: TransactionType;
  quantity: number;
  unit_cost: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  transaction_date: string;
  created_by: string | null;
  created_at: string;
  // Joined
  warehouse_name?: string;
  item_name?: string;
  item_code?: string;
  unit_name?: string;
  created_by_name?: string;
}

export interface InventoryDocument {
  id: string;
  business_id: string;
  document_number: string;
  document_type: InventoryDocumentType;
  status: InventoryDocumentStatus;
  warehouse_id: string;
  target_warehouse_id?: string | null;
  description: string | null;
  document_date: string;
  created_by: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  // Joined
  warehouse_name?: string;
  target_warehouse_name?: string;
  created_by_name?: string;
  items_count?: number;
  items?: InventoryDocumentItem[];
}

export interface InventoryDocumentItem {
  id: string;
  document_id: string;
  item_id: string;
  quantity: number;
  unit_cost: number;
  description: string | null;
  // Joined
  item_name?: string;
  item_code?: string;
  item_sku?: string;
  unit_name?: string;
}

export interface StockCount {
  id: string;
  business_id: string;
  count_number: string;
  warehouse_id: string;
  title: string;
  status: 'draft' | 'in_progress' | 'approved' | 'cancelled';
  count_date: string;
  description?: string | null;
  created_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  // Joined
  warehouse_name?: string;
  items_count?: number;
  has_variance?: boolean;
  items?: StockCountItem[];
}

export interface StockCountItem {
  id: string;
  stock_count_id: string;
  item_id: string;
  system_quantity: number;
  counted_quantity: number;
  variance: number;
  unit_cost: number;
  notes?: string | null;
  // Joined
  item_name?: string;
  item_code?: string;
  unit_name?: string;
}

export interface InventoryFilters {
  warehouse_id?: string | 'all';
  search?: string;
  document_type?: InventoryDocumentType | 'all';
  status?: InventoryDocumentStatus | 'all';
  transaction_type?: TransactionType | 'all';
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
}
