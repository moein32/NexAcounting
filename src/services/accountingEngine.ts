import { AccountRepository, JournalRepository } from '../repositories/accountingRepository';
import { JournalEntry, JournalLine, JournalReferenceType } from '../types/accounting';

export const AccountingEngine = {
  /**
   * Main entry point to create and validate a journal entry.
   */
  createJournalEntry(
    businessId: string,
    entryData: {
      date: string;
      description: string;
      reference_type: JournalReferenceType;
      reference_id: string | null;
      status?: 'draft' | 'posted';
    },
    lines: {
      account_code: string; // Map by code to resolve ID dynamically
      party_id?: string | null;
      debit: number;
      credit: number;
      description: string;
    }[]
  ): { entry: JournalEntry; lines: JournalLine[] } {
    // 1. Resolve Account IDs from codes
    const processedLines = lines.map(line => {
      const account = AccountRepository.getAccountByCode(businessId, line.account_code);
      if (!account) {
        throw new Error(`حساب با کد ${line.account_code} در درخت حساب‌ها یافت نشد.`);
      }
      return {
        account_id: account.id,
        party_id: line.party_id || null,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      };
    });

    // 2. Validate Balance
    this.validateBalance(processedLines);

    // 3. Delegate to JournalRepository for persistence (Atomic transaction)
    return JournalRepository.createEntry(
      {
        business_id: businessId,
        date: entryData.date,
        description: entryData.description,
        reference_type: entryData.reference_type,
        reference_id: entryData.reference_id,
        status: entryData.status || 'posted',
        entry_number: 0, // Auto-computed in repository
      },
      processedLines
    );
  },

  /**
   * Double-Entry rule: Sum(Debit) === Sum(Credit)
   */
  validateBalance(lines: { debit: number; credit: number }[]): void {
    const debitSum = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const creditSum = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    if (Math.abs(debitSum - creditSum) > 0.01) {
      throw new Error(`سند حسابداری نامتوازن است. مجموع بدهکار (${debitSum}) با بستانکار (${creditSum}) برابر نیست.`);
    }
  },

  /**
   * Post Draft entries to Posted
   */
  postEntry(entryId: string, businessId: string): JournalEntry {
    const entry = JournalRepository.getEntryById(entryId);
    if (!entry) throw new Error('سند حسابداری یافت نشد.');
    
    // In our SQLite, if it is already posted, return it
    if (entry.status === 'posted') return entry;

    return JournalRepository.createEntry({ ...entry, status: 'posted' }, JournalRepository.getLinesForEntry(entryId)).entry;
  },

  /**
   * Reverse entry (cancelling via counter-offset transaction).
   */
  reverseEntry(journalId: string, businessId: string): JournalEntry {
    return JournalRepository.reverseEntry(journalId, businessId);
  },

  // AUTOMATIC INTEGRATION POSTING RULES

  /**
   * 1. Auto-post Sales Invoice
   */
  postSalesInvoice(
    businessId: string,
    invoice: {
      id: string;
      date: string;
      party_id: string;
      grand_total: number;
      is_cash?: boolean; // Cash vs Credit/On-Account
      number: string;
    }
  ) {
    const isCash = invoice.is_cash ?? true;
    const amount = Number(invoice.grand_total);
    if (amount <= 0) return;

    const description = `ثبت خودکار فاکتور فروش شماره ${invoice.number}`;
    
    // Debit Accounts Receivable or Cash & Bank
    const debitCode = isCash ? '1010' : '1020';
    
    const lines = [
      {
        account_code: debitCode,
        party_id: isCash ? null : invoice.party_id,
        debit: amount,
        credit: 0,
        description: `بدهکار: ${isCash ? 'صندوق و بانک' : 'مشتری'} بابت فاکتور فروش ${invoice.number}`,
      },
      {
        account_code: '4010', // Sales Revenue
        party_id: null,
        debit: 0,
        credit: amount,
        description: `بستانکار: درآمد فروش کالا بابت فاکتور فروش ${invoice.number}`,
      }
    ];

    return this.createJournalEntry(
      businessId,
      {
        date: invoice.date,
        description,
        reference_type: 'sales_invoice',
        reference_id: invoice.id,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * 2. Auto-post Purchase Invoice
   */
  postPurchaseInvoice(
    businessId: string,
    purchase: {
      id: string;
      date: string;
      party_id: string;
      grand_total: number;
      is_cash?: boolean;
      number: string;
    }
  ) {
    const isCash = purchase.is_cash ?? true;
    const amount = Number(purchase.grand_total);
    if (amount <= 0) return;

    const description = `ثبت خودکار فاکتور خرید شماره ${purchase.number}`;
    
    // Credit Accounts Payable or Cash & Bank
    const creditCode = isCash ? '1010' : '2010';

    const lines = [
      {
        account_code: '1030', // Inventory
        party_id: null,
        debit: amount,
        credit: 0,
        description: `بدهکار: موجودی کالا بابت فاکتور خرید ${purchase.number}`,
      },
      {
        account_code: creditCode,
        party_id: isCash ? null : purchase.party_id,
        debit: 0,
        credit: amount,
        description: `بستانکار: ${isCash ? 'صندوق و بانک' : 'تامین‌کننده'} بابت فاکتور خرید ${purchase.number}`,
      }
    ];

    return this.createJournalEntry(
      businessId,
      {
        date: purchase.date,
        description,
        reference_type: 'purchase_invoice',
        reference_id: purchase.id,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * 3. Auto-post Receipt (دریافت نقدی)
   */
  postReceipt(
    businessId: string,
    receipt: {
      id: string;
      date: string;
      party_id: string;
      amount: number;
      description?: string;
    }
  ) {
    const amount = Number(receipt.amount);
    if (amount <= 0) return;

    const desc = receipt.description || `دریافت وجه نقدی / سند دریافت شماره ${receipt.id.slice(0, 6)}`;

    const lines = [
      {
        account_code: '1010', // Debit Cash & Bank
        party_id: null,
        debit: amount,
        credit: 0,
        description: `بدهکار: صندوق و بانک بابت دریافت نقدی`,
      },
      {
        account_code: '1020', // Credit Accounts Receivable
        party_id: receipt.party_id,
        debit: 0,
        credit: amount,
        description: `بستانکار: حساب مشتری بابت دریافت نقدی`,
      }
    ];

    return this.createJournalEntry(
      businessId,
      {
        date: receipt.date,
        description: desc,
        reference_type: 'receipt',
        reference_id: receipt.id,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * 4. Auto-post Payment (پرداخت نقدی یا هزینه)
   */
  postPayment(
    businessId: string,
    payment: {
      id: string;
      date: string;
      party_id: string;
      amount: number;
      description?: string;
      is_expense?: boolean; // Payment can be direct expense or vendor clearing
    }
  ) {
    const amount = Number(payment.amount);
    if (amount <= 0) return;

    const desc = payment.description || `پرداخت وجه نقدی / سند پرداخت شماره ${payment.id.slice(0, 6)}`;

    // If direct expense, debit Expense Account (5040), else Accounts Payable (2010)
    const debitCode = payment.is_expense ? '5040' : '2010';

    const lines = [
      {
        account_code: debitCode,
        party_id: payment.is_expense ? null : payment.party_id,
        debit: amount,
        credit: 0,
        description: `بدهکار: ${payment.is_expense ? 'هزینه جاری' : 'حساب تامین‌کننده'} بابت پرداخت وجه`,
      },
      {
        account_code: '1010', // Credit Cash & Bank
        party_id: null,
        debit: 0,
        credit: amount,
        description: `بستانکار: صندوق و بانک بابت پرداخت وجه`,
      }
    ];

    return this.createJournalEntry(
      businessId,
      {
        date: payment.date,
        description: desc,
        reference_type: 'payment',
        reference_id: payment.id,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * 5. Auto-post Cleared Check (وصول چک)
   * - If Received check cleared: Debit Bank/Cash (1010), Credit Notes Receivable (1040)
   * - If Issued check cleared: Debit Notes Payable (2020), Credit Bank/Cash (1010)
   */
  postClearedCheck(
    businessId: string,
    check: {
      id: string;
      check_number: string;
      amount: number;
      type: 'received' | 'issued';
      party_id: string;
      date: string;
    }
  ) {
    const amount = Number(check.amount);
    if (amount <= 0) return;

    const isReceived = check.type === 'received';
    const description = `وصول چک صیادی شماره ${check.check_number}`;

    const lines = isReceived
      ? [
          {
            account_code: '1010', // Bank/Cash
            party_id: null,
            debit: amount,
            credit: 0,
            description: `بدهکار: بانک/صندوق بابت وصول چک دریافتی ${check.check_number}`,
          },
          {
            account_code: '1040', // Notes Receivable
            party_id: check.party_id,
            debit: 0,
            credit: amount,
            description: `بستانکار: اسناد دریافتنی بابت وصول چک دریافتی ${check.check_number}`,
          }
        ]
      : [
          {
            account_code: '2020', // Notes Payable
            party_id: check.party_id,
            debit: amount,
            credit: 0,
            description: `بدهکار: اسناد پرداختنی بابت پاس شدن چک صادره ${check.check_number}`,
          },
          {
            account_code: '1010', // Bank/Cash
            party_id: null,
            debit: 0,
            credit: amount,
            description: `بستانکار: بانک/صندوق بابت پاس شدن چک صادره ${check.check_number}`,
          }
        ];

    return this.createJournalEntry(
      businessId,
      {
        date: check.date,
        description,
        reference_type: 'manual', // Check clearing is logged as financial entry
        reference_id: check.id,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * 6. Auto-post Returned Check (برگشت چک)
   * - Received check returned: Debit Customer (1020), Credit Notes Receivable (1040)
   * - Issued check returned: Debit Notes Payable (2020), Credit Supplier (2010)
   */
  postReturnedCheck(
    businessId: string,
    check: {
      id: string;
      check_number: string;
      amount: number;
      type: 'received' | 'issued';
      party_id: string;
      date: string;
    }
  ) {
    const amount = Number(check.amount);
    if (amount <= 0) return;

    const isReceived = check.type === 'received';
    const description = `برگشت خوردن چک صیادی شماره ${check.check_number}`;

    const lines = isReceived
      ? [
          {
            account_code: '1020', // Accounts Receivable (Customer)
            party_id: check.party_id,
            debit: amount,
            credit: 0,
            description: `بدهکار: حساب مشتری بابت برگشت چک دریافتی ${check.check_number}`,
          },
          {
            account_code: '1040', // Notes Receivable
            party_id: check.party_id,
            debit: 0,
            credit: amount,
            description: `بستانکار: اسناد دریافتنی بابت برگشت چک دریافتی ${check.check_number}`,
          }
        ]
      : [
          {
            account_code: '2020', // Notes Payable
            party_id: check.party_id,
            debit: amount,
            credit: 0,
            description: `بدهکار: اسناد پرداختنی بابت برگشت چک صادره ${check.check_number}`,
          },
          {
            account_code: '2010', // Accounts Payable (Supplier)
            party_id: check.party_id,
            debit: 0,
            credit: amount,
            description: `بستانکار: حساب تامین‌کننده بابت برگشت چک صادره ${check.check_number}`,
          }
        ];

    return this.createJournalEntry(
      businessId,
      {
        date: check.date,
        description,
        reference_type: 'manual',
        reference_id: check.id,
        status: 'posted',
      },
      lines
    );
  },

  /**
   * 7. Inventory Costing Link (Placeholder framework)
   */
  postInventoryMovement(
    businessId: string,
    movement: {
      id: string;
      date: string;
      item_id: string;
      quantity: number;
      cost: number;
      type: 'in' | 'out';
    }
  ) {
    // Infrastructure integration for Cost of Goods Sold (COGS)
    console.info(`[COGS Inventory Integration] Processing movement of item ${movement.item_id}: Qty ${movement.quantity}, Cost ${movement.cost}`);
    // Future expansion: Debit COGS (5010), Credit Inventory (1030) or vice versa.
  }
};
