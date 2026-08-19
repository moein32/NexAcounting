import { db } from '../lib/sqlite';
import { AccountingEngine } from './accountingEngine';
import { Party } from '../types/party';
import { Item } from '../types/catalog';
import { Document, DocumentItem } from '../types/document';

export interface DemoSummary {
  business_name: string;
  session_id: string;
  customers_count: number;
  suppliers_count: number;
  categories_count: number;
  warehouses_count: number;
  products_count: number;
  services_count: number;
  sales_invoices_count: number;
  purchase_invoices_count: number;
  journal_entries_count: number;
  checks_count: number;
}

export const demoDataService = {
  /**
   * Generates comprehensive, realistic demo data for NexAccounting
   * Tagged with demo_session_id and is_demo: 1
   */
  async createDemoData(targetBusinessId?: string): Promise<{ success: boolean; session_id: string; summary: DemoSummary }> {
    const sessionId = 'demo_session_' + Date.now().toString(36);
    const businessId = targetBusinessId || 'biz_main';
    const now = new Date();

    db.beginTransaction();
    try {
      // 1. Ensure Target Business
      let business = db.queryAll<any>('businesses').find((b) => b.id === businessId);
      if (!business) {
        business = db.insertRecord('businesses', {
          id: businessId,
          name: 'فروشگاه تست نکس‌جیب (NexJib)',
          code: 'NX-DEMO',
          currency: 'تومان',
          fiscal_year: '۱۴۰۳',
          is_active: true,
          is_demo: 1,
          demo_session_id: sessionId,
        });
      }

      // 2. Roles & Users Architecture Demo
      const rolesData = [
        { id: 'role_owner', name: 'Owner (مالک)', is_demo: 1, demo_session_id: sessionId },
        { id: 'role_admin', name: 'Admin (مدیر سیستم)', is_demo: 1, demo_session_id: sessionId },
        { id: 'role_accountant', name: 'Accountant (حسابدار)', is_demo: 1, demo_session_id: sessionId },
        { id: 'role_employee', name: 'Employee (کارمند)', is_demo: 1, demo_session_id: sessionId },
      ];

      // 3. Create 10 Customers & 10 Suppliers
      const customerNames = [
        'شرکت پتروشیمی آریا پارس',
        'صنایع فولاد البرز',
        'بازرگانی توسعه تجارت آراد',
        'فروشگاه لوازم خانگی قائم',
        'شرکت پخش سراسری نیکان',
        'مهندس علی محمدی',
        'خانم مریم حسینی',
        'شرکت تولیدی پارس صنعت',
        'فروشگاه تک نوین',
        'بازرگانی بین‌المللی آریا',
      ];

      const supplierNames = [
        'صنایع فولاد کاوه',
        'تامین مواد اولیه جم',
        'بازرگانی پلاستیک پارس',
        'شرکت چوب و کاغذ خزر',
        'کارخانجات تولیدی صبا',
        'بازرگانی فلزات ایران',
        'شرکت واردات ابزار دقیق',
        'صنایع شیمیایی البرز',
        'پارس تکنولوژی نیکو',
        'تامین تجهیزات نیرو',
      ];

      const createdParties: Party[] = [];

      customerNames.forEach((name, i) => {
        const party = db.insertRecord<Party>('parties', {
          business_id: businessId,
          party_type: i % 2 === 0 ? 'company' : 'individual',
          display_name: name,
          company_name: i % 2 === 0 ? name : null,
          phone: `02188${100000 + i}`,
          mobile: `0912${1000000 + i * 111}`,
          economic_code: `411345${1000 + i}`,
          national_id: `1010${100000 + i}`,
          address: `تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ${10 + i}`,
          is_active: true,
          is_demo: 1,
          demo_session_id: sessionId,
          roles: ['customer'],
          credit_limit: (i + 1) * 50000000,
          opening_balance: (i + 1) * 2000000,
          opening_balance_type: 'debit',
        });
        createdParties.push(party);
      });

      supplierNames.forEach((name, i) => {
        const party = db.insertRecord<Party>('parties', {
          business_id: businessId,
          party_type: 'company',
          display_name: name,
          company_name: name,
          phone: `02166${200000 + i}`,
          mobile: `0912${2000000 + i * 222}`,
          economic_code: `411987${2000 + i}`,
          national_id: `1020${200000 + i}`,
          address: `اصفهان، شهرک صنعتی جی، خیابان دهم، پلاک ${20 + i}`,
          is_active: true,
          is_demo: 1,
          demo_session_id: sessionId,
          roles: ['supplier'],
          credit_limit: (i + 1) * 100000000,
          opening_balance: (i + 1) * 5000000,
          opening_balance_type: 'credit',
        });
        createdParties.push(party);
      });

      // 4. Categories (5 Categories)
      const categoriesData = [
        { id: 'cat_demo_1', name: 'کالای دیجیتال و الکترونیک', is_active: true, is_demo: 1, demo_session_id: sessionId },
        { id: 'cat_demo_2', name: 'لوازم خانگی و اداری', is_active: true, is_demo: 1, demo_session_id: sessionId },
        { id: 'cat_demo_3', name: 'پوشاک و ملزومات', is_active: true, is_demo: 1, demo_session_id: sessionId },
        { id: 'cat_demo_4', name: 'مواد غذایی و مصرفی', is_active: true, is_demo: 1, demo_session_id: sessionId },
        { id: 'cat_demo_5', name: 'خدمات و پشتیبانی فنی', is_active: true, is_demo: 1, demo_session_id: sessionId },
      ];

      categoriesData.forEach((cat) => {
        const existing = db.queryAll<any>('categories').find((c) => c.id === cat.id);
        if (!existing) {
          db.insertRecord('categories', { ...cat, business_id: businessId });
        }
      });

      // 5. Warehouses (3 Warehouses)
      const warehousesData = [
        { id: 'wh_demo_main', name: 'انبار مرکزی (اصلی)', code: 'WH-01', address: 'تهران، جاده قدیم کرج، سوله شماره ۱', is_active: true, is_demo: 1, demo_session_id: sessionId },
        { id: 'wh_demo_secondary', name: 'انبار فرعی و توزیع', code: 'WH-02', address: 'تهران، خیابان شوش، پلاک ۴۵', is_active: true, is_demo: 1, demo_session_id: sessionId },
        { id: 'wh_demo_empty', name: 'انبار راکد (خالی)', code: 'WH-03', address: 'کرج، شهرک صنعتی بهارستان', is_active: true, is_demo: 1, demo_session_id: sessionId },
      ];

      warehousesData.forEach((wh) => {
        const existing = db.queryAll<any>('warehouses').find((w) => w.id === wh.id);
        if (!existing) {
          db.insertRecord('warehouses', { ...wh, business_id: businessId });
        }
      });

      // 6. Units
      const defaultUnits = [
        { id: 'unit_number', name: 'عدد', symbol: 'عدد' },
        { id: 'unit_kg', name: 'کیلوگرم', symbol: 'kg' },
        { id: 'unit_carton', name: 'کارتُن', symbol: 'ctn' },
        { id: 'unit_meter', name: 'متر', symbol: 'm' },
        { id: 'unit_pack', name: 'بسته', symbol: 'pkg' },
      ];
      defaultUnits.forEach((u) => {
        const existing = db.queryAll<any>('units').find((un) => un.id === u.id);
        if (!existing) {
          db.insertRecord('units', { ...u, business_id: businessId, is_active: true });
        }
      });

      // 7. 30 Products & 10 Services
      const createdItems: Item[] = [];

      // 30 Products
      for (let i = 1; i <= 30; i++) {
        const catId = i <= 10 ? 'cat_demo_1' : i <= 20 ? 'cat_demo_2' : i <= 25 ? 'cat_demo_3' : 'cat_demo_4';
        const buyPrice = i * 250000;
        const sellPrice = Math.round(buyPrice * 1.35);

        const item = db.insertRecord<Item>('items', {
          business_id: businessId,
          item_type: 'product',
          name: `کالای نمونه شماره ${i} (${i <= 10 ? 'مانیتور / لپ‌تاپ' : i <= 20 ? 'لوازم اداری' : 'پوشاک و تجهیزات'})`,
          code: `PRD-${1000 + i}`,
          sku: `SKU-${2000 + i}`,
          barcode: `62600${10000 + i}`,
          category_id: catId,
          unit_id: i % 5 === 0 ? 'unit_carton' : i % 3 === 0 ? 'unit_kg' : 'unit_number',
          description: `توضیحات و مشخصات فنی کامل کالای نمونه ${i}`,
          purchase_price: buyPrice,
          default_sale_price: sellPrice,
          tax_rate: 10,
          min_stock: 5,
          max_stock: 200,
          track_inventory: true,
          is_active: true,
          is_demo: 1,
          demo_session_id: sessionId,
        });
        createdItems.push(item);

        // Inventory balance in Main Warehouse
        db.insertRecord('inventory_balances', {
          business_id: businessId,
          item_id: item.id,
          warehouse_id: 'wh_demo_main',
          quantity: i * 10,
          average_cost: buyPrice,
          is_demo: 1,
          demo_session_id: sessionId,
        });
      }

      // 10 Services
      const serviceTitles = [
        'خدمات نصب و راه‌اندازی تجهیزات',
        'سرویس و نگهداری دوره‌ای',
        'مشاوره مالی و مالیاتی تخصصی',
        'طراحی و توسعه نرم‌افزار اختصاصی',
        'خدمات پشتیبانی شبکه و سرور',
        'انبارداری و بسته‌بندی صادراتی',
        'خدمات حمل و نقل شهری و بین شهری',
        'آموزش تخصصی کاربری نرم‌افزار',
        'کالیبراسیون و تست ابزار دقیق',
        'خدمات گارانتی و تعویض قطعات',
      ];

      serviceTitles.forEach((title, i) => {
        const service = db.insertRecord<Item>('items', {
          business_id: businessId,
          item_type: 'service',
          name: title,
          code: `SRV-${100 + i}`,
          category_id: 'cat_demo_5',
          unit_id: 'unit_number',
          description: `توضیحات مربوط به ${title}`,
          purchase_price: 0,
          default_sale_price: (i + 1) * 1500000,
          tax_rate: 10,
          track_inventory: false,
          is_active: true,
          is_demo: 1,
          demo_session_id: sessionId,
        });
        createdItems.push(service);
      });

      // 8. Cash Accounts / Banks
      const cashAccounts = [
        { id: 'cash_demo_main', name: 'صندوق مرکزی شرکت', account_type: 'cash', balance: 50000000, is_demo: 1, demo_session_id: sessionId },
        { id: 'bank_demo_melli', name: 'بانک ملی - حساب جاری ۱234', account_type: 'bank', balance: 250000000, is_demo: 1, demo_session_id: sessionId },
        { id: 'pos_demo_store', name: 'کارتخوان فروشگاهی (سامان)', account_type: 'pos', balance: 18000000, is_demo: 1, demo_session_id: sessionId },
      ];
      cashAccounts.forEach((c) => {
        const existing = db.queryAll<any>('cash_accounts').find((ca) => ca.id === c.id);
        if (!existing) {
          db.insertRecord('cash_accounts', { ...c, business_id: businessId });
        }
      });

      // 9. Sales Workflows (Quotations, Orders, Confirmed Invoices with COGS & Accounting)
      const customers = createdParties.filter((p) => p.roles?.includes('customer'));
      const suppliers = createdParties.filter((p) => p.roles?.includes('supplier'));
      const products = createdItems.filter((it) => it.item_type === 'product');

      // 5 Sales Quotations
      for (let i = 1; i <= 5; i++) {
        const party = customers[i % customers.length];
        db.insertRecord<Document>('documents', {
          business_id: businessId,
          document_type: 'sales_quote',
          document_number: `SQ-1000${i}`,
          party_id: party.id,
          warehouse_id: 'wh_demo_main',
          document_date: new Date(now.getTime() - i * 86400000).toISOString(),
          status: 'draft',
          payment_status: 'not_applicable',
          currency: 'تومان',
          notes: 'پیش‌فاکتور فروش با اعتبار ۷ روزه',
          subtotal: 10000000 * i,
          discount_total: 500000 * i,
          tax_total: 950000 * i,
          shipping_total: 200000,
          grand_total: 10650000 * i,
          is_demo: 1,
          demo_session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 5 Sales Orders
      for (let i = 1; i <= 5; i++) {
        const party = customers[(i + 2) % customers.length];
        db.insertRecord<Document>('documents', {
          business_id: businessId,
          document_type: 'sales_order',
          document_number: `SO-1000${i}`,
          party_id: party.id,
          warehouse_id: 'wh_demo_main',
          document_date: new Date(now.getTime() - (i + 2) * 86400000).toISOString(),
          status: 'confirmed',
          payment_status: 'unpaid',
          currency: 'تومان',
          notes: 'سفارش فروش تایید شده - در حال آماده‌سازی انبار',
          subtotal: 15000000 * i,
          discount_total: 0,
          tax_total: 1500000 * i,
          shipping_total: 300000,
          grand_total: 16800000 * i,
          is_demo: 1,
          demo_session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // 10 Sales Invoices Confirmed
      for (let i = 1; i <= 10; i++) {
        const party = customers[i % customers.length];
        const item = products[i % products.length];
        const qty = 2;
        const unitPrice = item.default_sale_price || 1000000;
        const lineSubtotal = qty * unitPrice;
        const tax = lineSubtotal * 0.1;
        const grandTotal = lineSubtotal + tax;

        const doc = db.insertRecord<Document>('documents', {
          business_id: businessId,
          document_type: 'sales_invoice',
          document_number: `SI-2000${i}`,
          party_id: party.id,
          warehouse_id: 'wh_demo_main',
          document_date: new Date(now.getTime() - i * 2 * 86400000).toISOString(),
          status: 'confirmed',
          payment_status: i % 2 === 0 ? 'paid' : 'partially_paid',
          currency: 'تومان',
          notes: 'فاکتور فروش قطعی تحویل مشتری',
          subtotal: lineSubtotal,
          discount_total: 0,
          tax_total: tax,
          shipping_total: 0,
          grand_total: grandTotal,
          is_demo: 1,
          demo_session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Document item
        db.insertRecord<DocumentItem>('document_items', {
          document_id: doc.id,
          item_id: item.id,
          quantity: qty,
          unit_price: unitPrice,
          discount_percent: 0,
          discount_amount: 0,
          tax_percent: 10,
          tax_amount: tax,
          line_subtotal: lineSubtotal,
          line_total: grandTotal,
          is_demo: 1,
          demo_session_id: sessionId,
        });

        // Inventory movement (deduction)
        db.insertRecord('inventory_transactions', {
          business_id: businessId,
          item_id: item.id,
          warehouse_id: 'wh_demo_main',
          document_id: doc.id,
          transaction_type: 'sales_issue',
          quantity: -qty,
          unit_cost: item.purchase_price || 500000,
          total_cost: qty * (item.purchase_price || 500000),
          is_demo: 1,
          demo_session_id: sessionId,
        });

        // Auto post Accounting Journal Entry via AccountingEngine
        try {
          AccountingEngine.postSalesInvoice(businessId, {
            id: doc.id,
            date: doc.document_date.split('T')[0],
            party_id: party.id,
            grand_total: grandTotal,
            is_cash: false,
            number: doc.document_number,
          });
        } catch {
          // If default chart of accounts is missing or custom, fallback gracefully
        }
      }

      // 10 Purchase Invoices Confirmed
      for (let i = 1; i <= 10; i++) {
        const party = suppliers[i % suppliers.length];
        const item = products[(i + 3) % products.length];
        const qty = 20;
        const unitPrice = item.purchase_price || 500000;
        const lineSubtotal = qty * unitPrice;
        const tax = lineSubtotal * 0.1;
        const grandTotal = lineSubtotal + tax;

        const doc = db.insertRecord<Document>('documents', {
          business_id: businessId,
          document_type: 'purchase_invoice',
          document_number: `PI-3000${i}`,
          party_id: party.id,
          warehouse_id: 'wh_demo_main',
          document_date: new Date(now.getTime() - (i * 3) * 86400000).toISOString(),
          status: 'confirmed',
          payment_status: 'paid',
          currency: 'تومان',
          notes: 'فاکتور خرید کالا از تامین‌کننده اصلی',
          subtotal: lineSubtotal,
          discount_total: 0,
          tax_total: tax,
          shipping_total: 0,
          grand_total: grandTotal,
          is_demo: 1,
          demo_session_id: sessionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Document item
        db.insertRecord<DocumentItem>('document_items', {
          document_id: doc.id,
          item_id: item.id,
          quantity: qty,
          unit_price: unitPrice,
          discount_percent: 0,
          discount_amount: 0,
          tax_percent: 10,
          tax_amount: tax,
          line_subtotal: lineSubtotal,
          line_total: grandTotal,
          is_demo: 1,
          demo_session_id: sessionId,
        });

        // Inventory Cost Layer Creation
        db.insertRecord('inventory_cost_layers', {
          business_id: businessId,
          item_id: item.id,
          warehouse_id: 'wh_demo_main',
          purchase_document_id: doc.id,
          initial_quantity: qty,
          remaining_quantity: qty,
          unit_cost: unitPrice,
          is_demo: 1,
          demo_session_id: sessionId,
        });

        // Inventory movement (increase)
        db.insertRecord('inventory_transactions', {
          business_id: businessId,
          item_id: item.id,
          warehouse_id: 'wh_demo_main',
          document_id: doc.id,
          transaction_type: 'purchase_receipt',
          quantity: qty,
          unit_cost: unitPrice,
          total_cost: lineSubtotal,
          is_demo: 1,
          demo_session_id: sessionId,
        });

        // Auto Post Accounting Entry
        try {
          AccountingEngine.postPurchaseInvoice(businessId, {
            id: doc.id,
            date: doc.document_date.split('T')[0],
            party_id: party.id,
            grand_total: grandTotal,
            is_cash: false,
            number: doc.document_number,
          });
        } catch {
          // Graceful fallback
        }
      }

      // 10. Inventory Operations (Stock Transfer & Stock Count Adjustment)
      // Stock Transfer
      db.insertRecord('inventory_transactions', {
        business_id: businessId,
        item_id: products[0].id,
        warehouse_id: 'wh_demo_main',
        transaction_type: 'transfer_out',
        quantity: -5,
        unit_cost: products[0].purchase_price || 500000,
        total_cost: 5 * (products[0].purchase_price || 500000),
        notes: 'انتقال کالا از انبار مرکزی به انبار فرعی',
        is_demo: 1,
        demo_session_id: sessionId,
      });

      db.insertRecord('inventory_transactions', {
        business_id: businessId,
        item_id: products[0].id,
        warehouse_id: 'wh_demo_secondary',
        transaction_type: 'transfer_in',
        quantity: 5,
        unit_cost: products[0].purchase_price || 500000,
        total_cost: 5 * (products[0].purchase_price || 500000),
        notes: 'دریافت انتقال از انبار مرکزی',
        is_demo: 1,
        demo_session_id: sessionId,
      });

      // Stock Count Adjustment ( کسری انبار / اضافه انبار)
      db.insertRecord('inventory_transactions', {
        business_id: businessId,
        item_id: products[1].id,
        warehouse_id: 'wh_demo_main',
        transaction_type: 'count_adjustment',
        quantity: -1,
        unit_cost: products[1].purchase_price || 500000,
        total_cost: products[1].purchase_price || 500000,
        notes: 'انبارگردانی پایان دوره - تعدیل کسری انبار',
        is_demo: 1,
        demo_session_id: sessionId,
      });

      // 11. Treasury Transactions & Checks
      // Receipts
      for (let i = 1; i <= 5; i++) {
        const party = customers[i % customers.length];
        db.insertRecord('receipts', {
          business_id: businessId,
          receipt_number: `REC-100${i}`,
          party_id: party.id,
          cash_account_id: 'cash_demo_main',
          amount: i * 5000000,
          date: new Date(now.getTime() - i * 86400000).toISOString(),
          payment_method: i % 2 === 0 ? 'pos' : 'cash',
          description: `دریافت بابت تسویه فاکتور فروش شماره ${i}`,
          is_demo: 1,
          demo_session_id: sessionId,
        });
      }

      // Payments
      for (let i = 1; i <= 5; i++) {
        const party = suppliers[i % suppliers.length];
        db.insertRecord('payments', {
          business_id: businessId,
          payment_number: `PAY-200${i}`,
          party_id: party.id,
          cash_account_id: 'bank_demo_melli',
          amount: i * 8000000,
          date: new Date(now.getTime() - i * 2 * 86400000).toISOString(),
          payment_method: 'bank_transfer',
          description: `پرداخت به تامین‌کننده بابت فاکتور خرید ${i}`,
          is_demo: 1,
          demo_session_id: sessionId,
        });
      }

      // Received Checks (چک‌های دریافتی)
      const checkStatuses: ('received' | 'deposited' | 'cleared' | 'bounced')[] = ['received', 'deposited', 'cleared', 'bounced'];
      for (let i = 1; i <= 4; i++) {
        const party = customers[i % customers.length];
        db.insertRecord('checks', {
          business_id: businessId,
          check_type: 'received',
          check_number: `CHK-RCV-${8000 + i}`,
          party_id: party.id,
          bank_name: 'بانک صادرات',
          branch_name: 'شعبه مرکزی',
          account_number: `603799${1000 + i}`,
          amount: i * 12000000,
          due_date: new Date(now.getTime() + (i * 10) * 86400000).toISOString(),
          issue_date: new Date(now.getTime() - (i * 2) * 86400000).toISOString(),
          status: checkStatuses[i - 1],
          notes: 'چک دریافتی مشتری بابت تسویه حساب',
          is_demo: 1,
          demo_session_id: sessionId,
        });
      }

      // Issued Checks (چک‌های پرداختی)
      for (let i = 1; i <= 3; i++) {
        const party = suppliers[i % suppliers.length];
        db.insertRecord('checks', {
          business_id: businessId,
          check_type: 'issued',
          check_number: `CHK-ISS-${9000 + i}`,
          party_id: party.id,
          bank_name: 'بانک ملی ایران',
          branch_name: 'شعبه ونک',
          account_number: '0102030405',
          amount: i * 15000000,
          due_date: new Date(now.getTime() + (i * 7) * 86400000).toISOString(),
          issue_date: new Date(now.getTime() - i * 86400000).toISOString(),
          status: i === 1 ? 'registered' : 'cleared',
          notes: 'چک صادر شده برای تامین‌کننده',
          is_demo: 1,
          demo_session_id: sessionId,
        });
      }

      db.commit();

      const summary: DemoSummary = {
        business_name: business.name,
        session_id: sessionId,
        customers_count: 10,
        suppliers_count: 10,
        categories_count: 5,
        warehouses_count: 3,
        products_count: 30,
        services_count: 10,
        sales_invoices_count: 10,
        purchase_invoices_count: 10,
        journal_entries_count: db.queryByBusiness<any>('journal_entries', businessId).length,
        checks_count: 7,
      };

      return { success: true, session_id: sessionId, summary };
    } catch (error) {
      db.rollback();
      console.error('Failed to generate demo data:', error);
      throw error;
    }
  },

  /**
   * Resets all demo data across SQLite tables without affecting user's real data
   */
  async resetDemoData(businessId?: string): Promise<{ success: boolean; deletedCount: number }> {
    db.beginTransaction();
    try {
      let deletedCount = 0;
      const state = db.getState();

      const demoTables: (keyof typeof state)[] = [
        'documents',
        'document_items',
        'inventory_transactions',
        'inventory_cost_layers',
        'inventory_cost_movements',
        'cogs_entries',
        'journal_entries',
        'journal_lines',
        'receipts',
        'payments',
        'checks',
        'parties',
        'items',
        'categories',
        'warehouses',
        'inventory_balances',
      ];

      demoTables.forEach((table) => {
        const rows = state[table] as any[];
        if (rows && rows.length > 0) {
          const initialLen = rows.length;
          const filtered = rows.filter((r) => {
            if (businessId && r.business_id && r.business_id !== businessId) return true;
            return !(r.is_demo === 1 || (r.demo_session_id && String(r.demo_session_id).startsWith('demo_session_')));
          });
          deletedCount += initialLen - filtered.length;
          (state[table] as any[]) = filtered;
        }
      });

      db.restoreState(state);
      db.commit();
      return { success: true, deletedCount };
    } catch (error) {
      db.rollback();
      console.error('Failed to reset demo data:', error);
      throw error;
    }
  },

  /**
   * Clears all transactional data for a business (2-step confirmed)
   */
  async clearBusinessData(businessId: string): Promise<{ success: boolean; clearedTablesCount: number }> {
    db.beginTransaction();
    try {
      const state = db.getState();
      const transactionalTables: (keyof typeof state)[] = [
        'documents',
        'document_items',
        'inventory_transactions',
        'inventory_cost_layers',
        'inventory_cost_movements',
        'cogs_entries',
        'journal_entries',
        'journal_lines',
        'receipts',
        'payments',
        'checks',
        'inventory_balances',
        'audit_logs',
        'notifications',
      ];

      let clearedTablesCount = 0;
      transactionalTables.forEach((table) => {
        const rows = state[table] as any[];
        if (rows) {
          (state[table] as any[]) = rows.filter((r) => r.business_id !== businessId);
          clearedTablesCount++;
        }
      });

      db.restoreState(state);
      db.commit();
      return { success: true, clearedTablesCount };
    } catch (error) {
      db.rollback();
      console.error('Failed to clear business data:', error);
      throw error;
    }
  },
};
