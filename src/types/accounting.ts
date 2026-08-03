export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id: string;
  business_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  account_type: AccountType;
  level: number; // 1: Kol (کل), 2: Moeen (معین), 3: Tafsili (تفصیلی)
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AccountingPeriod {
  id: string;
  business_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export type JournalReferenceType = 'sales_invoice' | 'purchase_invoice' | 'receipt' | 'payment' | 'inventory' | 'manual';

export interface JournalEntry {
  id: string;
  business_id: string;
  entry_number: number;
  date: string;
  description: string;
  reference_type: JournalReferenceType;
  reference_id: string | null;
  status: 'draft' | 'posted' | 'reversed';
  created_at?: string;
  updated_at?: string;
}

export interface JournalLine {
  id: string;
  journal_id: string;
  account_id: string;
  party_id: string | null; // Optional links to customer/supplier
  debit: number;
  credit: number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerQueryRow {
  date: string;
  entry_number: number;
  journal_id: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  account_name: string;
  account_code: string;
}

export interface TrialBalanceRow {
  account_id: string;
  code: string;
  name: string;
  account_type: AccountType;
  level: number;
  debitSum: number;
  creditSum: number;
  debitBalance: number;
  creditBalance: number;
}
