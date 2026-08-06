import { ExportEngine } from './ExportEngine';
import { ExcelImporter } from './importers/ExcelImporter';
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
    if (options.format === 'xlsx') {
      await ExportEngine.exportToExcel(category, options);
    } else if (options.format === 'docx') {
      await ExportEngine.exportToWord(category, options);
    } else if (options.format === 'pdf') {
      await ExportEngine.exportToPdf(category, options);
    } else {
      await ExportEngine.exportToPdf(category, options);
    }
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
    return ExcelImporter.executeImport(entityType, businessId, validationResult);
  },
};
