import * as XLSX from 'xlsx';
import { EXPORT_FIELD_SCHEMAS, ExportFieldDef } from '../ExportTemplate';
import { formatCurrency, formatPersianDate } from '../../lib/utils';

export interface SheetData {
  sheetName: string;
  schemaKey: string;
  data: Record<string, any>[];
  customTitle?: string;
}

export class ExcelExporter {
  public static exportWorkbook(sheets: SheetData[], filename: string): void {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheetInfo) => {
      const schema: ExportFieldDef[] = EXPORT_FIELD_SCHEMAS[sheetInfo.schemaKey] || [];
      const headers = schema.map((s) => s.label);

      // Map rows
      const formattedRows = sheetInfo.data.map((row) => {
        const rowObj: Record<string, any> = {};
        schema.forEach((col) => {
          let val = row[col.key];

          if (col.format === 'currency') {
            val = typeof val === 'number' ? formatCurrency(val) : val ?? 0;
          } else if (col.format === 'date' && val) {
            val = formatPersianDate(val);
          } else if (val === null || val === undefined) {
            val = '---';
          }

          rowObj[col.label] = val;
        });
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedRows, { header: headers });

      // RTL Worksheet Configuration
      if (!worksheet['!views']) {
        worksheet['!views'] = [{ rightToLeft: true }];
      }

      // Column Width Auto-Fitting
      const colWidths = schema.map((col) => ({
        wch: Math.max(col.width || 12, col.label.length * 2),
      }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetInfo.sheetName);
    });

    // Write file & trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}
