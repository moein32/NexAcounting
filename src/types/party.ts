export type PartyType = 'individual' | 'company' | 'organization' | 'other';
export type PartyRoleType = 'customer' | 'supplier' | 'employee' | 'other';
export type OpeningBalanceType = 'debit' | 'credit';

export interface PartyRole {
  id?: string;
  party_id?: string;
  role: PartyRoleType;
  created_at?: string;
}

export interface PartyContact {
  id?: string;
  party_id?: string;
  name: string;
  position?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  is_primary?: boolean;
  created_at?: string;
}

export interface PartyAddress {
  id?: string;
  party_id?: string;
  title?: string | null;
  address: string;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string;
  is_primary?: boolean;
  created_at?: string;
}

export interface PartyFinancialProfile {
  id?: string;
  party_id?: string;
  credit_limit: number;
  opening_balance: number;
  opening_balance_type: OpeningBalanceType;
  payment_terms_days: number;
  default_discount_percent: number;
  tax_exempt: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Party {
  id: string;
  business_id: string;
  party_type: PartyType;
  display_name: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  national_id?: string | null;
  economic_code?: string | null;
  registration_number?: string | null;
  postal_code?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string;
  is_active: boolean;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joined/Calculated relations
  roles: PartyRoleType[];
  contacts?: PartyContact[];
  addresses?: PartyAddress[];
  financial_profile?: PartyFinancialProfile | null;
  calculated_balance?: number; // Current ledger balance (positive = بدهکار, negative = بستانکار)
}

export interface CreatePartyInput {
  business_id: string;
  party_type: PartyType;
  roles: PartyRoleType[];
  display_name: string;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  national_id?: string | null;
  economic_code?: string | null;
  registration_number?: string | null;
  postal_code?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string;
  notes?: string | null;

  // Embedded optional lists/profile
  contacts?: PartyContact[];
  addresses?: PartyAddress[];
  financial_profile?: PartyFinancialProfile;
}

export interface UpdatePartyInput extends Partial<CreatePartyInput> {
  id: string;
  is_active?: boolean;
}

export interface PartyLedgerEntry {
  id: string;
  party_id: string;
  date: string;
  reference_type:
    | 'sales_invoice'
    | 'sales_return'
    | 'purchase_invoice'
    | 'purchase_return'
    | 'receipt'
    | 'payment'
    | 'check'
    | 'journal_entry'
    | 'opening_balance';
  reference_id: string;
  reference_number: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface PartyFilters {
  search?: string;
  role?: PartyRoleType | 'all';
  type?: PartyType | 'all';
  status?: 'all' | 'active' | 'inactive';
  province?: string;
  city?: string;
  sortBy?: 'display_name' | 'created_at' | 'calculated_balance' | 'company_name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateField?: 'mobile' | 'phone' | 'national_id' | 'economic_code';
  existingParty?: Party;
}
