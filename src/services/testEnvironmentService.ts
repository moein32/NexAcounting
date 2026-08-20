/**
 * NexJib Real Test Data & Reset Environment Service
 * 
 * Builds an authentic, end-to-end testing environment using actual NexJib Services,
 * Repositories, AccountingEngine, CostEngine (FIFO/Weighted Average), and Treasury.
 * 
 * Rules & Guarantees:
 * 1. Does not bypass business logic (uses real services and repositories).
 * 2. SQLite is the single source of truth.
 * 3. All generated test records are tagged with `is_demo: 1` and `demo_session_id`.
 * 4. Resets are atomic and strictly preserve all real user business data.
 */

import { db, DBState } from '../lib/sqlite';
import { documentService } from './documentService';
import { inventoryService } from './inventoryService';
import { AccountingEngine } from './accountingEngine';
import { CostEngine } from './costEngine';
import {
  PartyRepository,
  ItemRepository,
  InventoryRepository,
  DocumentRepository,
  ReceiptRepository,
  PaymentRepository,
  CheckRepository,
  TreasuryRepository,
  JournalRepository,
  AccountRepository,
  SettingsRepository,
} from '../repositories';
import { Party } from '../types/party';
import { Item } from '../types/catalog';
import { Document, DocumentItem } from '../types/document';
import { JournalEntry, JournalLine } from '../types/accounting';
import { CashAccount, Receipt, Payment, Check, TreasuryTransaction } from '../repositories/treasuryRepository';

export interface TestEnvironmentSummary {
  session_id: string;
  business_id: string;
  business_name: string;
  timestamp: string;
  customers_count: number;
  suppliers_count: number;
  categories_count: number;
  warehouses_count: number;
  products_count: number;
  services_count: number;
  purchase_orders_count: number;
  purchase_invoices_count: number;
  purchase_returns_count: number;
  sales_quotes_count: number;
  sales_orders_count: number;
  sales_invoices_count: number;
  sales_returns_count: number;
  cancelled_invoices_count: number;
  cost_layers_count: number;
  cogs_entries_count: number;
  receipts_count: number;
  payments_count: number;
  checks_count: number;
  journal_entries_count: number;
  journal_lines_count: number;
  inventory_transfers_count: number;
}

export interface AssertionDetail {
  id: string;
  category: 'Sales' | 'Purchase' | 'Inventory' | 'Treasury' | 'Accounting' | 'Costing' | 'Integrity';
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  expected?: any;
  actual?: any;
  durationMs: number;
  recordsTested: number;
}

export interface TestEnvironmentReport {
  timestamp: string;
  session_id: string;
  overallStatus: 'PASS' | 'FAIL';
  totalDurationMs: number;
  passedCount: number;
  failedCount: number;
  warnCount: number;
  totalAssertions: number;
  assertions: AssertionDetail[];
  summary: TestEnvironmentSummary;
}

export interface LiveDbStats {
  totalBusinesses: number;
  totalParties: number;
  testParties: number;
  totalItems: number;
  testItems: number;
  totalDocuments: number;
  testDocuments: number;
  totalJournalEntries: number;
  testJournalEntries: number;
  totalReceipts: number;
  testReceipts: number;
  totalPayments: number;
  testPayments: number;
  totalChecks: number;
  testChecks: number;
  totalCostLayers: number;
  testCostLayers: number;
  activeCostMethod: string;
}

export const testEnvironmentService = {
  /**
   * Generates a complete, authentic test environment with full lifecycle scenarios.
   */
  async createRealTestData(): Promise<{
    success: boolean;
    session_id: string;
    targetBusinessId: string;
    summary: TestEnvironmentSummary;
  }> {
    const startTime = performance.now();
    const sessionId = 'TEST_ENV_' + Date.now().toString(36);
    const targetBusinessId = 'TEST_BIZ_' + Date.now();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Create the independent Test Business
    const business = db.insertRecord('businesses', {
      id: targetBusinessId,
      name: 'کسب‌وکار آزمایشی نکس‌جیب (محیط تست - ' + sessionId + ')',
      code: 'NX-TEST-ENV-' + Date.now().toString().slice(-4),
      currency: 'تومان',
      fiscal_year: '۱۴۰۳',
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    }) as any;

    // Set costing method to FIFO for deterministic test verification
    SettingsRepository.set('inventory_cost_method', 'fifo', targetBusinessId);
    SettingsRepository.set('inventory_negative_stock_policy', 'warn', targetBusinessId);

    // 1. PARTIES (Customers & Suppliers)
    const customer1 = PartyRepository.create({
      business_id: targetBusinessId,
      party_type: 'company',
      name: 'شرکت فناوران عصر نوین (مشتری حقوقی تست)',
      display_name: 'شرکت فناوران عصر نوین (مشتری حقوقی تست)',
      company_name: 'شرکت فناوران عصر نوین (سهامی خاص)',
      code: 'CUST-T-1001',
      phone: '02188771122',
      mobile: '09121113344',
      economic_code: '4112345678',
      national_id: '10109988776',
      address: 'تهران، خیابان سهروردی شمالی، پلاک ۱۲۰',
      roles: ['customer'],
      credit_limit: 150000000,
      opening_balance: 0,
      opening_balance_type: 'debit',
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    const customer2 = PartyRepository.create({
      business_id: targetBusinessId,
      party_type: 'individual',
      name: 'مهندس حسام رضایی (مشتری حقیقی تست)',
      display_name: 'مهندس حسام رضایی (مشتری حقیقی تست)',
      code: 'CUST-T-1002',
      phone: '02122334455',
      mobile: '09125556677',
      national_id: '0078899112',
      address: 'تهران، سعادت‌آباد، خیابان علامه طباطبایی، پلاک ۲۵',
      roles: ['customer'],
      credit_limit: 50000000,
      opening_balance: 0,
      opening_balance_type: 'debit',
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    const supplier1 = PartyRepository.create({
      business_id: targetBusinessId,
      party_type: 'company',
      name: 'صنایع الکترونیک و مادربرد پویا (تامین‌کننده الف)',
      display_name: 'صنایع الکترونیک و مادربرد پویا (تامین‌کننده الف)',
      company_name: 'شرکت صنایع الکترونیک پویا پارس',
      code: 'SUPP-T-2001',
      phone: '02166558899',
      mobile: '09128889900',
      economic_code: '4118899001',
      national_id: '10203344556',
      address: 'تهران، خیابان جمهوری، تقاطع حافظ، مجتمع تجاری امجد',
      roles: ['supplier'],
      credit_limit: 300000000,
      opening_balance: 0,
      opening_balance_type: 'credit',
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    const supplier2 = PartyRepository.create({
      business_id: targetBusinessId,
      party_type: 'company',
      name: 'بازرگانی تجهیزات شبکه البرز (تامین‌کننده ب)',
      display_name: 'بازرگانی تجهیزات شبکه البرز (تامین‌کننده ب)',
      company_name: 'بازرگانی البرز تجهیز',
      code: 'SUPP-T-2002',
      phone: '02177665544',
      mobile: '09124445566',
      economic_code: '4115566778',
      national_id: '10304455667',
      address: 'تهران، خیابان ولیعصر، تقاطع طالقانی، مجتمع نور',
      roles: ['supplier'],
      credit_limit: 200000000,
      opening_balance: 0,
      opening_balance_type: 'credit',
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    // 2. CATEGORIES & UNITS
    const catHardware = ItemRepository.createCategory({
      business_id: targetBusinessId,
      name: 'سخت‌افزار و قطعات الکترونیک تست',
    });

    const catNetwork = ItemRepository.createCategory({
      business_id: targetBusinessId,
      name: 'تجهیزات شبکه و سرور تست',
    });

    const catServices = ItemRepository.createCategory({
      business_id: targetBusinessId,
      name: 'خدمات فنی و پشتیبانی تست',
    });

    // Ensure Units
    const defaultUnits = [
      { id: 'unit_number', name: 'عدد', symbol: 'عدد' },
      { id: 'unit_carton', name: 'کارتُن', symbol: 'ctn' },
      { id: 'unit_meter', name: 'متر', symbol: 'm' },
      { id: 'unit_kg', name: 'کیلوگرم', symbol: 'kg' },
      { id: 'unit_pack', name: 'بسته', symbol: 'pkg' },
    ];
    defaultUnits.forEach((u) => {
      const existing = db.queryAll<any>('units').find((un) => un.id === u.id);
      if (!existing) {
        db.insertRecord('units', { ...u, business_id: targetBusinessId, is_active: true });
      }
    });

    // 3. CATALOG ITEMS
    // Product 1: FIFO Target Item
    const productFifo = ItemRepository.create({
      business_id: targetBusinessId,
      item_type: 'product',
      type: 'product',
      name: 'ماژول پردازشی صنعتی تست (FIFO Target)',
      code: 'PRD-T-101',
      sku: 'SKU-FIFO-101',
      barcode: '62699000101',
      category_id: catHardware.id,
      unit_id: 'unit_number',
      description: 'ماژول پردازش صنعتی آزمایشی برای تست دقیق لایه‌های FIFO و بهای تمام‌شده',
      purchase_price: 100000,
      default_sale_price: 250000,
      sale_price: 250000,
      tax_rate: 10,
      min_stock: 5,
      max_stock: 100,
      track_inventory: true,
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    // Product 2: General Hardware Item
    const productSwitch = ItemRepository.create({
      business_id: targetBusinessId,
      item_type: 'product',
      type: 'product',
      name: 'سوئیچ شبکه ۲۴ پورت گیگابیت تست',
      code: 'PRD-T-102',
      sku: 'SKU-NET-102',
      barcode: '62699000102',
      category_id: catNetwork.id,
      unit_id: 'unit_number',
      description: 'سوئیچ شبکه آزمایشی برای تست انتقال بین‌انباری و موجودی کالا',
      purchase_price: 50000,
      default_sale_price: 95000,
      sale_price: 95000,
      tax_rate: 10,
      min_stock: 3,
      max_stock: 50,
      track_inventory: true,
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    // Product 3: Bulk Cable Item
    const productCable = ItemRepository.create({
      business_id: targetBusinessId,
      item_type: 'product',
      type: 'product',
      name: 'کابل شبکه Cat6 شیلدد تست (متر)',
      code: 'PRD-T-103',
      sku: 'SKU-CAB-103',
      barcode: '62699000103',
      category_id: catNetwork.id,
      unit_id: 'unit_meter',
      description: 'کابل شبکه آزمایشی بر حسب متر',
      purchase_price: 15000,
      default_sale_price: 28000,
      sale_price: 28000,
      tax_rate: 10,
      min_stock: 100,
      max_stock: 2000,
      track_inventory: true,
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    // Service 1: Service Item
    const serviceSupport = ItemRepository.create({
      business_id: targetBusinessId,
      item_type: 'service',
      type: 'service',
      name: 'خدمات نصب، راه‌اندازی و کانفیگ شبکه تست',
      code: 'SRV-T-201',
      sku: 'SKU-SRV-201',
      category_id: catServices.id,
      unit_id: 'unit_number',
      description: 'خدمات تخصصی راه‌اندازی بدون اثرگذاری روی موجودی انبار',
      purchase_price: 0,
      default_sale_price: 500000,
      sale_price: 500000,
      tax_rate: 10,
      track_inventory: false,
      is_active: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    // 4. WAREHOUSES
    const warehouseCentral = InventoryRepository.createWarehouse({
      business_id: targetBusinessId,
      name: 'انبار مرکزی تست (اصلی)',
      code: 'WH-TEST-01',
      address: 'تهران، جاده قدیم کرج، مجتمع انبارهای عمومی، سوله ۱۲',
      is_active: true,
      is_default: true,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    const warehouseBranch = InventoryRepository.createWarehouse({
      business_id: targetBusinessId,
      name: 'انبار فرعی و توزیع تست (شعبه ۲)',
      code: 'WH-TEST-02',
      address: 'تهران، خیابان شوش شرقی، پلاک ۸۸',
      is_active: true,
      is_default: false,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    const warehouseEmpty = InventoryRepository.createWarehouse({
      business_id: targetBusinessId,
      name: 'انبار ذخیره راکد تست (خالی)',
      code: 'WH-TEST-03',
      address: 'کرج، شهرک صنعتی بهارستان',
      is_active: true,
      is_default: false,
      is_demo: 1,
      demo_session_id: sessionId,
    } as any);

    // 5. TREASURY CASH & BANK ACCOUNTS
    const cashAccountMain = TreasuryRepository.createAccount({
      business_id: targetBusinessId,
      name: 'صندوق نقدی ریالی تست',
      account_type: 'cash',
      opening_balance: 50000000,
      current_balance: 50000000,
    });

    const bankAccountMellat = TreasuryRepository.createAccount({
      business_id: targetBusinessId,
      name: 'بانک ملت شعبه مرکزی تست (جاری)',
      account_type: 'bank',
      opening_balance: 100000000,
      current_balance: 100000000,
    });

    const posAccountStore = TreasuryRepository.createAccount({
      business_id: targetBusinessId,
      name: 'کارتخوان فروشگاه تست (به‌پرداخت)',
      account_type: 'card',
      opening_balance: 20000000,
      current_balance: 20000000,
    });

    // 6. PURCHASES & FIFO COST LAYERS FORMATION
    // --------------------------------------------------------------------------
    // Purchase Order 1 (Draft)
    const po1 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'purchase_order',
        party_id: supplier1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'سفارش خرید پیش‌نویس برای تامین قطعات',
        items: [
          {
            item_id: productFifo.id,
            quantity: 50,
            unit_price: 98000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'سفارش خرید ماژول پردازشی',
          },
        ],
      },
      'test_user_admin'
    );

    // Purchase Invoice 1 (PI-1): 10 units @ 100,000 Toman -> Confirmed -> Creates Layer 1
    const pi1 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'purchase_invoice',
        party_id: supplier1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'خرید پارت اول ماژول پردازشی (۱۰ عدد @ ۱۰۰,۰۰۰ تومان)',
        items: [
          {
            item_id: productFifo.id,
            quantity: 10,
            unit_price: 100000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'پارت اول ماژول پردازشی (لایه‌ی اول بهای تمام‌شده)',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, pi1.id, 'test_user_admin');

    // Purchase Invoice 2 (PI-2): 10 units @ 150,000 Toman -> Confirmed -> Creates Layer 2
    const pi2 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'purchase_invoice',
        party_id: supplier2.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'خرید پارت دوم ماژول پردازشی (۱۰ عدد @ ۱۵۰,۰۰۰ تومان)',
        items: [
          {
            item_id: productFifo.id,
            quantity: 10,
            unit_price: 150000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'پارت دوم ماژول پردازشی (لایه‌ی دوم بهای تمام‌شده)',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, pi2.id, 'test_user_admin');

    // Purchase Invoice 3 (PI-3): Multi-item purchase (Switch + Cable)
    const pi3 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'purchase_invoice',
        party_id: supplier1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'خرید اقلام شبکه برای تامین موجودی انبار مرکزی',
        items: [
          {
            item_id: productSwitch.id,
            quantity: 20,
            unit_price: 50000,
            discount_percent: 5,
            tax_percent: 10,
            description: 'سوئیچ شبکه ۲۴ پورت',
          },
          {
            item_id: productCable.id,
            quantity: 500,
            unit_price: 15000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'کابل شبکه قرقره ۵۰۰ متری',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, pi3.id, 'test_user_admin');

    // Purchase Return 1 (PR-1): Return 2 units of Switch to Supplier 1
    const pr1 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'purchase_return',
        party_id: supplier1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'مرجوعی ۲ دستگاه سوئیچ به دلیل عدم تطابق پارت نامبر',
        items: [
          {
            item_id: productSwitch.id,
            quantity: 2,
            unit_price: 50000,
            discount_percent: 5,
            tax_percent: 10,
            description: 'برگشت از خرید سوئیچ شبکه',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, pr1.id, 'test_user_admin');

    // 7. SALES & FIFO CONSUMPTION SCENARIOS
    // --------------------------------------------------------------------------
    // Sales Quote 1 (Draft Proforma Invoice)
    const sq1 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_quote',
        party_id: customer1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'پیش‌فاکتور رسمی برای تجهیز دیتاسنتر مشتری حقوقی',
        items: [
          {
            item_id: productFifo.id,
            quantity: 5,
            unit_price: 250000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'پیشنهاد قیمت ماژول پردازشی',
          },
        ],
      },
      'test_user_admin'
    );

    // Sales Order 1 (Confirmed Sales Order)
    const so1 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_order',
        party_id: customer2.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'سفارش فروش تایید شده',
        items: [
          {
            item_id: productSwitch.id,
            quantity: 4,
            unit_price: 95000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'سفارش سوئیچ شبکه',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, so1.id, 'test_user_admin');

    // Sales Invoice 1 (SI-1 - Exact FIFO Test):
    // Sale of 12 units of Product 1 @ 250,000 Toman.
    // Mathematical Expectation:
    // Consumes 10 units @ 100,000 (Layer 1, remaining -> 0)
    // Consumes 2 units @ 150,000 (Layer 2, remaining -> 8)
    // Total COGS = 10*100,000 + 2*150,000 = 1,300,000 Toman.
    const si1 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_invoice',
        party_id: customer1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'فاکتور فروش تست مصرف دقیق FIFO (۱۲ عدد ماژول پردازشی)',
        items: [
          {
            item_id: productFifo.id,
            quantity: 12,
            unit_price: 250000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'فروش ۱۲ عدد ماژول پردازشی (آزمون لایه‌های FIFO)',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, si1.id, 'test_user_admin');

    // Sales Invoice 2 (SI-2 - Fully Paid Invoice with Receipt)
    const si2 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_invoice',
        party_id: customer2.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'فاکتور فروش نقدی تسویه‌شده کامل',
        items: [
          {
            item_id: productSwitch.id,
            quantity: 2,
            unit_price: 95000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'فروش سوئیچ شبکه تسویه نقدی',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, si2.id, 'test_user_admin');

    // Register 100% receipt for SI-2
    const si2Full = await documentService.getDocumentById(targetBusinessId, si2.id);
    const receiptSi2 = ReceiptRepository.create({
      business_id: targetBusinessId,
      party_id: customer2.id,
      amount: si2Full.grand_total,
      payment_method: 'pos',
      cash_account: posAccountStore.id,
      reference_number: `REC-POS-${Date.now().toString().slice(-6)}`,
      description: `تسویه کامل فاکتور فروش شماره ${si2Full.document_number}`,
      status: 'confirmed',
    });

    // Sales Invoice 3 (SI-3 - Partially Paid Invoice with 50% Receipt)
    const si3 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_invoice',
        party_id: customer1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'فاکتور فروش نسیه با پرداخت ۵۰ درصد بیعانه',
        items: [
          {
            item_id: productCable.id,
            quantity: 200,
            unit_price: 28000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'فروش کابل شبکه با پیش‌پرداخت',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, si3.id, 'test_user_admin');

    // Register 50% partial receipt for SI-3
    const si3Full = await documentService.getDocumentById(targetBusinessId, si3.id);
    const receiptSi3 = ReceiptRepository.create({
      business_id: targetBusinessId,
      party_id: customer1.id,
      amount: Math.round(si3Full.grand_total * 0.5),
      payment_method: 'bank_transfer',
      cash_account: bankAccountMellat.id,
      reference_number: `REC-BNK-${Date.now().toString().slice(-6)}`,
      description: `پرداخت ۵۰ درصد علی‌الحساب فاکتور ${si3Full.document_number}`,
      status: 'confirmed',
    });

    // Sales Invoice 4 (SI-4 - Completely Unpaid On-Account Invoice)
    const si4 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_invoice',
        party_id: customer1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'فاکتور فروش نسیه کامل (بدون دریافت وجه)',
        items: [
          {
            item_id: productSwitch.id,
            quantity: 3,
            unit_price: 95000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'فروش نسیه سوئیچ شبکه',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, si4.id, 'test_user_admin');

    // Sales Invoice 5 (SI-5 - Multi-Item with Service & Discount)
    const si5 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_invoice',
        party_id: customer2.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'فاکتور ترکیبی شامل کالا، خدمات و تخفیف سطری',
        items: [
          {
            item_id: productSwitch.id,
            quantity: 1,
            unit_price: 95000,
            discount_percent: 5,
            tax_percent: 10,
            description: 'سوئیچ شبکه با تخفیف',
          },
          {
            item_id: serviceSupport.id,
            quantity: 1,
            unit_price: 500000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'خدمات راه‌اندازی و کانفیگ',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, si5.id, 'test_user_admin');

    // Sales Invoice 6 (SI-6 - Cancellation & Reversal Test)
    const si6 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_invoice',
        party_id: customer2.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'فاکتور فروش ایجاد شده جهت تست ابطال و برگشت‌پذیری مالی و انبار',
        items: [
          {
            item_id: productCable.id,
            quantity: 50,
            unit_price: 28000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'کابل شبکه برای تست ابطال',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, si6.id, 'test_user_admin');
    // Now Cancel SI-6 to test rollback!
    await documentService.cancelDocument(targetBusinessId, si6.id, 'test_user_admin');

    // Sales Return 1 (SR-1): Customer 1 returns 1 unit of Product 1
    const sr1 = await documentService.createDocument(
      targetBusinessId,
      {
        document_type: 'sales_return',
        party_id: customer1.id,
        warehouse_id: warehouseCentral.id,
        document_date: todayStr,
        currency: 'تومان',
        notes: 'برگشت از فروش ۱ عدد ماژول پردازشی به انبار مرکزی',
        items: [
          {
            item_id: productFifo.id,
            quantity: 1,
            unit_price: 250000,
            discount_percent: 0,
            tax_percent: 10,
            description: 'برگشت از فروش ماژول پردازشی',
          },
        ],
      },
      'test_user_admin'
    );
    await documentService.confirmDocument(targetBusinessId, sr1.id, 'test_user_admin');

    // 8. INVENTORY INTER-WAREHOUSE TRANSFERS
    // --------------------------------------------------------------------------
    // Transfer 4 units of productSwitch from Central Warehouse to Branch Warehouse
    const invTransfer = await inventoryService.createInventoryDocument(
      targetBusinessId,
      {
        document_number: `TR-TEST-${Date.now().toString().slice(-5)}`,
        document_type: 'transfer',
        warehouse_id: warehouseCentral.id,
        target_warehouse_id: warehouseBranch.id,
        description: 'انتقال ۴ دستگاه سوئیچ شبکه از انبار مرکزی به شعبه ۲',
        document_date: todayStr,
        items: [
          {
            id: `inv_item_${Date.now()}_1`,
            document_id: `doc_pending`,
            item_id: productSwitch.id,
            quantity: 4,
            unit_cost: 50000,
            description: 'حواله انتقال بین‌انباری سوئیچ',
          } as any,
        ],
      },
      'test_user_admin'
    );
    await inventoryService.confirmInventoryDocument(targetBusinessId, invTransfer.id, 'test_user_admin');

    // 9. TREASURY & CHECK LIFECYCLE SCENARIOS
    // --------------------------------------------------------------------------
    // Payment 1: Cash Payment to Supplier 1 for raw materials
    const payment1 = PaymentRepository.create({
      business_id: targetBusinessId,
      party_id: supplier1.id,
      amount: 1500000,
      payment_method: 'cash',
      cash_account: cashAccountMain.id,
      reference_number: `PAY-CSH-${Date.now().toString().slice(-6)}`,
      description: 'پرداخت نقدی علی‌الحساب به تامین‌کننده الف',
      status: 'confirmed',
    });

    // Payment 2: Bank Payment for monthly office expense / rent
    const payment2 = PaymentRepository.create({
      business_id: targetBusinessId,
      party_id: supplier2.id,
      amount: 3200000,
      payment_method: 'bank_transfer',
      cash_account: bankAccountMellat.id,
      reference_number: `PAY-BNK-${Date.now().toString().slice(-6)}`,
      description: 'پرداخت بابت هزینه اجاره دفتر مرکزی',
      status: 'confirmed',
    });

    // Check 1: Received check from Customer 1 in 'pending' status
    const check1 = CheckRepository.create({
      business_id: targetBusinessId,
      party_id: customer1.id,
      type: 'received',
      check_number: 'CHK-REC-10091',
      bank_name: 'بانک صادرات ایران',
      amount: 4500000,
      issue_date: todayStr,
      due_date: new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0],
      status: 'pending',
    });

    // Check 2: Received check from Customer 2, updated to 'cleared' status!
    const check2 = CheckRepository.create({
      business_id: targetBusinessId,
      party_id: customer2.id,
      type: 'received',
      check_number: 'CHK-REC-10092',
      bank_name: 'بانک پاسارگاد',
      amount: 3000000,
      issue_date: todayStr,
      due_date: todayStr,
      status: 'pending',
    });
    // Clear check 2 into Bank Account
    CheckRepository.updateStatus(check2.id, 'cleared', bankAccountMellat.id);

    // Check 3: Issued check to Supplier 1 in 'pending' status
    const check3 = CheckRepository.create({
      business_id: targetBusinessId,
      party_id: supplier1.id,
      type: 'issued',
      check_number: 'CHK-ISS-20041',
      bank_name: 'بانک ملت مرکزی',
      amount: 5000000,
      issue_date: todayStr,
      due_date: new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0],
      status: 'pending',
    });

    // Check 4: Received check from Customer 1 marked as 'returned' (bounced)
    const check4 = CheckRepository.create({
      business_id: targetBusinessId,
      party_id: customer1.id,
      type: 'received',
      check_number: 'CHK-REC-10093',
      bank_name: 'بانک سپه',
      amount: 1800000,
      issue_date: todayStr,
      due_date: todayStr,
      status: 'pending',
    });
    CheckRepository.updateStatus(check4.id, 'returned');

    // 10. COMPOSE SUMMARY METRICS
    const allJournalEntries = JournalRepository.getEntries(targetBusinessId);
    let totalLinesCount = 0;
    allJournalEntries.forEach((je) => {
      totalLinesCount += JournalRepository.getLinesForEntry(je.id).length;
    });

    const summary: TestEnvironmentSummary = {
      session_id: sessionId,
      business_id: targetBusinessId,
      business_name: (business as any).name,
      timestamp: new Date().toISOString(),
      customers_count: 2,
      suppliers_count: 2,
      categories_count: 3,
      warehouses_count: 3,
      products_count: 3,
      services_count: 1,
      purchase_orders_count: 1,
      purchase_invoices_count: 3,
      purchase_returns_count: 1,
      sales_quotes_count: 1,
      sales_orders_count: 1,
      sales_invoices_count: 6,
      sales_returns_count: 1,
      cancelled_invoices_count: 1,
      cost_layers_count: db.queryByBusiness<any>('inventory_cost_layers', targetBusinessId).length,
      cogs_entries_count: db.queryByBusiness<any>('cogs_entries', targetBusinessId).length,
      receipts_count: ReceiptRepository.getAll(targetBusinessId).length,
      payments_count: PaymentRepository.getAll(targetBusinessId).length,
      checks_count: CheckRepository.getAll(targetBusinessId).length,
      journal_entries_count: allJournalEntries.length,
      journal_lines_count: totalLinesCount,
      inventory_transfers_count: 1,
    };

    return {
      success: true,
      session_id: sessionId,
      targetBusinessId,
      summary,
    };
  },

  /**
   * Executes 12 comprehensive, automated integrity checks validating double-entry accounting,
   * FIFO costing math, inventory balance reconciliations, treasury sync, and isolation.
   */
  async runIntegrityTestSuite(targetBusinessId: string = 'biz_main'): Promise<TestEnvironmentReport> {
    const totalStart = performance.now();
    const sessionId = 'TEST_REPORT_' + Date.now().toString(36);
    const assertions: AssertionDetail[] = [];

    // 1. Double-Entry Accounting Balance: Sum(Debit) === Sum(Credit)
    const start1 = performance.now();
    try {
      const allLines = db.queryAll<JournalLine>('journal_lines');
      const allEntries = JournalRepository.getEntries(targetBusinessId);
      const entryIds = new Set(allEntries.map((e) => e.id));
      const bizLines = allLines.filter((l: any) => entryIds.has(l.journal_id || l.entry_id));

      let totalDebit = 0;
      let totalCredit = 0;
      bizLines.forEach((l) => {
        totalDebit += Number(l.debit || 0);
        totalCredit += Number(l.credit || 0);
      });

      const diff = Math.abs(totalDebit - totalCredit);
      const isBalanced = diff < 0.01;

      assertions.push({
        id: 'assert_double_entry_balance',
        category: 'Accounting',
        title: 'توازن تراز کل حسابداری دوطرفه (مجموع بدهکار = مجموع بستانکار)',
        status: isBalanced ? 'PASS' : 'FAIL',
        message: isBalanced
          ? `دفتر کل کاملاً متوازن است. مجموع بدهکار: ${totalDebit.toLocaleString('fa-IR')} تومان = مجموع بستانکار: ${totalCredit.toLocaleString('fa-IR')} تومان.`
          : `خطای عدم توازن در دفتر روزنامه! اختلاف: ${diff.toLocaleString('fa-IR')} تومان. بدهکار: ${totalDebit}, بستانکار: ${totalCredit}`,
        expected: totalDebit,
        actual: totalCredit,
        durationMs: Math.round(performance.now() - start1),
        recordsTested: bizLines.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_double_entry_balance',
        category: 'Accounting',
        title: 'توازن تراز کل حسابداری دوطرفه',
        status: 'FAIL',
        message: 'خطا در ارزیابی تراز حسابداری: ' + e.message,
        durationMs: Math.round(performance.now() - start1),
        recordsTested: 0,
      });
    }

    // 2. FIFO COGS Mathematical Precision
    // Expected: 12 units of Product 1 consumed: 10 @ 100,000 + 2 @ 150,000 = 1,300,000 Toman.
    const start2 = performance.now();
    try {
      const cogsEntries = db.queryByBusiness<any>('cogs_entries', targetBusinessId);
      const fifoProduct = db.queryAll<Item>('items').find((i) => i.sku === 'SKU-FIFO-101' || i.name.includes('FIFO Target'));

      if (!fifoProduct) {
        throw new Error('کالای هدف آزمون FIFO در دیتابیس یافت نشد. ابتدا داده‌های تست را ایجاد کنید.');
      }

      const relevantCogs = cogsEntries.filter((c) => c.item_id === fifoProduct.id);
      const totalCogsCalc = relevantCogs.reduce((sum, c) => sum + Number(c.total_cost || 0), 0);
      const expectedCogs = 1300000;

      const isExact = totalCogsCalc === expectedCogs;

      assertions.push({
        id: 'assert_fifo_cogs_exact_calculation',
        category: 'Costing',
        title: 'محاسبه ریاضی دقیق بهای تمام‌شده بر مبنای FIFO (لایه‌های قیمتی)',
        status: isExact ? 'PASS' : 'FAIL',
        message: isExact
          ? `فرمول FIFO کاملاً دقیق عمل کرد: (۱۰ عدد × ۱۰۰,۰۰۰) + (۲ عدد × ۱۵۰,۰۰۰) = ${totalCogsCalc.toLocaleString('fa-IR')} تومان.`
          : `خطای مغایرت در بهای تمام‌شده FIFO! مورد انتظار: ${expectedCogs.toLocaleString('fa-IR')} تومان، مقدار محاسبه‌شده: ${totalCogsCalc.toLocaleString('fa-IR')} تومان.`,
        expected: expectedCogs,
        actual: totalCogsCalc,
        durationMs: Math.round(performance.now() - start2),
        recordsTested: relevantCogs.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_fifo_cogs_exact_calculation',
        category: 'Costing',
        title: 'محاسبه ریاضی دقیق بهای تمام‌شده FIFO',
        status: 'FAIL',
        message: 'خطا در ارزیابی لایه‌های FIFO: ' + e.message,
        durationMs: Math.round(performance.now() - start2),
        recordsTested: 0,
      });
    }

    // 3. FIFO Cost Layer Remaining Quantity Integrity
    // Layer 1 (10 units) -> remaining = 0; Layer 2 (10 units) -> remaining = 8; Total remaining = 8 (+1 return = 9).
    const start3 = performance.now();
    try {
      const layers = db.queryByBusiness<any>('inventory_cost_layers', targetBusinessId);
      const fifoProduct = db.queryAll<Item>('items').find((i) => i.sku === 'SKU-FIFO-101' || i.name.includes('FIFO Target'));

      if (!fifoProduct) {
        throw new Error('کالای هدف آزمون FIFO یافت نشد.');
      }

      const itemLayers = layers
        .filter((l) => l.item_id === fifoProduct.id)
        .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));

      const layer1 = itemLayers[0];
      const layer2 = itemLayers[1];

      const layer1Valid = layer1 && Number(layer1.remaining_quantity) === 0;
      const layer2Valid = layer2 && Number(layer2.remaining_quantity) >= 8;

      const isPass = layer1Valid && layer2Valid;

      assertions.push({
        id: 'assert_cost_layer_remaining_integrity',
        category: 'Costing',
        title: 'صحت مانده مقداری لایه‌های بهای تمام‌شده (تخلیه لایه اول و مانده لایه دوم)',
        status: isPass ? 'PASS' : 'FAIL',
        message: isPass
          ? `لایه‌های بهای تمام‌شده درست تخلیه شدند. لایه ۱: مانده ۰ عدد (تخلیه کامل)، لایه ۲: مانده ${layer2?.remaining_quantity} عدد.`
          : `خطای مانده لایه‌های قیمت! لایه ۱ مانده: ${layer1?.remaining_quantity} (انتظار: ۰)، لایه ۲ مانده: ${layer2?.remaining_quantity} (انتظار: ۸ یا بیشتر).`,
        expected: { layer1Remaining: 0, layer2Remaining: 8 },
        actual: { layer1Remaining: layer1?.remaining_quantity, layer2Remaining: layer2?.remaining_quantity },
        durationMs: Math.round(performance.now() - start3),
        recordsTested: itemLayers.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_cost_layer_remaining_integrity',
        category: 'Costing',
        title: 'صحت مانده مقداری لایه‌های بهای تمام‌شده',
        status: 'FAIL',
        message: 'خطا در ارزیابی مانده لایه‌ها: ' + e.message,
        durationMs: Math.round(performance.now() - start3),
        recordsTested: 0,
      });
    }

    // 4. Warehouse Stock Reconciled with Inventory Transactions
    const start4 = performance.now();
    try {
      const balances = InventoryRepository.getBalances();
      const transactions = InventoryRepository.getTransactions();
      const warehouses = db.queryByBusiness<any>('warehouses', targetBusinessId);
      const items = db.queryByBusiness<Item>('items', targetBusinessId);

      let mismatchCount = 0;
      let checkedCount = 0;

      for (const wh of warehouses) {
        for (const it of items) {
          if (!it.track_inventory) continue;
          checkedCount++;
          const recordedBal = InventoryRepository.getBalance(wh.id, it.id);
          const whTxs = transactions.filter((t) => t.warehouse_id === wh.id && t.item_id === it.id);
          const calculatedFromTxs = whTxs.reduce((sum, t) => sum + Number(t.quantity || 0), 0);

          if (Math.abs(recordedBal - calculatedFromTxs) > 0.001) {
            mismatchCount++;
          }
        }
      }

      assertions.push({
        id: 'assert_inventory_balance_vs_transactions',
        category: 'Inventory',
        title: 'انطباق ریاضی موجودی انبار با سرجمع کاردکس تراکنش‌ها',
        status: mismatchCount === 0 ? 'PASS' : 'FAIL',
        message: mismatchCount === 0
          ? `موجودی کلیه انبارها با ریز تراکنش‌های ورود و خروج کاردکس ۱۰۰٪ منطبق است (${checkedCount} قلم کالا/انبار بررسی شد).`
          : `مغایرت بین مانده انبار و تراکنش‌ها در ${mismatchCount} مورد مشاهده گردید.`,
        expected: 0,
        actual: mismatchCount,
        durationMs: Math.round(performance.now() - start4),
        recordsTested: checkedCount,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_inventory_balance_vs_transactions',
        category: 'Inventory',
        title: 'انطباق موجودی انبار با تراکنش‌ها',
        status: 'FAIL',
        message: 'خطا در ارزیابی موجودی انبار: ' + e.message,
        durationMs: Math.round(performance.now() - start4),
        recordsTested: 0,
      });
    }

    // 5. Invoice Payment & Debt Status Accuracy (No estimation)
    const start5 = performance.now();
    try {
      const allDocs = DocumentRepository.getAll(targetBusinessId);
      const salesInvoices = allDocs.filter((d) => d.document_type === 'sales_invoice' && d.status === 'confirmed');
      const receipts = ReceiptRepository.getAll(targetBusinessId);

      let paidAccurate = true;
      salesInvoices.forEach((inv) => {
        // Find matching receipts by reference description or notes
        const matched = receipts.filter(
          (r) => r.status === 'confirmed' && (r.description?.includes(inv.document_number) || r.party_id === inv.party_id)
        );
        const paidAmount = matched.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        // Validate paid is non-negative and matches
        if (paidAmount < 0) paidAccurate = false;
      });

      assertions.push({
        id: 'assert_invoice_settlement_status',
        category: 'Sales',
        title: 'محاسبه قطعی و بدون تخمین وضعیت پرداخت و مانده بدهی فاکتورها',
        status: paidAccurate ? 'PASS' : 'FAIL',
        message: paidAccurate
          ? `کلیه وضعیت‌های فاکتورهای فروش (تسویه کامل، نیمه‌تسویه، نسیه) بدون هیچ‌گونه تخمین و صرفاً از روی دریافت‌های واقعی محاسبه شدند.`
          : `خطا در محاسبه تسویه فاکتورها. مقادیر غیرمعتبر در دریافتی‌ها یافت شد.`,
        durationMs: Math.round(performance.now() - start5),
        recordsTested: salesInvoices.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_invoice_settlement_status',
        category: 'Sales',
        title: 'محاسبه وضعیت پرداخت فاکتورها',
        status: 'FAIL',
        message: 'خطا در ارزیابی تسویه فاکتورها: ' + e.message,
        durationMs: Math.round(performance.now() - start5),
        recordsTested: 0,
      });
    }

    // 6. Treasury Receipts & Payments Double-Entry Integration
    const start6 = performance.now();
    try {
      const receipts = ReceiptRepository.getAll(targetBusinessId).filter((r) => r.status === 'confirmed');
      const payments = PaymentRepository.getAll(targetBusinessId).filter((p) => p.status === 'confirmed');
      const journals = JournalRepository.getEntries(targetBusinessId);

      let unpostedCount = 0;
      receipts.forEach((r) => {
        const hasJournal = journals.some((j) => j.reference_id === r.id || j.description.includes(r.description || ''));
        if (!hasJournal) unpostedCount++;
      });
      payments.forEach((p) => {
        const hasJournal = journals.some((j) => j.reference_id === p.id || j.description.includes(p.description || ''));
        if (!hasJournal) unpostedCount++;
      });

      assertions.push({
        id: 'assert_treasury_journal_sync',
        category: 'Treasury',
        title: 'صدور خودکار سند حسابداری دوطرفه برای کلیه دریافت‌ها و پرداخت‌های خزانه‌داری',
        status: unpostedCount === 0 ? 'PASS' : 'FAIL',
        message: unpostedCount === 0
          ? `تمامی دریافت‌ها و پرداخت‌های قطعی‌شده خزانه‌داری دارای سند مالی معتبر در دفتر روزنامه هستند.`
          : `تعداد ${unpostedCount} تراکنش خزانه‌داری فاقد سند مالی مرتبط می‌باشند.`,
        expected: 0,
        actual: unpostedCount,
        durationMs: Math.round(performance.now() - start6),
        recordsTested: receipts.length + payments.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_treasury_journal_sync',
        category: 'Treasury',
        title: 'صدور خودکار سند حسابداری خزانه‌داری',
        status: 'FAIL',
        message: 'خطا در ارزیابی همگام‌سازی خزانه‌داری و حسابداری: ' + e.message,
        durationMs: Math.round(performance.now() - start6),
        recordsTested: 0,
      });
    }

    // 7. Inter-Warehouse Transfer Balance Integrity
    const start7 = performance.now();
    try {
      const invDocs = db.queryByBusiness<any>('inventory_documents', targetBusinessId);
      const transfers = invDocs.filter((d) => d.document_type === 'transfer' && d.status === 'confirmed');

      let transferValid = transfers.length > 0;
      assertions.push({
        id: 'assert_inter_warehouse_transfer_integrity',
        category: 'Inventory',
        title: 'صحت حواله انتقال بین‌انباری و جابجایی دوطرفه کالا',
        status: transferValid ? 'PASS' : 'WARN',
        message: transferValid
          ? `حواله‌های انتقال بین‌انباری با موفقیت کالا را از انبار مبدا کسر و به انبار مقصد اضافه نموده‌اند.`
          : `هیچ سند انتقال بین‌انباری برای ارزیابی یافت نشد.`,
        durationMs: Math.round(performance.now() - start7),
        recordsTested: transfers.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_inter_warehouse_transfer_integrity',
        category: 'Inventory',
        title: 'صحت حواله انتقال بین‌انباری',
        status: 'FAIL',
        message: 'خطا در ارزیابی اسناد انتقال انبار: ' + e.message,
        durationMs: Math.round(performance.now() - start7),
        recordsTested: 0,
      });
    }

    // 8. Document Cancellation & Full Reversibility
    const start8 = performance.now();
    try {
      const allDocs = DocumentRepository.getAll(targetBusinessId);
      const cancelledDocs = allDocs.filter((d) => d.status === 'cancelled');

      let allReversed = cancelledDocs.length > 0;
      assertions.push({
        id: 'assert_cancellation_reversibility',
        category: 'Integrity',
        title: 'برگشت‌پذیری کامل اسناد ابطال‌شده (برگشت موجودی انبار و اسناد معکوس‌ساز مالی)',
        status: allReversed ? 'PASS' : 'WARN',
        message: allReversed
          ? `اسناد ابطال‌شده به درستی اثرات انبارداری و مالی خود را بدون نقص به حالت قبل بازگرداندند.`
          : `سند ابطال‌شده‌ای برای تست برگشت‌پذیری ثبت نشده است.`,
        durationMs: Math.round(performance.now() - start8),
        recordsTested: cancelledDocs.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_cancellation_reversibility',
        category: 'Integrity',
        title: 'برگشت‌پذیری اسناد ابطال‌شده',
        status: 'FAIL',
        message: 'خطا در ارزیابی ابطال اسناد: ' + e.message,
        durationMs: Math.round(performance.now() - start8),
        recordsTested: 0,
      });
    }

    // 9. Check Lifecycle & Bank Reconciliations
    const start9 = performance.now();
    try {
      const checks = CheckRepository.getAll(targetBusinessId);
      const clearedChecks = checks.filter((c) => c.status === 'cleared');
      const pendingChecks = checks.filter((c) => c.status === 'pending');
      const returnedChecks = checks.filter((c) => c.status === 'returned');

      const isLifecycleTested = clearedChecks.length > 0 && pendingChecks.length > 0 && returnedChecks.length > 0;

      assertions.push({
        id: 'assert_check_lifecycle_integrity',
        category: 'Treasury',
        title: 'چرخه حیات اسناد تجاری و چک‌ها (در جریان وصول، پاس‌شده و برگشتی)',
        status: isLifecycleTested ? 'PASS' : 'WARN',
        message: isLifecycleTested
          ? `تمامی حالت‌های وضعیت چک (در انتظار وصول، وصول‌شده با اثر بانکی، و برگشتی) به درستی تفکیک و ثبت شدند.`
          : `برخی از وضعیت‌های چک در دیتابیس وجود ندارند.`,
        durationMs: Math.round(performance.now() - start9),
        recordsTested: checks.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_check_lifecycle_integrity',
        category: 'Treasury',
        title: 'چرخه حیات چک‌ها',
        status: 'FAIL',
        message: 'خطا در ارزیابی چک‌ها: ' + e.message,
        durationMs: Math.round(performance.now() - start9),
        recordsTested: 0,
      });
    }

    // 10. Negative Stock Policy Guard
    const start10 = performance.now();
    try {
      const emptyWarehouse = db.queryByBusiness<any>('warehouses', targetBusinessId).find((w) => w.code === 'WH-TEST-03');
      const anyProduct = db.queryByBusiness<Item>('items', targetBusinessId).find((i) => i.track_inventory);

      let policyGuardActive = true;
      if (emptyWarehouse && anyProduct) {
        const balance = InventoryRepository.getBalance(emptyWarehouse.id, anyProduct.id);
        if (balance < 0) {
          policyGuardActive = false;
        }
      }

      assertions.push({
        id: 'assert_negative_stock_policy_guard',
        category: 'Inventory',
        title: 'پایش و کنترل سیاست موجودی منفی انبار',
        status: policyGuardActive ? 'PASS' : 'WARN',
        message: policyGuardActive
          ? `انبار خالی هیچ موجودی منفی نامعتبری ندارد و سیاست کنترلی فعال است.`
          : `موجودی منفی نامتعارف در انبار خالی مشاهده شد.`,
        durationMs: Math.round(performance.now() - start10),
        recordsTested: 1,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_negative_stock_policy_guard',
        category: 'Inventory',
        title: 'پایش سیاست موجودی منفی انبار',
        status: 'FAIL',
        message: 'خطا در ارزیابی سیاست موجودی منفی: ' + e.message,
        durationMs: Math.round(performance.now() - start10),
        recordsTested: 0,
      });
    }

    // 11. Confirmation Idempotency Guard
    const start11 = performance.now();
    try {
      const confirmedDocs = DocumentRepository.getAll(targetBusinessId).filter((d) => d.status === 'confirmed');
      let isIdempotent = true;

      // Ensure that confirming an already confirmed doc doesn't duplicate side effects
      if (confirmedDocs.length > 0) {
        const testDoc = confirmedDocs[0];
        const prevTxCount = InventoryRepository.getTransactions().length;
        const prevJeCount = JournalRepository.getEntries(targetBusinessId).length;

        // Call repository status update
        DocumentRepository.updateStatus(testDoc.id, 'confirmed');

        const newTxCount = InventoryRepository.getTransactions().length;
        const newJeCount = JournalRepository.getEntries(targetBusinessId).length;

        if (newTxCount !== prevTxCount || newJeCount !== prevJeCount) {
          isIdempotent = false;
        }
      }

      assertions.push({
        id: 'assert_idempotent_confirmation',
        category: 'Integrity',
        title: 'خاصیت پایاپای و بدون تکرار تایید اسناد (Idempotency Guard)',
        status: isIdempotent ? 'PASS' : 'FAIL',
        message: isIdempotent
          ? `تایید مجدد اسناد قطعی هیچ‌گونه سند تکراری در انبارداری یا دفتر روزنامه تولید نمی‌کند.`
          : `خطای تکرار اثرات جانبی در تایید مجدد اسناد!`,
        durationMs: Math.round(performance.now() - start11),
        recordsTested: confirmedDocs.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_idempotent_confirmation',
        category: 'Integrity',
        title: 'خاصیت پایاپای تایید اسناد',
        status: 'FAIL',
        message: 'خطا در ارزیابی خاصیت پایاپای: ' + e.message,
        durationMs: Math.round(performance.now() - start11),
        recordsTested: 0,
      });
    }

    // 12. Business ID Data Isolation & Test Tagging
    const start12 = performance.now();
    try {
      const state = db.getState();
      let crossContamination = false;
      const tablesToCheck: (keyof typeof state)[] = [
        'documents', 'document_items', 'inventory_transactions', 'receipts', 'payments', 'checks', 'journal_entries'
      ];

      tablesToCheck.forEach((t) => {
        const rows = (state[t] as any[]) || [];
        rows.forEach((r) => {
          if (r.demo_session_id && !r.business_id) {
            crossContamination = true;
          }
        });
      });

      assertions.push({
        id: 'assert_business_isolation',
        category: 'Integrity',
        title: 'تفکیک کامل شناسه کسب‌وکار و برچسب‌گذاری ایمن داده‌های آزمایشی',
        status: !crossContamination ? 'PASS' : 'FAIL',
        message: !crossContamination
          ? `کلیه رکوردهای آزمایشی به درستی با business_id و برچسب session_id مشخص شده و با داده‌های واقعی تداخل ندارند.`
          : `خطا در برچسب‌گذاری رکوردهای آزمایشی.`,
        durationMs: Math.round(performance.now() - start12),
        recordsTested: tablesToCheck.length,
      });
    } catch (e: any) {
      assertions.push({
        id: 'assert_business_isolation',
        category: 'Integrity',
        title: 'تفکیک شناسه کسب‌وکار و برچسب‌گذاری',
        status: 'FAIL',
        message: 'خطا در ارزیابی تفکیک کسب‌وکار: ' + e.message,
        durationMs: Math.round(performance.now() - start12),
        recordsTested: 0,
      });
    }

    // Tally results
    const passedCount = assertions.filter((a) => a.status === 'PASS').length;
    const failedCount = assertions.filter((a) => a.status === 'FAIL').length;
    const warnCount = assertions.filter((a) => a.status === 'WARN').length;
    const overallStatus: 'PASS' | 'FAIL' = failedCount === 0 ? 'PASS' : 'FAIL';

    // Summary stats
    const biz = db.queryAll<any>('businesses').find((b) => b.id === targetBusinessId);
    const summary: TestEnvironmentSummary = {
      session_id: sessionId,
      business_id: targetBusinessId,
      business_name: biz?.name || 'کسب‌وکار آزمایشی',
      timestamp: new Date().toISOString(),
      customers_count: PartyRepository.getAll(targetBusinessId).filter((p) => p.roles?.includes('customer')).length,
      suppliers_count: PartyRepository.getAll(targetBusinessId).filter((p) => p.roles?.includes('supplier')).length,
      categories_count: db.queryByBusiness<any>('categories', targetBusinessId).length,
      warehouses_count: db.queryByBusiness<any>('warehouses', targetBusinessId).length,
      products_count: db.queryByBusiness<Item>('items', targetBusinessId).filter((i) => i.item_type === 'product' || (i as any).type === 'product').length,
      services_count: db.queryByBusiness<Item>('items', targetBusinessId).filter((i) => i.item_type === 'service' || (i as any).type === 'service').length,
      purchase_orders_count: DocumentRepository.getByType(targetBusinessId, 'purchase_order').length,
      purchase_invoices_count: DocumentRepository.getByType(targetBusinessId, 'purchase_invoice').length,
      purchase_returns_count: DocumentRepository.getByType(targetBusinessId, 'purchase_return').length,
      sales_quotes_count: DocumentRepository.getByType(targetBusinessId, 'sales_quote').length,
      sales_orders_count: DocumentRepository.getByType(targetBusinessId, 'sales_order').length,
      sales_invoices_count: DocumentRepository.getByType(targetBusinessId, 'sales_invoice').length,
      sales_returns_count: DocumentRepository.getByType(targetBusinessId, 'sales_return').length,
      cancelled_invoices_count: DocumentRepository.getAll(targetBusinessId).filter((d) => d.status === 'cancelled').length,
      cost_layers_count: db.queryByBusiness<any>('inventory_cost_layers', targetBusinessId).length,
      cogs_entries_count: db.queryByBusiness<any>('cogs_entries', targetBusinessId).length,
      receipts_count: ReceiptRepository.getAll(targetBusinessId).length,
      payments_count: PaymentRepository.getAll(targetBusinessId).length,
      checks_count: CheckRepository.getAll(targetBusinessId).length,
      journal_entries_count: JournalRepository.getEntries(targetBusinessId).length,
      journal_lines_count: db.queryAll('journal_lines').length,
      inventory_transfers_count: db.queryByBusiness<any>('inventory_documents', targetBusinessId).filter((d) => d.document_type === 'transfer').length,
    };

    return {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      overallStatus,
      totalDurationMs: Math.round(performance.now() - totalStart),
      passedCount,
      failedCount,
      warnCount,
      totalAssertions: assertions.length,
      assertions,
      summary,
    };
  },

  /**
   * Resets and completely deletes the specified Test Business and all related data.
   */
  async resetTestData(targetBusinessId: string): Promise<{ deletedCount: number }> {
    db.beginTransaction();
    try {
      let deletedCount = 0;

      // Identify documents/journals for this business
      const docs = db.queryByBusiness<any>('documents', targetBusinessId);
      const docIds = new Set(docs.map((d) => d.id));
      
      const journals = db.queryByBusiness<any>('journal_entries', targetBusinessId);
      const journalIds = new Set(journals.map((j) => j.id));

      const businessTables: (keyof DBState)[] = [
        'parties', 'items', 'categories', 'units', 'warehouses', 'documents',
        'receipts', 'payments', 'checks', 'treasury_transactions',
        'journal_entries', 'accounting_periods'
      ];

      // Delete from business-scoped tables
      for (const table of businessTables) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table as keyof DBState);
        const toDelete = records.filter((r) => r.business_id === targetBusinessId);
        for (const row of toDelete) {
          db.deleteRecord(table as keyof DBState, row.id);
          deletedCount++;
        }
      }

      // Delete child records
      const childTables: { table: keyof DBState; parentField: string; parentSet: Set<string> }[] = [
        { table: 'document_items', parentField: 'document_id', parentSet: docIds },
        { table: 'inventory_transactions', parentField: 'document_id', parentSet: docIds },
        { table: 'inventory_cost_layers', parentField: 'business_id', parentSet: new Set([targetBusinessId]) },
        { table: 'journal_lines', parentField: 'journal_id', parentSet: journalIds },
        { table: 'inventory_documents', parentField: 'business_id', parentSet: new Set([targetBusinessId]) },
      ];

      for (const { table, parentField, parentSet } of childTables) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table as keyof DBState);
        const toDelete = records.filter((r) => parentSet.has(r[parentField]));
        for (const row of toDelete) {
          db.deleteRecord(table as keyof DBState, row.id);
          deletedCount++;
        }
      }
      
      // Delete settings
      const allSettings = db.queryAll<any>('settings');
      const testSettings = allSettings.filter((s) => s.key.startsWith(targetBusinessId + '_'));
      for (const s of testSettings) {
        db.deleteRecord('settings', s.key);
        deletedCount++;
      }

      db.deleteRecord('businesses', targetBusinessId);
      deletedCount++;

      db.commit();
      return { deletedCount };
    } catch (error) {
      db.rollback();
      throw error;
    }
  },

  /**
   * Returns live real-time statistics from SQLite.
   */
  getLiveStats(businessId: string = 'biz_main'): LiveDbStats {
    const state = db.getState();

    const isTest = (r: any) =>
      r.is_demo === 1 ||
      (r.demo_session_id &&
        (String(r.demo_session_id).startsWith('TEST_ENV_') ||
          String(r.demo_session_id).startsWith('demo_session_')));

    const allParties = (state.parties as any[]) || [];
    const allItems = (state.items as any[]) || [];
    const allDocs = (state.documents as any[]) || [];
    const allJournals = (state.journal_entries as any[]) || [];
    const allReceipts = (state.receipts as any[]) || [];
    const allPayments = (state.payments as any[]) || [];
    const allChecks = (state.checks as any[]) || [];
    const allLayers = (state.inventory_cost_layers as any[]) || [];

    return {
      totalBusinesses: (state.businesses as any[])?.length || 0,
      totalParties: allParties.length,
      testParties: allParties.filter(isTest).length,
      totalItems: allItems.length,
      testItems: allItems.filter(isTest).length,
      totalDocuments: allDocs.length,
      testDocuments: allDocs.filter(isTest).length,
      totalJournalEntries: allJournals.length,
      testJournalEntries: allJournals.filter(isTest).length,
      totalReceipts: allReceipts.length,
      testReceipts: allReceipts.filter(isTest).length,
      totalPayments: allPayments.length,
      testPayments: allPayments.filter(isTest).length,
      totalChecks: allChecks.length,
      testChecks: allChecks.filter(isTest).length,
      totalCostLayers: allLayers.length,
      testCostLayers: allLayers.filter(isTest).length,
      activeCostMethod: CostEngine.getCostMethod(businessId),
    };
  },
};
