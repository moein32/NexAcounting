export type ExportFormatType = 'xlsx' | 'pdf' | 'docx';

export type ExportCategory = 'sales' | 'purchases' | 'inventory' | 'treasury' | 'reports';

export type ImportEntityType = 'products' | 'customers' | 'suppliers' | 'initial_stock';

export interface ExportFilterOptions {
  businessId: string;
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  partyId?: string;
  documentType?: string;
  format: ExportFormatType;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

export interface ImportPreviewRow {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface ImportValidationResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  rows: ImportPreviewRow[];
}

export interface ImportProgress {
  status: 'idle' | 'reading' | 'mapping' | 'validating' | 'importing' | 'success' | 'error';
  message: string;
  progressPercent: number;
}

export interface ImportSummaryReport {
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
}
