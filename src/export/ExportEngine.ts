import { ExportFilterOptions, ExportCategory } from './ExportTypes';
import { ExcelExporter } from './exporters/ExcelExporter';
import { WordExporter } from './exporters/WordExporter';
import { PdfExporter } from './exporters/PdfExporter';
import { EXPORT_FIELD_SCHEMAS } from './ExportTemplate';
import { formatCurrency, formatPersianDate } from '../lib/utils';
import {
  DocumentRepository,
  PartyRepository,
  ItemRepository,
  InventoryRepository,
  BusinessRepository,
  DocumentItem,
} from '../repositories';
import { TreasuryRepository } from '../repositories/treasuryRepository';
import { db } from '../lib/sqlite';

export class ExportEngine {
  /**
   * Generates multi-sheet Excel export based on category.
   */
  public static async exportToExcel(category: ExportCategory, options: ExportFilterOptions): Promise<void> {
    const business = BusinessRepository.getProfile();
    const businessName = business?.name || 'کسب‌وکار';

    if (category === 'sales') {
      const docs = DocumentRepository.getAll(options.businessId).filter((d) =>
        d.document_type.startsWith('sales_')
      );
      const items = db.queryAll<DocumentItem>('document_items');

      const docRows = docs.map((d) => {
        const party = PartyRepository.getById(d.party_id);
        const warehouses = InventoryRepository.getWarehouses(options.businessId);
        const wh = warehouses.find((w) => w.id === d.warehouse_id);

        return {
          ...d,
          party_name: party?.name || 'مشتری ناشناس',
          warehouse_name: wh?.name || 'انبار اصلی',
          status_label: d.status === 'confirmed' ? 'تایید شده' : d.status === 'draft' ? 'پیش‌نویس' : 'باطل شده',
        };
      });

      const itemRows = items
        .filter((i) => docs.some((d) => d.id === i.document_id))
        .map((i) => {
          const parentDoc = docs.find((d) => d.id === i.document_id);
          const itemDef = ItemRepository.getById(i.item_id);
          const cogs = (itemDef?.purchase_price || 0) * i.quantity;
          const profit = i.line_total - cogs;

          return {
            ...i,
            document_number: parentDoc?.document_number || '---',
            item_code: itemDef?.code || '---',
            item_name: itemDef?.name || 'کالا',
            estimated_cogs: cogs,
            estimated_profit: profit,
          };
        });

      ExcelExporter.exportWorkbook(
        [
          { sheetName: 'فاکتورهای فروش', schemaKey: 'sales_invoices', data: docRows },
          { sheetName: 'آیتم‌های فاکتور فروش', schemaKey: 'sales_items', data: itemRows },
        ],
        `فاکتورهای_فروش_${businessName}`
      );
    } else if (category === 'purchases') {
      const docs = DocumentRepository.getAll(options.businessId).filter((d) =>
        d.document_type.startsWith('purchase_')
      );

      const docRows = docs.map((d) => {
        const party = PartyRepository.getById(d.party_id);
        const warehouses = InventoryRepository.getWarehouses(options.businessId);
        const wh = warehouses.find((w) => w.id === d.warehouse_id);

        return {
          ...d,
          party_name: party?.name || 'تأمین‌کننده',
          warehouse_name: wh?.name || 'انبار اصلی',
          status_label: d.status === 'confirmed' ? 'تایید شده' : 'پیش‌نویس',
        };
      });

      ExcelExporter.exportWorkbook(
        [{ sheetName: 'فاکتورهای خرید', schemaKey: 'purchase_invoices', data: docRows }],
        `فاکتورهای_خرید_${businessName}`
      );
    } else if (category === 'inventory') {
      const products = ItemRepository.getAll(options.businessId);
      const warehouses = InventoryRepository.getWarehouses(options.businessId);
      const balances = InventoryRepository.getBalances();
      const categories = ItemRepository.getCategories();
      const units = ItemRepository.getUnits();

      const inventoryRows = products.map((p) => {
        const cat = categories.find((c) => c.id === p.category_id);
        const unit = units.find((u) => u.id === p.unit_id);
        const totalQty = balances
          .filter((b) => b.item_id === p.id)
          .reduce((sum, b) => sum + b.quantity, 0);

        return {
          ...p,
          category_name: cat?.name || 'بدون دسته',
          unit_name: unit?.name || 'عدد',
          warehouse_name: warehouses[0]?.name || 'انبار مرکزی',
          quantity: totalQty,
          inventory_value: totalQty * (p.purchase_price || 0),
        };
      });

      ExcelExporter.exportWorkbook(
        [{ sheetName: 'گزارش موجودی کالا', schemaKey: 'inventory_stock', data: inventoryRows }],
        `گزارش_موجودی_کالا_${businessName}`
      );
    } else if (category === 'treasury') {
      const accounts = TreasuryRepository.getAccounts(options.businessId);
      const txs = TreasuryRepository.getTransactions(options.businessId);

      const accRows = accounts.map((a) => ({
        ...a,
        code: a.id.substring(0, 8),
        title: a.name,
        type: a.account_type === 'bank' ? 'بانک' : a.account_type === 'cash' ? 'صندوق' : 'سایر',
        balance: a.current_balance,
      }));

      const txRows = txs.map((t) => {
        const acc = accounts.find((a) => a.id === t.account_id);
        const party = t.party_id ? PartyRepository.getById(t.party_id) : null;

        return {
          ...t,
          date: t.transaction_date,
          type_label: t.transaction_type === 'IN' ? 'دریافت' : 'پرداخت',
          account_name: acc?.name || '---',
          party_name: party?.name || '---',
        };
      });

      ExcelExporter.exportWorkbook(
        [
          { sheetName: 'حساب‌های مالی', schemaKey: 'treasury_accounts', data: accRows },
          { sheetName: 'گردش صندوق و بانک', schemaKey: 'treasury_transactions', data: txRows },
        ],
        `گزارش_خزانه_${businessName}`
      );
    } else if (category === 'reports') {
      const parties = PartyRepository.getAll(options.businessId);

      const partyRows = parties.map((p) => {
        const docs = DocumentRepository.getAll(options.businessId).filter(
          (d) => d.party_id === p.id && d.status === 'confirmed'
        );

        let balance = 0;
        docs.forEach((d) => {
          if (d.document_type === 'sales_invoice') balance += d.total_amount;
          else if (d.document_type === 'purchase_invoice') balance -= d.total_amount;
        });

        return {
          ...p,
          role_label: p.roles.includes('customer') ? 'مشتری' : 'تأمین‌کننده',
          balance: Math.abs(balance),
          status_text: balance > 0 ? 'بدهکار' : balance < 0 ? 'بستانکار' : 'تسویه',
        };
      });

      ExcelExporter.exportWorkbook(
        [{ sheetName: 'مانده حساب طرف‌های حساب', schemaKey: 'parties_balance', data: partyRows }],
        `گزارش_مانده_حسابها_${businessName}`
      );
    }
  }

  /**
   * Generates Word DOCX export for reports.
   */
  public static async exportToWord(category: ExportCategory, options: ExportFilterOptions): Promise<void> {
    const business = BusinessRepository.getProfile();
    const businessName = business?.name || 'کسب‌وکار';

    if (category === 'reports' || category === 'inventory') {
      const products = ItemRepository.getAll(options.businessId);
      const balances = InventoryRepository.getBalances();

      const dataRows = products.map((p) => {
        const qty = balances.filter((b) => b.item_id === p.id).reduce((s, b) => s + b.quantity, 0);
        return {
          ...p,
          quantity: qty,
          inventory_value: qty * (p.purchase_price || 0),
        };
      });

      const totalVal = dataRows.reduce((s, r) => s + r.inventory_value, 0);

      await WordExporter.exportReport(
        {
          title: 'گزارش ارزیابی و موجودی انبار',
          businessName,
          generatedDate: new Date().toISOString(),
          schemaKey: 'inventory_stock',
          data: dataRows,
          summaryCards: [
            { label: 'تعداد کل تنوع کالایی:', value: products.length },
            { label: 'ارزش ریالی کل انبار:', value: totalVal },
          ],
        },
        `گزارش_مدیریتی_انبار_${businessName}`
      );
    } else {
      const parties = PartyRepository.getAll(options.businessId);
      const partyRows = parties.map((p) => ({
        ...p,
        role_label: p.roles.join(' / '),
        balance: 0,
        status_text: 'تسویه',
      }));

      await WordExporter.exportReport(
        {
          title: 'دفتر و کشف حساب طرف‌های حساب',
          businessName,
          generatedDate: new Date().toISOString(),
          schemaKey: 'parties_balance',
          data: partyRows,
        },
        `دفتر_طرف_حسابها_${businessName}`
      );
    }
  }

  /**
   * Generates PDF export for the given category using PdfExporter.
   */
  public static async exportToPdf(category: ExportCategory, options: ExportFilterOptions): Promise<void> {
    const business = BusinessRepository.getProfile();
    const businessName = business?.name || 'کسب‌وکار';

    let title = '';
    let schemaKey = '';
    let dataRows: Record<string, any>[] = [];

    if (category === 'sales') {
      title = 'گزارش فاکتورهای فروش';
      schemaKey = 'sales_invoices';
      const docs = DocumentRepository.getAll(options.businessId).filter((d) => d.document_type.startsWith('sales_'));
      dataRows = docs.map((d) => {
        const party = PartyRepository.getById(d.party_id);
        const warehouses = InventoryRepository.getWarehouses(options.businessId);
        const wh = warehouses.find((w) => w.id === d.warehouse_id);
        return {
          ...d,
          party_name: party?.name || 'مشتری ناشناس',
          warehouse_name: wh?.name || 'انبار اصلی',
          status_label: d.status === 'confirmed' ? 'تایید شده' : d.status === 'draft' ? 'پیش‌نویس' : 'باطل شده',
        };
      });
    } else if (category === 'purchases') {
      title = 'گزارش فاکتورهای خرید';
      schemaKey = 'purchase_invoices';
      const docs = DocumentRepository.getAll(options.businessId).filter((d) => d.document_type.startsWith('purchase_'));
      dataRows = docs.map((d) => {
        const party = PartyRepository.getById(d.party_id);
        const warehouses = InventoryRepository.getWarehouses(options.businessId);
        const wh = warehouses.find((w) => w.id === d.warehouse_id);
        return {
          ...d,
          party_name: party?.name || 'تأمین‌کننده',
          warehouse_name: wh?.name || 'انبار اصلی',
          status_label: d.status === 'confirmed' ? 'تایید شده' : 'پیش‌نویس',
        };
      });
    } else if (category === 'inventory') {
      title = 'گزارش موجودی کالا و انبار';
      schemaKey = 'inventory_stock';
      const products = ItemRepository.getAll(options.businessId);
      const warehouses = InventoryRepository.getWarehouses(options.businessId);
      const balances = InventoryRepository.getBalances();
      const categories = ItemRepository.getCategories();
      const units = ItemRepository.getUnits();
      dataRows = products.map((p) => {
        const cat = categories.find((c) => c.id === p.category_id);
        const unit = units.find((u) => u.id === p.unit_id);
        const totalQty = balances.filter((b) => b.item_id === p.id).reduce((sum, b) => sum + b.quantity, 0);
        return {
          ...p,
          category_name: cat?.name || 'بدون دسته',
          unit_name: unit?.name || 'عدد',
          warehouse_name: warehouses[0]?.name || 'انبار مرکزی',
          quantity: totalQty,
          inventory_value: totalQty * (p.purchase_price || 0),
        };
      });
    } else if (category === 'treasury') {
      title = 'گزارش گردش تراکنش‌های خزانه';
      schemaKey = 'treasury_transactions';
      const accounts = TreasuryRepository.getAccounts(options.businessId);
      const txs = TreasuryRepository.getTransactions(options.businessId);
      dataRows = txs.map((t) => {
        const acc = accounts.find((a) => a.id === t.account_id);
        const party = t.party_id ? PartyRepository.getById(t.party_id) : null;
        return {
          ...t,
          date: t.transaction_date,
          type_label: t.transaction_type === 'IN' ? 'دریافت' : 'پرداخت',
          account_name: acc?.name || '---',
          party_name: party?.name || '---',
        };
      });
    } else {
      title = 'گزارش مانده حساب طرف‌های حساب';
      schemaKey = 'parties_balance';
      const parties = PartyRepository.getAll(options.businessId);
      dataRows = parties.map((p) => {
        const docs = DocumentRepository.getAll(options.businessId).filter(
          (d) => d.party_id === p.id && d.status === 'confirmed'
        );
        let balance = 0;
        docs.forEach((d) => {
          if (d.document_type === 'sales_invoice') balance += d.total_amount;
          else if (d.document_type === 'purchase_invoice') balance -= d.total_amount;
        });
        return {
          ...p,
          role_label: p.roles.includes('customer') ? 'مشتری' : 'تأمین‌کننده',
          balance: Math.abs(balance),
          status_text: balance > 0 ? 'بدهکار' : balance < 0 ? 'بستانکار' : 'تسویه',
        };
      });
    }

    const schema = EXPORT_FIELD_SCHEMAS[schemaKey] || [];

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm';
    container.style.padding = '15mm';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#0f172a';
    container.style.direction = 'rtl';
    container.style.fontFamily = 'sans-serif';

    const tableHeadersHtml = schema
      .map((col) => `<th style="padding: 8px; border: 1px solid #cbd5e1; background-color: #f1f5f9; text-align: right; font-weight: bold; font-size: 11px;">${col.label}</th>`)
      .join('');

    const tableRowsHtml = dataRows
      .map((row, idx) => {
        const cols = schema
          .map((col) => {
            let val = row[col.key];
            if (col.format === 'currency') {
              val = typeof val === 'number' ? formatCurrency(val) : val ?? '۰';
            } else if (col.format === 'date' && val) {
              val = formatPersianDate(val);
            } else if (val === null || val === undefined) {
              val = '---';
            }
            return `<td style="padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 10px; text-align: right;">${val}</td>`;
          })
          .join('');
        return `<tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${cols}</tr>`;
      })
      .join('');

    container.innerHTML = `
      <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">${title}</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">کسب‌وکار: ${businessName}</p>
        </div>
        <div style="text-align: left;">
          <p style="margin: 0; font-size: 11px; color: #64748b;">تاریخ گزارش: ${formatPersianDate(new Date().toISOString())}</p>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
        <thead>
          <tr>${tableHeadersHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    `;

    document.body.appendChild(container);

    try {
      const filename = `گزارش_${category}_${businessName}`;
      await PdfExporter.exportElementToPdf(container, filename, { pageSize: 'a4', orientation: 'p' });
    } finally {
      document.body.removeChild(container);
    }
  }
}
