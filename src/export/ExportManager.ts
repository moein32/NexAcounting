import { ExportEngine } from './ExportEngine';
import { ExcelImporter } from './importers/ExcelImporter';
import { NotificationService } from '../notifications';
import {
  ExportCategory,
  ExportFilterOptions,
  ImportEntityType,
  ColumnMapping,
  ImportValidationResult,
  ImportSummaryReport,
} from './ExportTypes';

export const ExportManager = {
  async exportData(category: ExportCategory, options: ExportFilterOptions): Promise<void> {
    const businessId = options.businessId || 'demo_biz_1';
    if (options.format === 'xlsx') {
      await ExportEngine.exportToExcel(category, options);
    } else if (options.format === 'docx') {
      await ExportEngine.exportToWord(category, options);
    } else if (options.format === 'pdf') {
      await ExportEngine.exportToPdf(category, options);
    } else {
      await ExportEngine.exportToPdf(category, options);
    }
    NotificationService.notifyExportCompleted(businessId, `export_${category}.${options.format}`);
  },

  parseImportFile(arrayBuffer: ArrayBuffer) {
    return ExcelImporter.parseFile(arrayBuffer);
  },

  suggestImportMappings(columns: string[], entityType: ImportEntityType): ColumnMapping[] {
    return ExcelImporter.suggestMappings(columns, entityType);
  },

  validateImportData(
    entityType: ImportEntityType,
    businessId: string,
    rows: Record<string, any>[],
    mappings: ColumnMapping[]
  ): ImportValidationResult {
    return ExcelImporter.validate(entityType, businessId, rows, mappings);
  },

  executeImport(
    entityType: ImportEntityType,
    businessId: string,
    validationResult: ImportValidationResult
  ): ImportSummaryReport {
    const report = ExcelImporter.executeImport(entityType, businessId, validationResult);
    if (report.importedCount > 0) {
      NotificationService.notifyImportCompleted(businessId, entityType, report.importedCount);
    }
    return report;
  },
};
