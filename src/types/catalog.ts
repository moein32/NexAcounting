export type ItemType = 'product' | 'service';

export type UnitType =
  | 'count'
  | 'weight'
  | 'length'
  | 'area'
  | 'volume'
  | 'time'
  | 'service'
  | 'other';

export interface ItemCategory {
  id: string;
  business_id: string;
  parent_id?: string | null;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Derived fields
  children?: ItemCategory[];
  parent_name?: string | null;
  item_count?: number;
}

export interface Unit {
  id: string;
  business_id: string;
  name: string;
  symbol?: string | null;
  unit_type: UnitType;
  is_active: boolean;
  created_at: string;
}

export interface PriceList {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  item_count?: number;
}

export interface ItemPrice {
  id: string;
  item_id: string;
  price_list_id: string;
  price: number;
  min_quantity: number;
  created_at?: string;
  updated_at?: string;
  price_list_name?: string;
}

export interface ItemAttribute {
  id: string;
  item_id: string;
  attribute_name: string;
  attribute_value: string;
  created_at?: string;
}

export interface Item {
  id: string;
  business_id: string;
  item_type: ItemType;
  name: string;
  code?: string | null;
  sku?: string | null;
  barcode?: string | null;
  category_id?: string | null;
  unit_id?: string | null;
  description?: string | null;
  short_description?: string | null;
  brand?: string | null;
  model?: string | null;
  purchase_price: number;
  default_sale_price: number;
  tax_rate: number;
  default_discount_percent: number;
  min_stock: number;
  max_stock?: number | null;
  track_inventory: boolean;
  is_active: boolean;
  image_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined/Relational fields
  category?: ItemCategory | null;
  unit?: Unit | null;
  prices?: ItemPrice[];
  attributes?: ItemAttribute[];
}

export interface ItemFilters {
  search?: string;
  item_type?: ItemType | 'all';
  category_id?: string | 'all';
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ItemDuplicateCheckResult {
  hasDuplicateSku: boolean;
  hasDuplicateBarcode: boolean;
  hasDuplicateCode: boolean;
  duplicateItemNames: {
    sku?: string;
    barcode?: string;
    code?: string;
  };
}
