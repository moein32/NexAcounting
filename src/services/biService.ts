import { db } from '../lib/sqlite';
import { DocumentRepository, InventoryRepository, PartyRepository, ItemRepository } from '../repositories';
import { TreasuryRepository, CheckRepository, Check, CashAccount } from '../repositories/treasuryRepository';
import { AccountRepository, JournalRepository } from '../repositories/accountingRepository';
import { documentService } from './documentService';
import { itemService } from './itemService';
import { partyService } from './partyService';
import { CostEngine } from './costEngine';

export interface FinancialCommitment {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  category: 'rent' | 'insurance' | 'salary' | 'utilities' | 'loan' | 'other';
  status: 'paid' | 'unpaid';
  notes?: string;
  is_recurring: boolean;
  recurrence_period?: 'monthly' | 'yearly';
}

export const biService = {
  // Get and set financial commitments from settings
  getFinancialCommitments(businessId: string): FinancialCommitment[] {
    const key = `commitments_${businessId}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Seed default initial commitments for demo
        const initial: FinancialCommitment[] = [
          {
            id: 'commit_1',
            name: 'اجاره دفتر مرکزی شریعتی',
            amount: 15000000,
            due_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0], // 3 days from now
            category: 'rent',
            status: 'unpaid',
            is_recurring: true,
            recurrence_period: 'monthly'
          },
          {
            id: 'commit_2',
            name: 'حقوق و دستمزد پرسنل کارگاه',
            amount: 45000000,
            due_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0], // 10 days from now
            category: 'salary',
            status: 'unpaid',
            is_recurring: true,
            recurrence_period: 'monthly'
          },
          {
            id: 'commit_3',
            name: 'بیمه تامین اجتماعی پرسنل دفتر',
            amount: 12800000,
            due_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // 2 days ago
            category: 'insurance',
            status: 'paid',
            is_recurring: true,
            recurrence_period: 'monthly'
          }
        ];
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveFinancialCommitments(businessId: string, commitments: FinancialCommitment[]) {
    const key = `commitments_${businessId}`;
    localStorage.setItem(key, JSON.stringify(commitments));
  },

  addFinancialCommitment(businessId: string, commitment: Omit<FinancialCommitment, 'id'>): FinancialCommitment {
    const commitments = this.getFinancialCommitments(businessId);
    const newCommitment: FinancialCommitment = {
      ...commitment,
      id: 'commit_' + Math.random().toString(36).substr(2, 9)
    };
    commitments.push(newCommitment);
    this.saveFinancialCommitments(businessId, commitments);
    return newCommitment;
  },

  updateCommitmentStatus(businessId: string, id: string, status: 'paid' | 'unpaid', accountId?: string): boolean {
    const commitments = this.getFinancialCommitments(businessId);
    const index = commitments.findIndex(c => c.id === id);
    if (index === -1) return false;

    commitments[index].status = status;

    // If marked as paid, we can optionally register a cash payment atomically in Treasury
    if (status === 'paid' && accountId) {
      try {
        const commitment = commitments[index];
        // Create treasury payment
        db.beginTransaction();
        
        const account = db.queryById<CashAccount>('cash_accounts', accountId);
        if (account) {
          db.updateRecord<CashAccount>('cash_accounts', accountId, {
            current_balance: account.current_balance - commitment.amount
          });

          db.insertRecord('payments', {
            id: 'pay_commit_' + commitment.id,
            business_id: businessId,
            party_id: 'party_commitments', // Virtual party or other
            amount: commitment.amount,
            payment_method: 'نقدی / کارت',
            cash_account: accountId,
            description: `پرداخت تعهد مالی: ${commitment.name}`,
            status: 'confirmed',
            created_at: new Date().toISOString()
          });

          db.insertRecord('treasury_transactions', {
            business_id: businessId,
            account_id: accountId,
            transaction_type: 'OUT',
            amount: commitment.amount,
            description: `پرداخت تعهد مالی: ${commitment.name}`,
            transaction_date: new Date().toISOString().split('T')[0]
          });
        }
        
        db.commit();
      } catch (e) {
        db.rollback();
        console.error('Failed to post payment for commitment', e);
      }
    }

    this.saveFinancialCommitments(businessId, commitments);
    return true;
  },

  // Dynamic Dashboard and Reports Calculation
  async getDashboardMetrics(businessId: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Fetch raw documents, accounts, checks, and items
    const docs = await documentService.getDocuments(businessId);
    const cashAccounts = TreasuryRepository.getAccounts(businessId);
    const checks = CheckRepository.getAll(businessId);
    const itemsRes = await itemService.getItems(businessId);
    const items = itemsRes.data || [];
    const balances = InventoryRepository.getBalances();
    const commitments = this.getFinancialCommitments(businessId);

    // Filter documents
    const confirmedDocs = docs.filter(d => d.status === 'confirmed');
    const salesInvoices = confirmedDocs.filter(d => d.document_type === 'sales_invoice');
    const purchaseInvoices = confirmedDocs.filter(d => d.document_type === 'purchase_invoice');

    // 2. Compute "Sales Today" and "Purchases Today"
    const salesToday = salesInvoices
      .filter(d => d.document_date && d.document_date.split('T')[0] === todayStr)
      .reduce((sum, d) => sum + (d.grand_total || 0), 0);

    const purchasesToday = purchaseInvoices
      .filter(d => d.document_date && d.document_date.split('T')[0] === todayStr)
      .reduce((sum, d) => sum + (d.grand_total || 0), 0);

    // 3. Compute "Cash & Bank Balance"
    const totalCashBankBalance = cashAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

    // 4. Compute "Accounts Receivable" (Customers debt)
    const accountsReceivable = salesInvoices
      .filter(d => d.payment_status !== 'paid')
      .reduce((sum, d) => {
        const paidAmount = 0; // In standard models, partially_paid has details, but let's assume total_amount as debt or partially settled
        // Since we don't have secondary payment split on doc directly, we subtract based on payment_status or just sum unpaid amount
        if (d.payment_status === 'unpaid') {
          return sum + (d.grand_total || 0);
        } else if (d.payment_status === 'partially_paid') {
          return sum + ((d.grand_total || 0) * 0.4); // Approximation for partial
        }
        return sum;
      }, 0);

    // 5. Compute "Accounts Payable" (To suppliers)
    const accountsPayable = purchaseInvoices
      .filter(d => d.payment_status !== 'paid')
      .reduce((sum, d) => {
        if (d.payment_status === 'unpaid') {
          return sum + (d.grand_total || 0);
        } else if (d.payment_status === 'partially_paid') {
          return sum + ((d.grand_total || 0) * 0.4);
        }
        return sum;
      }, 0);

    // 6. Compute "Inventory Value"
    let totalInventoryValueCost = 0;
    let totalInventoryValueSale = 0;
    
    balances.forEach(bal => {
      const item = items.find(i => i.id === bal.item_id);
      if (item) {
        totalInventoryValueCost += Number(bal.quantity) * (Number(item.purchase_price) || 0);
        totalInventoryValueSale += Number(bal.quantity) * (Number(item.default_sale_price) || 0);
      }
    });

    // 7. Low Stock Alerts (items with quantity below min_stock)
    const lowStockItems = items
      .filter(item => item.track_inventory !== false)
      .map(item => {
        const itemBalances = balances.filter(b => b.item_id === item.id);
        const currentQty = itemBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
        const minStock = Number(item.min_stock) || 5;
        return {
          id: item.id,
          name: item.name,
          code: item.code,
          current_qty: currentQty,
          min_stock: minStock,
          unit: item.unit?.name || 'عدد'
        };
      })
      .filter(alert => alert.current_qty < alert.min_stock);

    // 8. Upcoming Checks
    const upcomingChecks = checks
      .filter(c => c.status === 'pending')
      .map(c => {
        const party = db.queryById('parties', c.party_id) as any;
        return {
          ...c,
          party_name: party?.display_name || 'نامشخص'
        };
      })
      .sort((a, b) => a.due_date.localeCompare(b.due_date));

    // 9. Upcoming Commitments
    const upcomingCommitments = commitments
      .filter(c => c.status === 'unpaid')
      .sort((a, b) => a.due_date.localeCompare(b.due_date));

    // 10. Profit & Loss trend (last 6 months)
    const monthlyTrend = this.getMonthlyProfitTrend(salesInvoices, purchaseInvoices);

    // 11. Top Selling Products
    const topProducts = this.getTopSellingProducts(salesInvoices, items, balances);

    // 12. Real Recent Transactions
    const recentTxList: any[] = [];
    salesInvoices.forEach(d => {
      const party = db.queryById('parties', d.party_id) as any;
      recentTxList.push({
        id: d.id,
        code: d.document_number,
        title: 'فاکتور فروش کالا و خدمات',
        partyName: party?.display_name || 'مشتری متفرقه',
        amount: d.grand_total,
        type: 'sale',
        date: d.document_date || d.created_at || new Date().toISOString(),
        status: d.status
      });
    });

    purchaseInvoices.forEach(d => {
      const party = db.queryById('parties', d.party_id) as any;
      recentTxList.push({
        id: d.id,
        code: d.document_number,
        title: 'فاکتور خرید کالا و خدمات',
        partyName: party?.display_name || 'تامین‌کننده متفرقه',
        amount: d.grand_total,
        type: 'purchase',
        date: d.document_date || d.created_at || new Date().toISOString(),
        status: d.status
      });
    });

    const receipts = db.queryByBusiness<any>('receipts', businessId).filter(r => r.status === 'confirmed');
    receipts.forEach(r => {
      const party = db.queryById('parties', r.party_id) as any;
      recentTxList.push({
        id: r.id,
        code: r.reference_number || 'دریافت نقدی',
        title: 'سند دریافت وجه خزانه',
        partyName: party?.name || 'مشتری متفرقه',
        amount: r.amount,
        type: 'receipt',
        date: r.created_at || new Date().toISOString(),
        status: 'completed'
      });
    });

    const payments = db.queryByBusiness<any>('payments', businessId).filter(p => p.status === 'confirmed');
    payments.forEach(p => {
      const party = db.queryById('parties', p.party_id) as any;
      recentTxList.push({
        id: p.id,
        code: p.reference_number || 'پرداخت نقدی',
        title: 'سند پرداخت وجه خزانه',
        partyName: party?.name || 'تامین‌کننده متفرقه',
        amount: p.amount,
        type: 'payment',
        date: p.created_at || new Date().toISOString(),
        status: 'completed'
      });
    });

    const recentTransactions = recentTxList
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    // 13. Daily cash flow (last 7 days)
    const transactions = TreasuryRepository.getTransactions(businessId);
    const last7Days: { name: string; income: number; expense: number }[] = [];
    const weekdayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const nowTemp = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const weekday = weekdayNames[d.getDay()];
      
      const dayTxs = transactions.filter(t => {
        const txDate = t.transaction_date || (t.created_at ? t.created_at.split('T')[0] : '');
        return txDate === dateStr;
      });

      const income = dayTxs.filter(t => t.transaction_type === 'IN').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxs.filter(t => t.transaction_type === 'OUT').reduce((sum, t) => sum + t.amount, 0);

      last7Days.push({
        name: weekday,
        income,
        expense
      });
    }

    return {
      salesToday,
      purchasesToday,
      totalCashBankBalance,
      accountsReceivable,
      accountsPayable,
      totalInventoryValueCost,
      totalInventoryValueSale,
      lowStockItems,
      upcomingChecks,
      upcomingCommitments,
      monthlyTrend,
      topProducts,
      recentTransactions,
      dailyFlow: last7Days
    };
  },

  getMonthlyProfitTrend(salesInvoices: any[], purchaseInvoices: any[]) {
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    
    // We group by Persian or Gregorian month. Let's do last 6 months grouping.
    const result: { month: string; revenue: number; expense: number; profit: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth(); // 0-indexed
      
      const label = `${monthNames[month % 12]} ${String(year).slice(-2)}`;
      
      // Filter invoices in this month
      const monthSales = salesInvoices.filter(invoice => {
        const idate = new Date(invoice.document_date);
        return idate.getFullYear() === year && idate.getMonth() === month;
      });

      const monthPurchases = purchaseInvoices.filter(invoice => {
        const idate = new Date(invoice.document_date);
        return idate.getFullYear() === year && idate.getMonth() === month;
      });

      const revenue = monthSales.reduce((sum, inv) => sum + (inv.grand_total || inv.total_amount || 0), 0);
      const expense = monthPurchases.reduce((sum, inv) => sum + (inv.grand_total || inv.total_amount || 0), 0);
      const profit = revenue - expense;

      result.push({
        month: label,
        revenue,
        expense,
        profit
      });
    }

    return result;
  },

  getTopSellingProducts(salesInvoices: any[], items: any[], balances: any[]) {
    // Collect document items from SQLite
    const docItems = db.queryAll<any>('document_items');
    const productSalesMap: Record<string, { qty: number; revenue: number }> = {};

    salesInvoices.forEach(inv => {
      const invItems = docItems.filter(di => di.document_id === inv.id);
      invItems.forEach(line => {
        if (!productSalesMap[line.item_id]) {
          productSalesMap[line.item_id] = { qty: 0, revenue: 0 };
        }
        productSalesMap[line.item_id].qty += Number(line.quantity) || 0;
        productSalesMap[line.item_id].revenue += Number(line.line_total || line.line_subtotal || (line.quantity * line.unit_price)) || 0;
      });
    });

    const list = Object.entries(productSalesMap).map(([itemId, stats]) => {
      const item = items.find(i => i.id === itemId);
      const itemBals = balances.filter(b => b.item_id === itemId);
      const stock = itemBals.reduce((sum, b) => sum + Number(b.quantity), 0);
      
      return {
        id: itemId,
        name: item?.name || 'کالای نامشخص',
        code: item?.code || 'PRD',
        qty: stats.qty,
        revenue: stats.revenue,
        stock,
        unit: item?.unit?.name || 'عدد'
      };
    });

    return list.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  },

  // ----------------------------------------------------
  // FULL ADVANCED BUSINESS INTELLIGENCE REPORTS
  // ----------------------------------------------------
  async getSalesReport(businessId: string, filters: any = {}) {
    const docs = await documentService.getDocuments(businessId);
    const itemsRes = await itemService.getItems(businessId);
    const items = itemsRes.data || [];
    const docLines = db.queryAll<any>('document_items');
    const parties = (await partyService.getParties(businessId)).data || [];
    const cogsEntries = db.queryAll<any>('cogs_entries');

    let sales = docs.filter(d => d.status === 'confirmed' && d.document_type === 'sales_invoice');

    // Date range filter
    if (filters.startDate) {
      sales = sales.filter(s => s.document_date >= filters.startDate);
    }
    if (filters.endDate) {
      sales = sales.filter(s => s.document_date <= filters.endDate);
    }
    if (filters.partyId && filters.partyId !== 'all') {
      sales = sales.filter(s => s.party_id === filters.partyId);
    }

    const totalSalesAmount = sales.reduce((sum, d) => sum + (d.grand_total || 0), 0);
    const invoiceCount = sales.length;
    const averageInvoiceValue = invoiceCount > 0 ? totalSalesAmount / invoiceCount : 0;

    // Helper to calculate COGS for an invoice or line
    const getInvoiceCOGS = (invoiceId: string) => {
      const realCogs = cogsEntries.filter(c => c.document_id === invoiceId).reduce((sum, c) => sum + Number(c.total_cost || 0), 0);
      if (realCogs > 0) return realCogs;

      // Fallback
      const lines = docLines.filter(line => line.document_id === invoiceId);
      return lines.reduce((sum, line) => {
        const item = items.find(i => i.id === line.item_id);
        const purchasePrice = item ? Number(item.purchase_price || 0) : 0;
        return sum + (Number(line.quantity || 0) * purchasePrice);
      }, 0);
    };

    // Calculate total COGS & Profits
    let totalCOGS = 0;
    const invoicesWithProfit = sales.map(s => {
      const p = parties.find(party => party.id === s.party_id);
      const cogs = getInvoiceCOGS(s.id);
      totalCOGS += cogs;
      const profit = (s.grand_total || 0) - cogs;
      const margin = (s.grand_total || 0) > 0 ? (profit / (s.grand_total || 0)) * 100 : 0;

      return {
        id: s.id,
        number: s.document_number,
        date: s.document_date,
        customerName: p?.display_name || 'مشتری متفرقه',
        amount: s.grand_total || 0,
        cogs,
        profit,
        margin
      };
    }).sort((a, b) => b.profit - a.profit);

    const grossProfit = totalSalesAmount - totalCOGS;
    const profitMargin = totalSalesAmount > 0 ? (grossProfit / totalSalesAmount) * 100 : 0;

    // Customer Breakdown
    const customerMap: Record<string, { total: number; count: number; cogs: number }> = {};
    sales.forEach(s => {
      if (!customerMap[s.party_id]) {
        customerMap[s.party_id] = { total: 0, count: 0, cogs: 0 };
      }
      customerMap[s.party_id].total += (s.grand_total || 0);
      customerMap[s.party_id].count += 1;
      customerMap[s.party_id].cogs += getInvoiceCOGS(s.id);
    });

    const customersBreakdown = Object.entries(customerMap).map(([id, stat]) => {
      const p = parties.find(party => party.id === id);
      const profit = stat.total - stat.cogs;
      const margin = stat.total > 0 ? (profit / stat.total) * 100 : 0;
      return {
        id,
        name: p?.display_name || 'مشتری متفرقه',
        total: stat.total,
        count: stat.count,
        avg: stat.total / stat.count,
        cogs: stat.cogs,
        profit,
        margin
      };
    }).sort((a, b) => b.profit - a.profit);

    // Product Breakdown
    const productMap: Record<string, { qty: number; total: number; cogs: number }> = {};
    sales.forEach(s => {
      const lines = docLines.filter(line => line.document_id === s.id);
      lines.forEach(line => {
        if (!productMap[line.item_id]) {
          productMap[line.item_id] = { qty: 0, total: 0, cogs: 0 };
        }
        productMap[line.item_id].qty += Number(line.quantity) || 0;
        
        const lineTotal = Number(line.line_total || (line.quantity * line.unit_price)) || 0;
        productMap[line.item_id].total += lineTotal;

        // Find product cogs line
        const cogsLine = cogsEntries.find(c => c.document_id === s.id && c.item_id === line.item_id);
        if (cogsLine) {
          productMap[line.item_id].cogs += Number(cogsLine.total_cost || 0);
        } else {
          // Fallback
          const item = items.find(i => i.id === line.item_id);
          const purchasePrice = item ? Number(item.purchase_price || 0) : 0;
          productMap[line.item_id].cogs += (Number(line.quantity || 0) * purchasePrice);
        }
      });
    });

    const productsBreakdown = Object.entries(productMap).map(([id, stat]) => {
      const item = items.find(i => i.id === id);
      const profit = stat.total - stat.cogs;
      const margin = stat.total > 0 ? (profit / stat.total) * 100 : 0;
      return {
        id,
        name: item?.name || 'کالای نامشخص',
        code: item?.code || 'PRD',
        qty: stat.qty,
        total: stat.total,
        cogs: stat.cogs,
        profit,
        margin,
        unit: item?.unit?.name || 'عدد'
      };
    }).sort((a, b) => b.profit - a.profit);

    // Sales by Category
    const categoryMap: Record<string, { total: number; cogs: number }> = {};
    productsBreakdown.forEach(prod => {
      const item = items.find(i => i.id === prod.id);
      const catName = item?.category?.name || 'دسته‌بندی نشده';
      if (!categoryMap[catName]) {
        categoryMap[catName] = { total: 0, cogs: 0 };
      }
      categoryMap[catName].total += prod.total;
      categoryMap[catName].cogs += prod.cogs;
    });

    const categoriesBreakdown = Object.entries(categoryMap).map(([name, stat]) => {
      const profit = stat.total - stat.cogs;
      const margin = stat.total > 0 ? (profit / stat.total) * 100 : 0;
      return {
        name,
        total: stat.total,
        cogs: stat.cogs,
        profit,
        margin
      };
    }).sort((a, b) => b.profit - a.profit);

    // Daily Sales chart
    const dailyMap: Record<string, number> = {};
    sales.forEach(s => {
      const date = s.document_date.split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + (s.grand_total || 0);
    });

    const dailySales = Object.entries(dailyMap).map(([date, total]) => ({
      date,
      total
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-15); // Last 15 days

    return {
      totalSalesAmount,
      invoiceCount,
      averageInvoiceValue,
      totalCOGS,
      grossProfit,
      profitMargin,
      invoicesWithProfit,
      customersBreakdown,
      productsBreakdown,
      categoriesBreakdown,
      dailySales
    };
  },

  async getPurchaseReport(businessId: string, filters: any = {}) {
    const docs = await documentService.getDocuments(businessId);
    const itemsRes = await itemService.getItems(businessId);
    const items = itemsRes.data || [];
    const docLines = db.queryAll<any>('document_items');
    const parties = (await partyService.getParties(businessId)).data || [];

    let purchases = docs.filter(d => d.status === 'confirmed' && d.document_type === 'purchase_invoice');

    if (filters.startDate) {
      purchases = purchases.filter(p => p.document_date >= filters.startDate);
    }
    if (filters.endDate) {
      purchases = purchases.filter(p => p.document_date <= filters.endDate);
    }
    if (filters.partyId && filters.partyId !== 'all') {
      purchases = purchases.filter(p => p.party_id === filters.partyId);
    }

    const totalPurchasesAmount = purchases.reduce((sum, d) => sum + (d.grand_total || 0), 0);
    const invoiceCount = purchases.length;

    // Supplier Breakdown
    const supplierMap: Record<string, { total: number; count: number }> = {};
    purchases.forEach(p => {
      if (!supplierMap[p.party_id]) {
        supplierMap[p.party_id] = { total: 0, count: 0 };
      }
      supplierMap[p.party_id].total += (p.grand_total || 0);
      supplierMap[p.party_id].count += 1;
    });

    const suppliersBreakdown = Object.entries(supplierMap).map(([id, stat]) => {
      const s = parties.find(party => party.id === id);
      return {
        id,
        name: s?.display_name || 'تامین‌کننده متفرقه',
        total: stat.total,
        count: stat.count,
        avg: stat.total / stat.count
      };
    }).sort((a, b) => b.total - a.total);

    // Product Purchases
    const productMap: Record<string, { qty: number; total: number }> = {};
    purchases.forEach(p => {
      const lines = docLines.filter(line => line.document_id === p.id);
      lines.forEach(line => {
        if (!productMap[line.item_id]) {
          productMap[line.item_id] = { qty: 0, total: 0 };
        }
        productMap[line.item_id].qty += Number(line.quantity) || 0;
        productMap[line.item_id].total += Number(line.line_total || (line.quantity * line.unit_price)) || 0;
      });
    });

    const productsBreakdown = Object.entries(productMap).map(([id, stat]) => {
      const item = items.find(i => i.id === id);
      return {
        id,
        name: item?.name || 'کالای نامشخص',
        code: item?.code || 'PRD',
        qty: stat.qty,
        total: stat.total,
        unit: item?.unit?.name || 'عدد'
      };
    }).sort((a, b) => b.total - a.total);

    // Daily Purchases
    const dailyMap: Record<string, number> = {};
    purchases.forEach(p => {
      const date = p.document_date.split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + (p.grand_total || 0);
    });

    const dailyPurchases = Object.entries(dailyMap).map(([date, total]) => ({
      date,
      total
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-15);

    return {
      totalPurchasesAmount,
      invoiceCount,
      suppliersBreakdown,
      productsBreakdown,
      dailyPurchases
    };
  },

  async getCustomerReport(businessId: string) {
    const docs = await documentService.getDocuments(businessId);
    const parties = (await partyService.getParties(businessId)).data || [];
    const payments = db.queryByBusiness<any>('receipts', businessId).filter(r => r.status === 'confirmed');

    // Filter to customers only
    const customers = parties.filter(p => p.roles?.includes('customer'));

    return customers.map(cust => {
      const custInvoices = docs.filter(d => d.party_id === cust.id && d.status === 'confirmed' && d.document_type === 'sales_invoice');
      const custPayments = payments.filter(p => p.party_id === cust.id);

      const totalPurchases = custInvoices.reduce((sum, d) => sum + (d.grand_total || 0), 0);
      const totalPayments = custPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalPurchases - totalPayments; // Remaining debt

      const lastInvoice = custInvoices.length > 0 
        ? custInvoices.sort((a, b) => b.document_date.localeCompare(a.document_date))[0].document_date.split('T')[0]
        : 'بدون معامله';

      let clvGroup: 'premium' | 'loyal' | 'regular' | 'inactive' = 'regular';
      if (totalPurchases > 100000000) {
        clvGroup = 'premium';
      } else if (totalPurchases > 40000000) {
        clvGroup = 'loyal';
      } else if (totalPurchases === 0) {
        clvGroup = 'inactive';
      }

      return {
        id: cust.id,
        name: cust.display_name,
        phone: cust.phone || cust.mobile || 'بدون تلفن',
        totalPurchases,
        totalPayments,
        balance,
        lastInvoice,
        clvGroup,
        invoiceCount: custInvoices.length
      };
    }).sort((a, b) => b.totalPurchases - a.totalPurchases);
  },

  async getSupplierReport(businessId: string) {
    const docs = await documentService.getDocuments(businessId);
    const parties = (await partyService.getParties(businessId)).data || [];
    const payments = db.queryByBusiness<any>('payments', businessId).filter(p => p.status === 'confirmed');

    const suppliers = parties.filter(p => p.roles?.includes('supplier'));

    return suppliers.map(supp => {
      const suppInvoices = docs.filter(d => d.party_id === supp.id && d.status === 'confirmed' && d.document_type === 'purchase_invoice');
      const suppPayments = payments.filter(p => p.party_id === supp.id);

      const totalPurchases = suppInvoices.reduce((sum, d) => sum + (d.grand_total || 0), 0);
      const totalPayments = suppPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalPurchases - totalPayments;

      const lastInvoice = suppInvoices.length > 0 
        ? suppInvoices.sort((a, b) => b.document_date.localeCompare(a.document_date))[0].document_date.split('T')[0]
        : 'بدون معامله';

      return {
        id: supp.id,
        name: supp.display_name,
        phone: supp.phone || supp.mobile || 'بدون تلفن',
        totalPurchases,
        totalPayments,
        balance,
        lastInvoice,
        invoiceCount: suppInvoices.length
      };
    }).sort((a, b) => b.totalPurchases - a.totalPurchases);
  },

  async getInventoryReport(businessId: string) {
    const itemsRes = await itemService.getItems(businessId);
    const items = itemsRes.data || [];
    const balances = InventoryRepository.getBalances();
    const docLines = db.queryAll<any>('document_items');
    const docs = await documentService.getDocuments(businessId);

    // Group sales and purchases by item_id
    const salesInvoices = docs.filter(d => d.status === 'confirmed' && d.document_type === 'sales_invoice');
    const productSalesQty: Record<string, number> = {};

    salesInvoices.forEach(inv => {
      const invLines = docLines.filter(di => di.document_id === inv.id);
      invLines.forEach(line => {
        productSalesQty[line.item_id] = (productSalesQty[line.item_id] || 0) + (Number(line.quantity) || 0);
      });
    });

    const report = items.map(item => {
      const itemBals = balances.filter(b => b.item_id === item.id);
      const totalQty = itemBals.reduce((sum, b) => sum + Number(b.quantity), 0);
      
      // Calculate exact real valuation based on active costing layers
      const costValuation = CostEngine.getProductValuation(businessId, item.id);
      const totalCostValue = costValuation.value;
      const totalSaleValue = totalQty * (Number(item.default_sale_price) || 0);

      const salesVolume30Days = productSalesQty[item.id] || 0;
      let turnoverSpeed: 'fast' | 'normal' | 'slow' | 'dead' = 'normal';

      if (salesVolume30Days > 30) {
        turnoverSpeed = 'fast';
      } else if (salesVolume30Days === 0 && totalQty > 0) {
        turnoverSpeed = 'dead';
      } else if (salesVolume30Days < 5 && totalQty > 0) {
        turnoverSpeed = 'slow';
      }

      return {
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category?.name || 'دسته‌بندی نشده',
        qty: totalQty,
        purchasePrice: item.purchase_price,
        salePrice: item.default_sale_price,
        costValue: totalCostValue,
        saleValue: totalSaleValue,
        salesVolume30Days,
        turnoverSpeed,
        unit: item.unit?.name || 'عدد'
      };
    });

    const totalInventoryCost = report.reduce((sum, r) => sum + r.costValue, 0);
    const totalInventorySale = report.reduce((sum, r) => sum + r.saleValue, 0);

    return {
      items: report,
      totalInventoryCost,
      totalInventorySale
    };
  },

  async getTreasuryReport(businessId: string) {
    const cashAccounts = TreasuryRepository.getAccounts(businessId);
    const checks = CheckRepository.getAll(businessId);
    const transactions = TreasuryRepository.getTransactions(businessId);

    const totalBalance = cashAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

    // Group transactions by date for flow chart
    const flowMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach(t => {
      const date = t.transaction_date || (t.created_at ? t.created_at.split('T')[0] : '');
      if (!date) return;

      if (!flowMap[date]) {
        flowMap[date] = { income: 0, expense: 0 };
      }

      if (t.transaction_type === 'IN') {
        flowMap[date].income += t.amount;
      } else if (t.transaction_type === 'OUT') {
        flowMap[date].expense += t.amount;
      }
    });

    const dailyFlow = Object.entries(flowMap).map(([date, flows]) => ({
      date,
      income: flows.income,
      expense: flows.expense,
      net: flows.income - flows.expense
    })).sort((a, b) => a.date.localeCompare(b.date)).slice(-15);

    // Checks breakdown
    const pendingChecksReceived = checks.filter(c => c.type === 'received' && c.status === 'pending');
    const pendingChecksIssued = checks.filter(c => c.type === 'issued' && c.status === 'pending');

    const totalChecksReceivedAmount = pendingChecksReceived.reduce((sum, c) => sum + c.amount, 0);
    const totalChecksIssuedAmount = pendingChecksIssued.reduce((sum, c) => sum + c.amount, 0);

    return {
      cashAccounts,
      totalBalance,
      dailyFlow,
      pendingChecksReceived,
      pendingChecksIssued,
      totalChecksReceivedAmount,
      totalChecksIssuedAmount
    };
  }
};
