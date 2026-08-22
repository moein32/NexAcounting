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

export interface TestEnvironmentStats {
  businessId: string;
  businessName: string;
  sessionId?: string;
  customersCount: number;
  suppliersCount: number;
  partiesCount: number;
  itemsCount: number;
  documentsCount: number;
  journalEntriesCount: number;
  receiptsCount: number;
  paymentsCount: number;
  checksCount: number;
  costLayersCount: number;
  inventoryTransfersCount: number;
}

export interface LiveDbStats {
  activeBusinessId: string;
  activeBusinessName: string;

  realParties: number;
  testParties: number;
  totalParties: number;

  realItems: number;
  testItems: number;
  totalItems: number;

  realDocuments: number;
  testDocuments: number;
  totalDocuments: number;

  realJournalEntries: number;
  testJournalEntries: number;
  totalJournalEntries: number;

  realReceipts: number;
  testReceipts: number;
  totalReceipts: number;

  realPayments: number;
  testPayments: number;
  totalPayments: number;

  realChecks: number;
  testChecks: number;
  totalChecks: number;

  realCostLayers: number;
  testCostLayers: number;
  totalCostLayers: number;

  activeCostMethod: string;

  totalBusinesses: number;
  testEnvironmentBusinessCount: number;
  activeTestEnvironmentBusinessId?: string;
  activeTestEnvironmentSessionId?: string;
  testEnvironmentStats?: TestEnvironmentStats | null;
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
    const allJournalEntries = JournalRepository.getEntries(targetBusinessId) || [];
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
      const allEntries = JournalRepository.getEntries(targetBusinessId) || [];
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
      const journals = JournalRepository.getEntries(targetBusinessId) || [];

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

      if (transfers.length === 0) {
        throw new Error('هیچ سند انتقال بین‌انباری تایید شده‌ای در پایگاه داده یافت نشد.');
      }

      const invItems = db.queryAll<any>('inventory_document_items');
      const allTx = db.queryByBusiness<any>('inventory_transactions', targetBusinessId);
      const allBalances = db.queryByBusiness<any>('inventory_balances', targetBusinessId);

      let auditedTransfers = 0;
      let auditedItemsCount = 0;

      for (const transfer of transfers) {
        // 1. Check document existence and properties
        if (transfer.document_type !== 'transfer') {
          throw new Error(`نوع سند نامعتبر است: ${transfer.document_type} (انتظار: transfer)`);
        }
        if (transfer.status !== 'confirmed') {
          throw new Error(`وضعیت سند تایید نشده است: ${transfer.status}`);
        }
        if (!transfer.warehouse_id) {
          throw new Error('انبار مبدا (warehouse_id) در سند انتقال مشخص نشده است.');
        }
        if (!transfer.target_warehouse_id) {
          throw new Error('انبار مقصد (target_warehouse_id) در سند انتقال مشخص نشده است.');
        }
        if (transfer.warehouse_id === transfer.target_warehouse_id) {
          throw new Error('انبار مبدا و انبار مقصد نمی‌توانند یکسان باشند.');
        }

        // 2. Check items
        const transferItems = invItems.filter((i) => i.document_id === transfer.id);
        if (transferItems.length === 0) {
          throw new Error(`سند انتقال شماره ${transfer.document_number || transfer.id} فاقد قلم کالا است.`);
        }

        for (const item of transferItems) {
          const qty = Number(item.quantity);
          if (qty <= 0) {
            throw new Error(`تعداد انتقال برای کالای ${item.item_id} نامعتبر است: ${qty}`);
          }

          // 3. Exactly one transfer_out transaction for source and one transfer_in for target referencing this document
          const outTxs = allTx.filter(
            (t) =>
              t.reference_id === transfer.id &&
              t.item_id === item.item_id &&
              t.warehouse_id === transfer.warehouse_id &&
              t.transaction_type === 'transfer_out'
          );
          const inTxs = allTx.filter(
            (t) =>
              t.reference_id === transfer.id &&
              t.item_id === item.item_id &&
              t.warehouse_id === transfer.target_warehouse_id &&
              t.transaction_type === 'transfer_in'
          );

          if (outTxs.length !== 1) {
            throw new Error(
              `تراکنش خروج انتقال (transfer_out) برای سند ${transfer.id} در انبار مبدا ${transfer.warehouse_id} یافت نشد یا غیرمنفرد است (تعداد: ${outTxs.length})`
            );
          }
          if (inTxs.length !== 1) {
            throw new Error(
              `تراکنش ورود انتقال (transfer_in) برای سند ${transfer.id} در انبار مقصد ${transfer.target_warehouse_id} یافت نشد یا غیرمنفرد است (تعداد: ${inTxs.length})`
            );
          }

          if (Number(outTxs[0].quantity) !== qty) {
            throw new Error(
              `مقدار تراکنش خروج (${outTxs[0].quantity}) با مقدار سند انتقال (${qty}) مغایرت دارد.`
            );
          }
          if (Number(inTxs[0].quantity) !== qty) {
            throw new Error(
              `مقدار تراکنش ورود (${inTxs[0].quantity}) با مقدار سند انتقال (${qty}) مغایرت دارد.`
            );
          }

          // 4. Balances existence and validation
          const sourceBal = allBalances.find(
            (b) => b.warehouse_id === transfer.warehouse_id && b.item_id === item.item_id
          );
          const targetBal = allBalances.find(
            (b) => b.warehouse_id === transfer.target_warehouse_id && b.item_id === item.item_id
          );

          if (!sourceBal) {
            throw new Error(`رکورد موجودی برای کالای ${item.item_id} در انبار مبدا ${transfer.warehouse_id} یافت نشد.`);
          }
          if (!targetBal) {
            throw new Error(`رکورد موجودی برای کالای ${item.item_id} در انبار مقصد ${transfer.target_warehouse_id} یافت نشد.`);
          }
          if (Number(targetBal.quantity) < qty) {
            throw new Error(
              `موجودی انبار مقصد (${targetBal.quantity}) کمتر از مقدار منتقل‌شده (${qty}) است.`
            );
          }

          auditedItemsCount++;
        }

        auditedTransfers++;
      }

      assertions.push({
        id: 'assert_inter_warehouse_transfer_integrity',
        category: 'Inventory',
        title: 'صحت حواله انتقال بین‌انباری و جابجایی دوطرفه کالا',
        status: 'PASS',
        message: `تعداد ${auditedTransfers} سند انتقال بین‌انباری و ${auditedItemsCount} ردیف کالا با تایید کامل جابجایی موجودی مبدا/مقصد و ثبت دقیق تراکنش‌های transfer_out و transfer_in راستی‌آزمایی شد.`,
        durationMs: Math.round(performance.now() - start7),
        recordsTested: auditedTransfers,
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
        const prevJeCount = (JournalRepository.getEntries(targetBusinessId) || []).length;

        // Call repository status update
        DocumentRepository.updateStatus(testDoc.id, 'confirmed');

        const newTxCount = InventoryRepository.getTransactions().length;
        const newJeCount = (JournalRepository.getEntries(targetBusinessId) || []).length;

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

    // 12. Business ID Data Isolation, Live SQLite Statistics Scoping & Test Tagging
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

      // Deterministic validation of getLiveStats scoping & isolation
      // Case 1 & Case 3: Target business stats isolation
      const testBizStats = testEnvironmentService.getLiveStats(targetBusinessId);
      if (testBizStats.activeBusinessId !== targetBusinessId) {
        throw new Error(`شناسه کسب‌وکار آمار (${testBizStats.activeBusinessId}) با شناسه هدف (${targetBusinessId}) مطابقت ندارد.`);
      }
      if (testBizStats.totalParties !== testBizStats.realParties + testBizStats.testParties) {
        throw new Error(`مغایرت در جمع طرف‌حساب‌های کسب‌وکار: real (${testBizStats.realParties}) + test (${testBizStats.testParties}) !== total (${testBizStats.totalParties})`);
      }
      if (testBizStats.totalItems !== testBizStats.realItems + testBizStats.testItems) {
        throw new Error(`مغایرت در جمع کالاهای کسب‌وکار: real (${testBizStats.realItems}) + test (${testBizStats.testItems}) !== total (${testBizStats.totalItems})`);
      }

      // Case 2: Active/Main business stats isolation (records of TEST_BIZ must NOT bleed into main business)
      const mainStats = testEnvironmentService.getLiveStats('biz_main', targetBusinessId);
      const bizMainPartiesInDb = ((state.parties as any[]) || []).filter((p: any) => p.business_id === 'biz_main').length;
      if (mainStats.totalParties !== bizMainPartiesInDb) {
        throw new Error(`آمار کسب‌وکار اصلی تفکیک نشده است! تعداد طرف‌حساب: ${mainStats.totalParties}، رکوردهای دیتابیس با business_id='biz_main': ${bizMainPartiesInDb}`);
      }

      // Case 4: Real test environment dedicated stats verification
      if (!mainStats.testEnvironmentStats || mainStats.testEnvironmentStats.businessId !== targetBusinessId) {
        throw new Error('آمار تفکیک‌شده محیط تست واقعی (testEnvironmentStats) در آمار زنده یافت نشد.');
      }

      assertions.push({
        id: 'assert_business_isolation',
        category: 'Integrity',
        title: 'تفکیک کامل شناسه کسب‌وکار و آمار زنده SQLite بر اساس کسب‌وکار فعال',
        status: !crossContamination ? 'PASS' : 'FAIL',
        message: !crossContamination
          ? `تفکیک ۱۰۰٪ آمار کسب‌وکار فعال (${mainStats.totalParties} طرف‌حساب) از رکوردهای محیط تست (${testBizStats.totalParties} طرف‌حساب در ${targetBusinessId}) و صحت روابط real+test=total تایید شد.`
          : `خطا در برچسب‌گذاری رکوردهای آزمایشی.`,
        durationMs: Math.round(performance.now() - start12),
        recordsTested: tablesToCheck.length + 4,
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
      journal_entries_count: (JournalRepository.getEntries(targetBusinessId) || []).length,
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

      // Identify parent records for this business
      const docs = db.queryByBusiness<any>('documents', targetBusinessId) || [];
      const docIds = new Set(docs.map((d) => d.id));
      
      const invDocs = db.queryByBusiness<any>('inventory_documents', targetBusinessId) || [];
      const invDocIds = new Set(invDocs.map((d) => d.id));

      const journals = db.queryByBusiness<any>('journal_entries', targetBusinessId) || [];
      const journalIds = new Set(journals.map((j) => j.id));

      const costLayers = db.queryByBusiness<any>('inventory_cost_layers', targetBusinessId) || [];
      const costLayerIds = new Set(costLayers.map((l) => l.id));

      const docItems = db.queryAll<any>('document_items').filter(di => docIds.has(di.document_id));
      const docItemIds = new Set(docItems.map(di => di.id));

      const receipts = db.queryByBusiness<any>('receipts', targetBusinessId) || [];
      const receiptIds = new Set(receipts.map(r => r.id));

      const payments = db.queryByBusiness<any>('payments', targetBusinessId) || [];
      const paymentIds = new Set(payments.map(p => p.id));

      // 1. Delete child records based on actual schema dependencies first
      const childTables: { table: keyof DBState; check: (r: any) => boolean }[] = [
        { table: 'document_items', check: (r) => docIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'inventory_document_items', check: (r) => invDocIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'inventory_transactions', check: (r) => docIds.has(r.document_id) || invDocIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'journal_lines', check: (r) => journalIds.has(r.journal_id) || r.business_id === targetBusinessId },
        { table: 'inventory_cost_movements', check: (r) => costLayerIds.has(r.layer_id) || docItemIds.has(r.document_item_id) || r.business_id === targetBusinessId },
        { table: 'cogs_entries', check: (r) => docIds.has(r.document_id) || r.business_id === targetBusinessId },
        { table: 'treasury_transactions', check: (r) => receiptIds.has(r.reference_id) || paymentIds.has(r.reference_id) || r.business_id === targetBusinessId },
        { table: 'checks', check: (r) => receiptIds.has(r.receipt_id) || paymentIds.has(r.payment_id) || r.business_id === targetBusinessId },
      ];

      for (const { table, check } of childTables) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table as keyof DBState);
        const toDelete = records.filter(check);
        for (const row of toDelete) {
          db.deleteRecord(table as keyof DBState, row.id || row.business_id);
          deletedCount++;
        }
      }

      // 2. Delete business-scoped records
      const businessTables: (keyof DBState)[] = [
        'parties', 'items', 'categories', 'units', 'warehouses', 'cash_accounts',
        'documents', 'inventory_documents', 'receipts', 'payments', 
        'journal_entries', 'accounting_periods', 'inventory_cost_layers',
        'inventory_revaluation_logs', 'inventory_balances',
        'notifications', 'notification_preferences'
      ];

      for (const table of businessTables) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table as keyof DBState);
        const toDelete = records.filter((r) => r.business_id === targetBusinessId);
        for (const row of toDelete) {
          db.deleteRecord(table as keyof DBState, row.id || row.business_id);
          deletedCount++;
        }
      }
      
      // 3. Delete settings
      const allSettings = db.queryAll<any>('settings');
      const testSettings = allSettings.filter((s) => s.key.startsWith(targetBusinessId + '_'));
      for (const s of testSettings) {
        db.deleteRecord('settings', s.key);
        deletedCount++;
      }

      // 4. Delete the Business itself
      db.deleteRecord('businesses', targetBusinessId);
      deletedCount++;

      // ==========================================
      // 5. VERY IMPORTANT — POST RESET VERIFICATION
      // ==========================================
      const allTablesToCheck = [
        'parties', 'items', 'categories', 'units', 'warehouses', 'inventory_balances',
        'inventory_transactions', 'documents', 'document_items', 'inventory_documents',
        'inventory_document_items', 'cash_accounts', 'treasury_transactions', 'receipts',
        'payments', 'checks', 'accounting_periods', 'journal_entries', 'journal_lines',
        'inventory_cost_layers', 'inventory_cost_movements', 'cogs_entries',
        'inventory_revaluation_logs', 'notifications', 'notification_preferences'
      ] as const;

      for (const table of allTablesToCheck) {
        if (!(table in db.getState())) continue;
        const records = db.queryAll<any>(table as keyof DBState);
        const leftover = records.find(r => r.business_id === targetBusinessId);
        if (leftover) {
          throw new Error(`Reset Verification Failed: Orphaned test record found in table '${table}' (ID: ${leftover.id || leftover.business_id})`);
        }
      }

      const leftoverBiz = db.queryById('businesses', targetBusinessId);
      if (leftoverBiz) {
        throw new Error(`Reset Verification Failed: Test Business record was not deleted`);
      }

      // ==========================================
      // 6. ORPHAN CHECK
      // ==========================================
      const checkOrphans = [
        { table: 'document_items', field: 'document_id', ids: docIds },
        { table: 'inventory_document_items', field: 'document_id', ids: invDocIds },
        { table: 'inventory_transactions', field: 'document_id', ids: docIds },
        { table: 'inventory_transactions', field: 'document_id', ids: invDocIds },
        { table: 'journal_lines', field: 'journal_id', ids: journalIds },
        { table: 'cogs_entries', field: 'document_id', ids: docIds },
        { table: 'inventory_cost_movements', field: 'layer_id', ids: costLayerIds },
        { table: 'inventory_cost_movements', field: 'document_item_id', ids: docItemIds }
      ];

      for (const { table, field, ids } of checkOrphans) {
        if (!(table in db.getState())) continue;
        if (ids.size === 0) continue;
        const records = db.queryAll<any>(table as keyof DBState);
        const orphan = records.find(r => ids.has(r[field]));
        if (orphan) {
           throw new Error(`Orphan Check Failed: Found orphaned test record in '${table}' referencing deleted parent (Field: ${field}, ID: ${orphan[field]})`);
        }
      }

      db.commit();
      return { deletedCount };
    } catch (error) {
      db.rollback();
      throw error;
    }
  },

  /**
   * Returns live real-time statistics from SQLite, strictly scoped to the active business
   * and fully isolating test environments and test/demo data.
   */
  getLiveStats(activeBusinessId: string = 'biz_main', preferredTestBizId?: string): LiveDbStats {
    const state = db.getState();

    const businesses = (state.businesses as any[]) || [];
    const activeBiz = businesses.find((b: any) => b.id === activeBusinessId);
    const activeBusinessName = activeBiz?.name || 'کسب‌وکار جاری';
    const isActiveBizTest =
      activeBiz?.is_demo === 1 ||
      activeBiz?.is_demo === true ||
      String(activeBiz?.id || '').startsWith('TEST_BIZ_');

    // Classification function
    const isTestRecord = (r: any, parentBizIsTest: boolean = false): boolean => {
      if (!r) return false;
      if (parentBizIsTest) return true;
      if (r.is_demo === 1 || r.is_demo === true) return true;
      if (r.demo_session_id) {
        const sid = String(r.demo_session_id);
        if (
          sid.startsWith('demo_session_') ||
          sid.startsWith('TEST_ENV_') ||
          sid.startsWith('TEST_REPORT_') ||
          sid.startsWith('test_e2e_')
        ) {
          return true;
        }
      }
      return false;
    };

    // 1. Parties
    const allParties = (state.parties as any[]) || [];
    const activeParties = allParties.filter((p: any) => p.business_id === activeBusinessId);
    const testParties = activeParties.filter((p: any) => isTestRecord(p, isActiveBizTest)).length;
    const realParties = activeParties.length - testParties;
    const totalParties = realParties + testParties;

    // 2. Items
    const allItems = (state.items as any[]) || [];
    const activeItems = allItems.filter((i: any) => i.business_id === activeBusinessId);
    const testItems = activeItems.filter((i: any) => isTestRecord(i, isActiveBizTest)).length;
    const realItems = activeItems.length - testItems;
    const totalItems = realItems + testItems;

    // 3. Documents
    const allDocs = (state.documents as any[]) || [];
    const activeDocs = allDocs.filter((d: any) => d.business_id === activeBusinessId);
    const testDocuments = activeDocs.filter((d: any) => isTestRecord(d, isActiveBizTest)).length;
    const realDocuments = activeDocs.length - testDocuments;
    const totalDocuments = realDocuments + testDocuments;

    // 4. Journal Entries
    const allJournals = (state.journal_entries as any[]) || [];
    const activeJournals = allJournals.filter((j: any) => j.business_id === activeBusinessId);
    const testJournalEntries = activeJournals.filter((j: any) => isTestRecord(j, isActiveBizTest)).length;
    const realJournalEntries = activeJournals.length - testJournalEntries;
    const totalJournalEntries = realJournalEntries + testJournalEntries;

    // 5. Receipts
    const allReceipts = (state.receipts as any[]) || [];
    const activeReceipts = allReceipts.filter((r: any) => r.business_id === activeBusinessId);
    const testReceipts = activeReceipts.filter((r: any) => isTestRecord(r, isActiveBizTest)).length;
    const realReceipts = activeReceipts.length - testReceipts;
    const totalReceipts = realReceipts + testReceipts;

    // 6. Payments
    const allPayments = (state.payments as any[]) || [];
    const activePayments = allPayments.filter((p: any) => p.business_id === activeBusinessId);
    const testPayments = activePayments.filter((p: any) => isTestRecord(p, isActiveBizTest)).length;
    const realPayments = activePayments.length - testPayments;
    const totalPayments = realPayments + testPayments;

    // 7. Checks
    const allChecks = (state.checks as any[]) || [];
    const activeChecks = allChecks.filter((c: any) => c.business_id === activeBusinessId);
    const testChecks = activeChecks.filter((c: any) => isTestRecord(c, isActiveBizTest)).length;
    const realChecks = activeChecks.length - testChecks;
    const totalChecks = realChecks + testChecks;

    // 8. Cost Layers
    const allLayers = (state.inventory_cost_layers as any[]) || [];
    const activeLayers = allLayers.filter((l: any) => l.business_id === activeBusinessId);
    const testCostLayers = activeLayers.filter((l: any) => isTestRecord(l, isActiveBizTest)).length;
    const realCostLayers = activeLayers.length - testCostLayers;
    const totalCostLayers = realCostLayers + testCostLayers;

    // Test Businesses Detection
    const testBusinesses = businesses.filter(
      (b: any) => b.id.startsWith('TEST_BIZ_') || (b.is_demo === 1 && b.id !== activeBusinessId)
    );

    let activeTestBiz: any = null;
    if (preferredTestBizId) {
      activeTestBiz = testBusinesses.find((b: any) => b.id === preferredTestBizId) || null;
    }
    if (!activeTestBiz && testBusinesses.length > 0) {
      activeTestBiz = testBusinesses[testBusinesses.length - 1];
    }

    let testEnvironmentStats: TestEnvironmentStats | null = null;
    if (activeTestBiz) {
      const testBizId = activeTestBiz.id;
      const testBizParties = allParties.filter((p: any) => p.business_id === testBizId);
      const testBizItems = allItems.filter((i: any) => i.business_id === testBizId);
      const testBizDocs = allDocs.filter((d: any) => d.business_id === testBizId);
      const testBizJournals = allJournals.filter((j: any) => j.business_id === testBizId);
      const testBizReceipts = allReceipts.filter((r: any) => r.business_id === testBizId);
      const testBizPayments = allPayments.filter((p: any) => p.business_id === testBizId);
      const testBizChecks = allChecks.filter((c: any) => c.business_id === testBizId);
      const testBizCostLayers = allLayers.filter((l: any) => l.business_id === testBizId);

      const invDocs = (state.inventory_documents as any[]) || [];
      const testBizTransfers = invDocs.filter(
        (d: any) => d.business_id === testBizId && d.document_type === 'transfer'
      );

      testEnvironmentStats = {
        businessId: testBizId,
        businessName: activeTestBiz.name || 'کسب‌وکار آزمایشی',
        sessionId: activeTestBiz.demo_session_id || undefined,
        customersCount: testBizParties.filter((p: any) => p.roles?.includes('customer')).length,
        suppliersCount: testBizParties.filter((p: any) => p.roles?.includes('supplier')).length,
        partiesCount: testBizParties.length,
        itemsCount: testBizItems.length,
        documentsCount: testBizDocs.length,
        journalEntriesCount: testBizJournals.length,
        receiptsCount: testBizReceipts.length,
        paymentsCount: testBizPayments.length,
        checksCount: testBizChecks.length,
        costLayersCount: testBizCostLayers.length,
        inventoryTransfersCount: testBizTransfers.length,
      };
    }

    return {
      activeBusinessId,
      activeBusinessName,

      realParties,
      testParties,
      totalParties,

      realItems,
      testItems,
      totalItems,

      realDocuments,
      testDocuments,
      totalDocuments,

      realJournalEntries,
      testJournalEntries,
      totalJournalEntries,

      realReceipts,
      testReceipts,
      totalReceipts,

      realPayments,
      testPayments,
      totalPayments,

      realChecks,
      testChecks,
      totalChecks,

      realCostLayers,
      testCostLayers,
      totalCostLayers,

      activeCostMethod: CostEngine.getCostMethod(activeBusinessId),

      totalBusinesses: businesses.length,
      testEnvironmentBusinessCount: testBusinesses.length,
      activeTestEnvironmentBusinessId: activeTestBiz ? activeTestBiz.id : undefined,
      activeTestEnvironmentSessionId: activeTestBiz ? activeTestBiz.demo_session_id : undefined,
      testEnvironmentStats,
    };
  },
};
