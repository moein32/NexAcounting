import * as XLSX from 'xlsx';
import {
  ImportEntityType,
  ColumnMapping,
  ImportValidationResult,
  ImportSummaryReport,
} from '../ExportTypes';
import { ImportValidator } from '../validators/ImportValidator';
import { ItemRepository, PartyRepository, InventoryRepository } from '../../repositories';
import { db } from '../../lib/sqlite';

export class ExcelImporter {
  /**
   * Reads an uploaded .xlsx file array buffer and parses columns and sample rows.
   */
  public static parseFile(arrayBuffer: ArrayBuffer): {
    sheetNames: string[];
    selectedSheet: string;
    columns: string[];
    rows: Record<string, any>[];
  } {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    const selectedSheet = sheetNames[0] || 'Sheet1';
    const worksheet = workbook.Sheets[selectedSheet];

    if (!worksheet) {
      throw new Error('فایل اکسل خالی یا نامعتبر است');
    }

    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

    return {
      sheetNames,
      selectedSheet,
      columns,
      rows: jsonData,
    };
  }

  /**
   * Auto-detects column mapping based on Persian/English column names.
   */
  public static suggestMappings(columns: string[], entityType: ImportEntityType): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];

    const fieldSynonyms: Record<string, string[]> = {
      name: ['نام', 'نام کالا', 'نام مشتری', 'نام تامین‌کننده', 'عنوان', 'name', 'title'],
      code: ['کد', 'کد کالا', 'کد مشتری', 'کد تامین‌کننده', 'شناسه', 'code', 'id'],
      purchase_price: ['قیمت خرید', 'بهای خرید', 'purchase_price', 'cost'],
      sale_price: ['قیمت فروش', 'نرخ فروش', 'sale_price', 'price'],
      phone: ['تلفن', 'شماره تماس', 'همراه', 'موبایل', 'phone', 'mobile'],
      opening_balance: ['مانده اولیه', 'مانده', 'تراز اولیه', 'opening_balance', 'balance'],
      item_code: ['کد کالا', 'کد محصول', 'item_code'],
      warehouse_code: ['کد انبار', 'انبار', 'نام انبار', 'warehouse_code', 'warehouse'],
      quantity: ['تعداد', 'مقدار', 'موجودی', 'quantity', 'qty'],
      cost_price: ['بهای تمام شده', 'قیمت تمام شده', 'قیمت واحد', 'cost_price'],
    };

    columns.forEach((col) => {
      const cleanCol = col.trim().toLowerCase();
      let matchedTarget = '';

      for (const [targetField, synonyms] of Object.entries(fieldSynonyms)) {
        if (synonyms.some((syn) => cleanCol.includes(syn) || syn.includes(cleanCol))) {
          matchedTarget = targetField;
          break;
        }
      }

      if (matchedTarget) {
        mappings.push({ sourceColumn: col, targetField: matchedTarget });
      }
    });

    return mappings;
  }

  /**
   * Validates data before executing import.
   */
  public static validate(
    entityType: ImportEntityType,
    businessId: string,
    rows: Record<string, any>[],
    mappings: ColumnMapping[]
  ): ImportValidationResult {
    return ImportValidator.validateRows(entityType, businessId, rows, mappings);
  }

  /**
   * Executes atomic SQLite import transaction.
   */
  public static executeImport(
    entityType: ImportEntityType,
    businessId: string,
    validationResult: ImportValidationResult
  ): ImportSummaryReport {
    const validRows = validationResult.rows.filter((r) => r.isValid);
    let importedCount = 0;
    let skippedCount = validationResult.invalidRowsCount;
    const errors: string[] = [];

    db.beginTransaction();
    try {
      if (entityType === 'products') {
        validRows.forEach((r) => {
          ItemRepository.create({
            business_id: businessId,
            name: r.data.name,
            code: r.data.code,
            type: 'product',
            purchase_price: r.data.purchase_price,
            sale_price: r.data.sale_price,
            is_active: true,
          });
          importedCount++;
        });
      } else if (entityType === 'customers' || entityType === 'suppliers') {
        const role = entityType === 'customers' ? 'customer' : 'supplier';
        validRows.forEach((r) => {
          PartyRepository.create({
            business_id: businessId,
            name: r.data.name,
            code: r.data.code,
            roles: [role],
            phone: r.data.phone,
            is_active: true,
          });
          importedCount++;
        });
      } else if (entityType === 'initial_stock') {
        const docId = `doc_init_${Math.random().toString(36).substr(2, 8)}`;
        validRows.forEach((r) => {
          InventoryRepository.adjustStock(
            r.data.warehouse_id,
            r.data.item_id,
            r.data.quantity,
            docId
          );
          importedCount++;
        });
      }

      db.commit();
    } catch (e: any) {
      db.rollback();
      errors.push(`خطا در اجرای تراکنش واردسازی: ${e.message || e}`);
      return {
        importedCount: 0,
        skippedCount: validationResult.totalRows,
        errorCount: validationResult.totalRows,
        errors,
      };
    }

    return {
      importedCount,
      skippedCount,
      errorCount: errors.length,
      errors,
    };
  }
}
