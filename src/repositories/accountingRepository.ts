import { db } from '../lib/sqlite';
import { 
  Account, 
  AccountingPeriod, 
  JournalEntry, 
  JournalLine, 
  LedgerQueryRow, 
  TrialBalanceRow,
  AccountType
} from '../types/accounting';

const DEFAULT_ACCOUNTS_TEMPLATE = [
  // Level 1: Kol (کل)
  { code: '10', name: 'دارایی‌های جاری', account_type: 'asset' as AccountType, level: 1, parent_code: null },
  { code: '20', name: 'بدهی‌های جاری', account_type: 'liability' as AccountType, level: 1, parent_code: null },
  { code: '30', name: 'حقوق صاحبان سهام', account_type: 'equity' as AccountType, level: 1, parent_code: null },
  { code: '40', name: 'درآمدها', account_type: 'revenue' as AccountType, level: 1, parent_code: null },
  { code: '50', name: 'هزینه‌ها', account_type: 'expense' as AccountType, level: 1, parent_code: null },

  // Level 2: Moeen (معین) - Assets
  { code: '1010', name: 'صندوق و بانک', account_type: 'asset' as AccountType, level: 2, parent_code: '10' },
  { code: '1020', name: 'حساب‌های دریافتنی (مشتریان)', account_type: 'asset' as AccountType, level: 2, parent_code: '10' },
  { code: '1030', name: 'موجودی کالا', account_type: 'asset' as AccountType, level: 2, parent_code: '10' },
  { code: '1040', name: 'اسناد دریافتنی (چک‌های دریافتی)', account_type: 'asset' as AccountType, level: 2, parent_code: '10' },

  // Level 2: Moeen (معین) - Liabilities
  { code: '2010', name: 'حساب‌های پرداختنی (تامین‌کنندگان)', account_type: 'liability' as AccountType, level: 2, parent_code: '20' },
  { code: '2020', name: 'اسناد پرداختنی (چک‌های صادره)', account_type: 'liability' as AccountType, level: 2, parent_code: '20' },

  // Level 2: Moeen (معین) - Equity
  { code: '3010', name: 'سرمایه اولیه', account_type: 'equity' as AccountType, level: 2, parent_code: '30' },

  // Level 2: Moeen (معین) - Revenue
  { code: '4010', name: 'درآمد فروش کالا و خدمات', account_type: 'revenue' as AccountType, level: 2, parent_code: '40' },

  // Level 2: Moeen (معین) - Expense
  { code: '5010', name: 'بهای تمام‌شده کالای فروش‌رفته (COGS)', account_type: 'expense' as AccountType, level: 2, parent_code: '50' },
  { code: '5020', name: 'هزینه اجاره', account_type: 'expense' as AccountType, level: 2, parent_code: '50' },
  { code: '5030', name: 'هزینه حمل و نقل', account_type: 'expense' as AccountType, level: 2, parent_code: '50' },
  { code: '5040', name: 'هزینه‌های جاری (عمومی و اداری)', account_type: 'expense' as AccountType, level: 2, parent_code: '50' },
];

export const AccountRepository = {
  getAccounts(businessId: string): Account[] {
    let accounts = db.queryByBusiness<Account>('accounts', businessId);
    
    // Seed default chart of accounts if none exist for this business
    if (accounts.length === 0) {
      db.beginTransaction();
      try {
        const codeToIdMap = new Map<string, string>();
        
        // 1. Seed level 1 accounts first
        const level1Templates = DEFAULT_ACCOUNTS_TEMPLATE.filter(a => a.level === 1);
        level1Templates.forEach(t => {
          const inserted = db.insertRecord<Account>('accounts', {
            business_id: businessId,
            parent_id: null,
            code: t.code,
            name: t.name,
            account_type: t.account_type,
            level: 1,
            is_active: true,
          });
          codeToIdMap.set(t.code, inserted.id);
        });

        // 2. Seed level 2 accounts connected to parent
        const level2Templates = DEFAULT_ACCOUNTS_TEMPLATE.filter(a => a.level === 2);
        level2Templates.forEach(t => {
          const parentId = t.parent_code ? codeToIdMap.get(t.parent_code) || null : null;
          const inserted = db.insertRecord<Account>('accounts', {
            business_id: businessId,
            parent_id: parentId,
            code: t.code,
            name: t.name,
            account_type: t.account_type,
            level: 2,
            is_active: true,
          });
          codeToIdMap.set(t.code, inserted.id);
        });

        db.commit();
        accounts = db.queryByBusiness<Account>('accounts', businessId);
      } catch (e) {
        db.rollback();
        console.error('Failed to seed default Chart of Accounts:', e);
      }
    }
    
    return accounts;
  },

  getAccountById(accountId: string): Account | null {
    return db.queryById<Account>('accounts', accountId);
  },

  getAccountByCode(businessId: string, code: string): Account | null {
    const accounts = this.getAccounts(businessId);
    return accounts.find(a => a.code === code) || null;
  },

  createAccount(account: Omit<Account, 'id'>): Account {
    return db.insertRecord<Account>('accounts', account);
  },

  updateAccount(id: string, account: Partial<Account>): Account {
    return db.updateRecord<Account>('accounts', id, account);
  },

  deleteAccount(id: string): boolean {
    return db.deleteRecord('accounts', id);
  }
};

export const JournalRepository = {
  getEntries(businessId: string): JournalEntry[] {
    return db.queryByBusiness<JournalEntry>('journal_entries', businessId)
      .sort((a, b) => b.entry_number - a.entry_number); // Show newest first
  },

  getEntryById(entryId: string): JournalEntry | null {
    return db.queryById<JournalEntry>('journal_entries', entryId);
  },

  getLinesForEntry(journalId: string): JournalLine[] {
    const lines = db.queryAll<JournalLine>('journal_lines');
    return lines.filter(l => l.journal_id === journalId);
  },

  getLatestEntryNumber(businessId: string): number {
    const entries = db.queryByBusiness<JournalEntry>('journal_entries', businessId) || [];
    if (entries.length === 0) return 0;
    return Math.max(...entries.map(e => e.entry_number));
  },

  createEntry(
    entry: Omit<JournalEntry, 'id'>, 
    lines: Omit<JournalLine, 'id' | 'journal_id'>[]
  ): { entry: JournalEntry; lines: JournalLine[] } {
    db.beginTransaction();
    try {
      // 1. Double entry debit/credit validation
      const debitSum = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
      const creditSum = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
      
      // Allow minor float differences (less than 0.01)
      if (Math.abs(debitSum - creditSum) > 0.01) {
        throw new Error(`سند حسابداری نامتوازن است. مجموع بدهکار (${debitSum}) با بستانکار (${creditSum}) برابر نیست.`);
      }

      // 2. Insert Entry Header
      const nextNumber = this.getLatestEntryNumber(entry.business_id) + 1;
      const createdEntry = db.insertRecord<JournalEntry>('journal_entries', {
        ...entry,
        entry_number: nextNumber,
      });

      // 3. Insert Entry Lines
      const createdLines: JournalLine[] = [];
      lines.forEach(line => {
        const createdLine = db.insertRecord<JournalLine>('journal_lines', {
          ...line,
          journal_id: createdEntry.id,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        });
        createdLines.push(createdLine);
      });

      db.commit();
      return { entry: createdEntry, lines: createdLines };
    } catch (e) {
      db.rollback();
      throw e;
    }
  },

  reverseEntry(journalId: string, businessId: string): JournalEntry {
    db.beginTransaction();
    try {
      const entry = db.queryById<JournalEntry>('journal_entries', journalId);
      if (!entry) throw new Error('سند حسابداری یافت نشد.');
      if (entry.status === 'reversed') throw new Error('این سند قبلاً باطل شده است.');

      const lines = this.getLinesForEntry(journalId);
      
      // Mark original entry as reversed
      db.updateRecord<JournalEntry>('journal_entries', journalId, { status: 'reversed' });

      // Create reversing entry header
      const nextNumber = this.getLatestEntryNumber(businessId) + 1;
      const reversedHeader = db.insertRecord<JournalEntry>('journal_entries', {
        business_id: businessId,
        entry_number: nextNumber,
        date: new Date().toISOString().split('T')[0],
        description: `آرتیکل اصلاحی / ابطال سند شماره ${entry.entry_number} (${entry.description})`,
        reference_type: 'manual',
        reference_id: journalId,
        status: 'posted',
      });

      // Insert reversing lines (debit becomes credit, credit becomes debit)
      lines.forEach(l => {
        db.insertRecord<JournalLine>('journal_lines', {
          journal_id: reversedHeader.id,
          account_id: l.account_id,
          party_id: l.party_id,
          debit: l.credit, // Replaced
          credit: l.debit, // Replaced
          description: `ابطال آرتیکل: ${l.description}`,
        });
      });

      db.commit();
      return entry;
    } catch (e) {
      db.rollback();
      throw e;
    }
  }
};

export const AccountingRepository = {
  getPeriods(businessId: string): AccountingPeriod[] {
    const periods = db.queryByBusiness<AccountingPeriod>('accounting_periods', businessId);
    
    // Seed a default financial period if empty
    if (periods.length === 0) {
      db.beginTransaction();
      try {
        db.insertRecord<AccountingPeriod>('accounting_periods', {
          business_id: businessId,
          name: 'دوره مالی جاری ۱۴۰۵',
          start_date: '2026-01-01',
          end_date: '2026-12-29',
          status: 'open',
        });
        db.commit();
      } catch (e) {
        db.rollback();
      }
      return db.queryByBusiness<AccountingPeriod>('accounting_periods', businessId);
    }
    return periods;
  },

  createPeriod(period: Omit<AccountingPeriod, 'id'>): AccountingPeriod {
    return db.insertRecord<AccountingPeriod>('accounting_periods', period);
  },

  closePeriod(periodId: string): void {
    db.updateRecord<AccountingPeriod>('accounting_periods', periodId, { status: 'closed' });
  },

  // BASE QUERIES FOR FINANCIAL REPORTS

  // 1. General Ledger Query (دفتر کل)
  getGeneralLedger(businessId: string, startDate?: string, endDate?: string): LedgerQueryRow[] {
    const accounts = AccountRepository.getAccounts(businessId);
    const entries = db.queryByBusiness<JournalEntry>('journal_entries', businessId)
      .filter(e => e.status === 'posted');
    
    const lines = db.queryAll<JournalLine>('journal_lines');
    const ledgerRows: LedgerQueryRow[] = [];

    entries.forEach(entry => {
      // Date filter
      if (startDate && entry.date < startDate) return;
      if (endDate && entry.date > endDate) return;

      const entryLines = lines.filter(l => l.journal_id === entry.id);
      entryLines.forEach(line => {
        const account = accounts.find(a => a.id === line.account_id);
        if (!account) return;

        ledgerRows.push({
          date: entry.date,
          entry_number: entry.entry_number,
          journal_id: entry.id,
          description: line.description || entry.description,
          debit: line.debit,
          credit: line.credit,
          balance: 0, // Computed in second step
          account_name: account.name,
          account_code: account.code,
        });
      });
    });

    // Sort by date then entry number
    ledgerRows.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.entry_number - b.entry_number;
    });

    // Running balance (cumulative)
    let runningBalance = 0;
    ledgerRows.forEach(row => {
      // Since it's general ledger, debit increases balance, credit decreases it
      runningBalance += (row.debit - row.credit);
      row.balance = runningBalance;
    });

    return ledgerRows;
  },

  // 2. Account Ledger Query (دفتر معین/تفصیلی)
  getAccountLedger(businessId: string, accountId: string, startDate?: string, endDate?: string): LedgerQueryRow[] {
    const account = AccountRepository.getAccountById(accountId);
    if (!account) return [];

    const entries = db.queryByBusiness<JournalEntry>('journal_entries', businessId)
      .filter(e => e.status === 'posted');
    
    const lines = db.queryAll<JournalLine>('journal_lines');
    const ledgerRows: LedgerQueryRow[] = [];

    entries.forEach(entry => {
      // Date filter
      if (startDate && entry.date < startDate) return;
      if (endDate && entry.date > endDate) return;

      const matchedLines = lines.filter(l => l.journal_id === entry.id && l.account_id === accountId);
      matchedLines.forEach(line => {
        ledgerRows.push({
          date: entry.date,
          entry_number: entry.entry_number,
          journal_id: entry.id,
          description: line.description || entry.description,
          debit: line.debit,
          credit: line.credit,
          balance: 0,
          account_name: account.name,
          account_code: account.code,
        });
      });
    });

    // Sort chronologically
    ledgerRows.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.entry_number - b.entry_number;
    });

    // Running Balance specific to account type
    let runningBalance = 0;
    const isDebitNormal = account.account_type === 'asset' || account.account_type === 'expense';
    
    ledgerRows.forEach(row => {
      if (isDebitNormal) {
        runningBalance += (row.debit - row.credit);
      } else {
        runningBalance += (row.credit - row.debit);
      }
      row.balance = runningBalance;
    });

    return ledgerRows;
  },

  // 3. Trial Balance (تراز آزمایشی چهارستونی)
  getTrialBalance(businessId: string): TrialBalanceRow[] {
    const accounts = AccountRepository.getAccounts(businessId);
    const entries = db.queryByBusiness<JournalEntry>('journal_entries', businessId)
      .filter(e => e.status === 'posted');
    
    const lines = db.queryAll<JournalLine>('journal_lines');
    
    return accounts.map(acc => {
      let debitSum = 0;
      let creditSum = 0;

      entries.forEach(entry => {
        const matchedLines = lines.filter(l => l.journal_id === entry.id && l.account_id === acc.id);
        matchedLines.forEach(l => {
          debitSum += l.debit;
          creditSum += l.credit;
        });
      });

      let debitBalance = 0;
      let creditBalance = 0;

      if (debitSum > creditSum) {
        debitBalance = debitSum - creditSum;
      } else {
        creditBalance = creditSum - debitSum;
      }

      return {
        account_id: acc.id,
        code: acc.code,
        name: acc.name,
        account_type: acc.account_type,
        level: acc.level,
        debitSum,
        creditSum,
        debitBalance,
        creditBalance,
      };
    });
  }
};
