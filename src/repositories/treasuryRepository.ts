import { db } from '../lib/sqlite';
import { AccountingEngine } from '../services/accountingEngine';
import { JournalRepository } from './accountingRepository';


// Define TS Interfaces for Treasury Entities
export interface CashAccount {
  id: string;
  business_id: string;
  name: string;
  account_type: 'cash' | 'bank' | 'card' | 'other';
  opening_balance: number;
  current_balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: string;
  business_id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export interface TreasuryTransaction {
  id: string;
  business_id: string;
  account_id: string;
  party_id?: string;
  document_id?: string;
  transaction_type: 'IN' | 'OUT' | 'TRANSFER';
  amount: number;
  description?: string;
  transaction_date: string;
  created_by?: string;
  created_at?: string;
}

export interface Receipt {
  id: string;
  business_id: string;
  party_id: string;
  amount: number;
  payment_method: string;
  cash_account: string; // Cash Account ID
  reference_number?: string;
  description?: string;
  status: 'draft' | 'confirmed';
  created_at?: string;
}

export interface Payment {
  id: string;
  business_id: string;
  party_id: string;
  amount: number;
  payment_method: string;
  cash_account: string; // Cash Account ID
  reference_number?: string;
  description?: string;
  status: 'draft' | 'confirmed';
  created_at?: string;
}

export interface Check {
  id: string;
  business_id: string;
  party_id: string;
  type: 'received' | 'issued';
  check_number: string;
  bank_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  status: 'pending' | 'cleared' | 'returned' | 'cancelled';
  created_at?: string;
}

// 1. TreasuryRepository
export const TreasuryRepository = {
  getAccounts(businessId: string): CashAccount[] {
    const all = db.queryByBusiness<CashAccount>('cash_accounts', businessId);
    
    // Seed default accounts if empty for a smoother UX
    if (all.length === 0) {
      db.beginTransaction();
      try {
        const defaultCash = db.insertRecord<CashAccount>('cash_accounts', {
          business_id: businessId,
          name: 'صندوق نقدی اصلی',
          account_type: 'cash',
          opening_balance: 0,
          current_balance: 0,
        });
        const defaultBank = db.insertRecord<CashAccount>('cash_accounts', {
          business_id: businessId,
          name: 'بانک ملی مرکزی',
          account_type: 'bank',
          opening_balance: 0,
          current_balance: 0,
        });
        db.commit();
        return [defaultCash, defaultBank];
      } catch (e) {
        db.rollback();
        console.error('Failed to seed default cash accounts', e);
      }
    }
    return all;
  },

  getAccountById(id: string): CashAccount | null {
    return db.queryById<CashAccount>('cash_accounts', id);
  },

  createAccount(account: Omit<CashAccount, 'id' | 'current_balance'> & { id?: string; current_balance?: number }): CashAccount {
    const payload = {
      ...account,
      current_balance: account.current_balance ?? account.opening_balance,
    };
    return db.insertRecord<CashAccount>('cash_accounts', payload);
  },

  updateAccount(id: string, account: Partial<CashAccount>): CashAccount {
    return db.updateRecord<CashAccount>('cash_accounts', id, account);
  },

  deleteAccount(id: string): boolean {
    return db.deleteRecord('cash_accounts', id);
  },

  getTransactions(businessId: string): TreasuryTransaction[] {
    return db.queryByBusiness<TreasuryTransaction>('treasury_transactions', businessId);
  },

  createTransaction(tx: Omit<TreasuryTransaction, 'id' | 'created_at'> & { id?: string }): TreasuryTransaction {
    return db.insertRecord<TreasuryTransaction>('treasury_transactions', tx);
  },

  // Atomic Account Transfer Flow
  transferBetweenAccounts(
    businessId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description?: string
  ): boolean {
    db.beginTransaction();
    try {
      const source = db.queryById<CashAccount>('cash_accounts', fromAccountId);
      const dest = db.queryById<CashAccount>('cash_accounts', toAccountId);

      if (!source || !dest) {
        throw new Error('حساب مبدا یا مقصد یافت نشد.');
      }

      if (source.current_balance < amount) {
        throw new Error('موجودی حساب مبدا کافی نیست.');
      }

      // Update balances
      db.updateRecord<CashAccount>('cash_accounts', fromAccountId, {
        current_balance: source.current_balance - amount,
      });

      db.updateRecord<CashAccount>('cash_accounts', toAccountId, {
        current_balance: dest.current_balance + amount,
      });

      // Log outbound TRANSFER record on source account
      db.insertRecord<TreasuryTransaction>('treasury_transactions', {
        business_id: businessId,
        account_id: fromAccountId,
        transaction_type: 'TRANSFER',
        amount: amount,
        description: description || `انتقال وجه به ${dest.name}`,
        transaction_date: new Date().toISOString().split('T')[0],
      });

      // Log inbound TRANSFER record on destination account
      db.insertRecord<TreasuryTransaction>('treasury_transactions', {
        business_id: businessId,
        account_id: toAccountId,
        transaction_type: 'TRANSFER',
        amount: amount,
        description: description || `انتقال وجه از ${source.name}`,
        transaction_date: new Date().toISOString().split('T')[0],
      });

      db.commit();
      return true;
    } catch (e) {
      db.rollback();
      console.error('Transfer transaction failed, rolled back successfully:', e);
      throw e;
    }
  },
};

// 2. ReceiptRepository
export const ReceiptRepository = {
  getAll(businessId: string): Receipt[] {
    return db.queryByBusiness<Receipt>('receipts', businessId);
  },

  getById(id: string): Receipt | null {
    return db.queryById<Receipt>('receipts', id);
  },

  create(receipt: Omit<Receipt, 'id'> & { id?: string }): Receipt {
    db.beginTransaction();
    try {
      // 1. Insert receipt
      const created = db.insertRecord<Receipt>('receipts', receipt);

      // 2. If receipt is confirmed, update account balance and log transaction
      if (receipt.status === 'confirmed') {
        const account = db.queryById<CashAccount>('cash_accounts', receipt.cash_account);
        if (account) {
          db.updateRecord<CashAccount>('cash_accounts', receipt.cash_account, {
            current_balance: account.current_balance + receipt.amount,
          });

          // Log transaction
          db.insertRecord<TreasuryTransaction>('treasury_transactions', {
            business_id: receipt.business_id,
            account_id: receipt.cash_account,
            party_id: receipt.party_id,
            transaction_type: 'IN',
            amount: receipt.amount,
            description: receipt.description || `دریافت وجه بابت رسید`,
            transaction_date: new Date().toISOString().split('T')[0],
          });

          // Post to double-entry accounting engine automatically
          try {
            AccountingEngine.postReceipt(receipt.business_id, {
              id: created.id,
              date: (created.created_at || new Date().toISOString()).split('T')[0],
              party_id: receipt.party_id,
              amount: receipt.amount,
              description: receipt.description || `دریافت وجه بابت رسید`,
            });
          } catch (ae) {
            console.error('Accounting auto-posting failed for receipt:', ae);
          }
        }
      }

      db.commit();
      return created;
    } catch (e) {
      db.rollback();
      console.error('Receipt registration failed, rolled back:', e);
      throw e;
    }
  },

  delete(id: string): boolean {
    db.beginTransaction();
    try {
      const receipt = db.queryById<Receipt>('receipts', id);
      if (receipt && receipt.status === 'confirmed') {
        // Reverse balance if it was already confirmed
        const account = db.queryById<CashAccount>('cash_accounts', receipt.cash_account);
        if (account) {
          db.updateRecord<CashAccount>('cash_accounts', receipt.cash_account, {
            current_balance: Math.max(0, account.current_balance - receipt.amount),
          });
        }
        
        // Remove or counter-log transaction if desired. For simplicity, delete matching transaction
        const allTxs = db.queryByBusiness<TreasuryTransaction>('treasury_transactions', receipt.business_id);
        const matchingTx = allTxs.find(
          (t) => t.account_id === receipt.cash_account && t.party_id === receipt.party_id && t.amount === receipt.amount && t.transaction_type === 'IN'
        );
        if (matchingTx) {
          db.deleteRecord('treasury_transactions', matchingTx.id);
        }

        // Reverse related accounting journal entries
        try {
          const entries = JournalRepository.getEntries(receipt.business_id);
          const related = entries.filter(
            (e) => e.reference_type === 'receipt' && e.reference_id === id && e.status !== 'reversed'
          );
          for (const ent of related) {
            AccountingEngine.reverseEntry(ent.id, receipt.business_id);
          }
        } catch (jeErr) {
          console.error('Failed to reverse accounting entry for receipt deletion:', jeErr);
        }
      }
      const deleted = db.deleteRecord('receipts', id);
      db.commit();
      return deleted;
    } catch (e) {
      db.rollback();
      console.error('Receipt deletion failed, rolled back:', e);
      return false;
    }
  },
};

// 3. PaymentRepository
export const PaymentRepository = {
  getAll(businessId: string): Payment[] {
    return db.queryByBusiness<Payment>('payments', businessId);
  },

  getById(id: string): Payment | null {
    return db.queryById<Payment>('payments', id);
  },

  create(payment: Omit<Payment, 'id'> & { id?: string }): Payment {
    db.beginTransaction();
    try {
      // 1. Insert payment
      const created = db.insertRecord<Payment>('payments', payment);

      // 2. If payment is confirmed, update account balance and log transaction
      if (payment.status === 'confirmed') {
        const account = db.queryById<CashAccount>('cash_accounts', payment.cash_account);
        if (account) {
          db.updateRecord<CashAccount>('cash_accounts', payment.cash_account, {
            current_balance: account.current_balance - payment.amount,
          });

          // Log transaction
          db.insertRecord<TreasuryTransaction>('treasury_transactions', {
            business_id: payment.business_id,
            account_id: payment.cash_account,
            party_id: payment.party_id,
            transaction_type: 'OUT',
            amount: payment.amount,
            description: payment.description || `پرداخت وجه بابت سند`,
            transaction_date: new Date().toISOString().split('T')[0],
          });

          // Post to double-entry accounting engine automatically
          try {
            AccountingEngine.postPayment(payment.business_id, {
              id: created.id,
              date: (created.created_at || new Date().toISOString()).split('T')[0],
              party_id: payment.party_id,
              amount: payment.amount,
              description: payment.description || `پرداخت وجه بابت سند`,
              is_expense: payment.description?.includes('هزینه') || false,
            });
          } catch (ae) {
            console.error('Accounting auto-posting failed for payment:', ae);
          }
        }
      }

      db.commit();
      return created;
    } catch (e) {
      db.rollback();
      console.error('Payment registration failed, rolled back:', e);
      throw e;
    }
  },

  delete(id: string): boolean {
    db.beginTransaction();
    try {
      const payment = db.queryById<Payment>('payments', id);
      if (payment && payment.status === 'confirmed') {
        // Reverse balance
        const account = db.queryById<CashAccount>('cash_accounts', payment.cash_account);
        if (account) {
          db.updateRecord<CashAccount>('cash_accounts', payment.cash_account, {
            current_balance: account.current_balance + payment.amount,
          });
        }

        // Remove matching transaction
        const allTxs = db.queryByBusiness<TreasuryTransaction>('treasury_transactions', payment.business_id);
        const matchingTx = allTxs.find(
          (t) => t.account_id === payment.cash_account && t.party_id === payment.party_id && t.amount === payment.amount && t.transaction_type === 'OUT'
        );
        if (matchingTx) {
          db.deleteRecord('treasury_transactions', matchingTx.id);
        }

        // Reverse related accounting journal entries
        try {
          const entries = JournalRepository.getEntries(payment.business_id);
          const related = entries.filter(
            (e) => e.reference_type === 'payment' && e.reference_id === id && e.status !== 'reversed'
          );
          for (const ent of related) {
            AccountingEngine.reverseEntry(ent.id, payment.business_id);
          }
        } catch (jeErr) {
          console.error('Failed to reverse accounting entry for payment deletion:', jeErr);
        }
      }
      const deleted = db.deleteRecord('payments', id);
      db.commit();
      return deleted;
    } catch (e) {
      db.rollback();
      console.error('Payment deletion failed, rolled back:', e);
      return false;
    }
  },
};

// 4. CheckRepository
export const CheckRepository = {
  getAll(businessId: string): Check[] {
    return db.queryByBusiness<Check>('checks', businessId);
  },

  getById(id: string): Check | null {
    return db.queryById<Check>('checks', id);
  },

  create(check: Omit<Check, 'id'> & { id?: string }): Check {
    return db.insertRecord<Check>('checks', check);
  },

  update(id: string, check: Partial<Check>): Check {
    return db.updateRecord<Check>('checks', id, check);
  },

  delete(id: string): boolean {
    return db.deleteRecord('checks', id);
  },

  updateStatus(id: string, status: Check['status'], accountId?: string): Check {
    db.beginTransaction();
    try {
      const check = db.queryById<Check>('checks', id);
      if (!check) {
        throw new Error('چک موردنظر یافت نشد.');
      }

      const previousStatus = check.status;
      const updated = db.updateRecord<Check>('checks', id, { status });

      // If status changed to cleared, update cash account and create treasury transaction
      if (status === 'cleared' && previousStatus !== 'cleared' && accountId) {
        const account = db.queryById<CashAccount>('cash_accounts', accountId);
        if (account) {
          const isReceived = check.type === 'received';
          const newBalance = isReceived 
            ? account.current_balance + check.amount
            : account.current_balance - check.amount;

          db.updateRecord<CashAccount>('cash_accounts', accountId, {
            current_balance: newBalance,
          });

          // Log corresponding Treasury Transaction
          db.insertRecord<TreasuryTransaction>('treasury_transactions', {
            business_id: check.business_id,
            account_id: accountId,
            party_id: check.party_id,
            transaction_type: isReceived ? 'IN' : 'OUT',
            amount: check.amount,
            description: `پاس شدن چک شماره ${check.check_number} (${check.bank_name.split('::')[0]})`,
            transaction_date: new Date().toISOString().split('T')[0],
          });

          // Post Cleared Check to Accounting
          try {
            AccountingEngine.postClearedCheck(check.business_id, {
              id: check.id,
              check_number: check.check_number,
              amount: check.amount,
              type: check.type,
              party_id: check.party_id,
              date: new Date().toISOString().split('T')[0],
            });
          } catch (ae) {
            console.error('Accounting auto-posting failed for cleared check:', ae);
          }
        }
      }

      // If status changed to returned
      if (status === 'returned' && previousStatus !== 'returned') {
        try {
          AccountingEngine.postReturnedCheck(check.business_id, {
            id: check.id,
            check_number: check.check_number,
            amount: check.amount,
            type: check.type,
            party_id: check.party_id,
            date: new Date().toISOString().split('T')[0],
          });
        } catch (ae) {
          console.error('Accounting auto-posting failed for returned check:', ae);
        }
      }

      db.commit();
      return updated;
    } catch (e) {
      db.rollback();
      console.error('Check status transition failed, rolled back:', e);
      throw e;
    }
  },
};
