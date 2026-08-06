import { ImportEntityType, ColumnMapping, ImportPreviewRow, ImportValidationResult } from '../ExportTypes';
import { ItemRepository, PartyRepository, InventoryRepository } from '../../repositories';

export class ImportValidator {
  public static validateRows(
    entityType: ImportEntityType,
    businessId: string,
    rawRows: Record<string, any>[],
    mappings: ColumnMapping[]
  ): ImportValidationResult {
    const existingItems = ItemRepository.getAll(businessId);
    const existingParties = PartyRepository.getAll(businessId);
    const existingWarehouses = InventoryRepository.getWarehouses(businessId);

    const existingItemCodes = new Set(existingItems.map((i) => i.code.trim().toLowerCase()));
    const existingPartyCodes = new Set(existingParties.map((p) => p.code.trim().toLowerCase()));

    const mapField = (row: Record<string, any>, targetField: string) => {
      const mapping = mappings.find((m) => m.targetField === targetField);
      if (!mapping || !mapping.sourceColumn) return undefined;
      return row[mapping.sourceColumn];
    };

    const previewRows: ImportPreviewRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    rawRows.forEach((row, idx) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      const rowData: Record<string, any> = {};

      if (entityType === 'products') {
        const name = mapField(row, 'name')?.toString().trim();
        const code = mapField(row, 'code')?.toString().trim();
        const purchasePrice = Number(mapField(row, 'purchase_price') || 0);
        const salePrice = Number(mapField(row, 'sale_price') || 0);

        rowData.name = name || '';
        rowData.code = code || `PRD-${1000 + idx}`;
        rowData.purchase_price = isNaN(purchasePrice) ? 0 : purchasePrice;
        rowData.sale_price = isNaN(salePrice) ? 0 : salePrice;

        if (!name) {
          errors.push('نام کالا الزامی است');
        }

        if (code && existingItemCodes.has(code.toLowerCase())) {
          warnings.push('کد کالا تکراری است (در صورت تایید جایگزین می‌شود)');
        }

        if (rowData.purchase_price < 0 || rowData.sale_price < 0) {
          errors.push('قیمت نمی‌تواند منفی باشد');
        }
      } else if (entityType === 'customers' || entityType === 'suppliers') {
        const name = mapField(row, 'name')?.toString().trim();
        const code = mapField(row, 'code')?.toString().trim();
        const phone = mapField(row, 'phone')?.toString().trim();
        const openingBalance = Number(mapField(row, 'opening_balance') || 0);

        rowData.name = name || '';
        rowData.code = code || (entityType === 'customers' ? `CUST-${100 + idx}` : `SUPP-${100 + idx}`);
        rowData.phone = phone || '';
        rowData.opening_balance = isNaN(openingBalance) ? 0 : openingBalance;

        if (!name) {
          errors.push('نام طرف حساب الزامی است');
        }

        if (code && existingPartyCodes.has(code.toLowerCase())) {
          warnings.push('کد طرف حساب تکراری است');
        }
      } else if (entityType === 'initial_stock') {
        const itemCode = mapField(row, 'item_code')?.toString().trim();
        const warehouseCode = mapField(row, 'warehouse_code')?.toString().trim();
        const quantity = Number(mapField(row, 'quantity') || 0);
        const costPrice = Number(mapField(row, 'cost_price') || 0);

        rowData.item_code = itemCode || '';
        rowData.warehouse_code = warehouseCode || '';
        rowData.quantity = isNaN(quantity) ? 0 : quantity;
        rowData.cost_price = isNaN(costPrice) ? 0 : costPrice;

        if (!itemCode) {
          errors.push('کد کالا الزامی است');
        } else {
          const itemMatch = existingItems.find((i) => i.code.toLowerCase() === itemCode.toLowerCase());
          if (!itemMatch) {
            errors.push(`کالایی با کد ${itemCode} یافت نشد`);
          } else {
            rowData.item_id = itemMatch.id;
          }
        }

        if (warehouseCode) {
          const whMatch = existingWarehouses.find(
            (w) => w.code.toLowerCase() === warehouseCode.toLowerCase() || w.name === warehouseCode
          );
          if (whMatch) {
            rowData.warehouse_id = whMatch.id;
          } else {
            warnings.push('انبار مشخص شده یافت نشد، از انبار پیش‌فرض استفاده خواهد شد');
            rowData.warehouse_id = existingWarehouses[0]?.id;
          }
        } else {
          rowData.warehouse_id = existingWarehouses[0]?.id;
        }

        if (rowData.quantity <= 0) {
          errors.push('مقدار موجودی اول دوره باید بزرگتر از صفر باشد');
        }
      }

      const isValid = errors.length === 0;
      if (isValid) validCount++;
      else invalidCount++;

      previewRows.push({
        rowIndex: idx + 1,
        data: rowData,
        errors,
        warnings,
        isValid,
      });
    });

    return {
      totalRows: rawRows.length,
      validRowsCount: validCount,
      invalidRowsCount: invalidCount,
      rows: previewRows,
    };
  }
}
