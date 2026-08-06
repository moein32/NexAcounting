export type PageSize = 'A4' | 'A5' | 'thermal';
export type InvoiceTemplateId = 'official' | 'simple' | 'modern' | 'compact';
export type InvoiceFontSize = 'small' | 'medium' | 'large';

export interface PrintSettings {
  pageSize: PageSize;
  templateId: InvoiceTemplateId;
  marginTop: number; // in mm
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  showLogo: boolean;
  showNotes: boolean;
  showSignatures: boolean;
  showTax: boolean;
  showDiscount: boolean;
  showEconomicDetails: boolean;
  showWarehouse: boolean;
  showPaymentDetails: boolean;
  fontSize: InvoiceFontSize;
  customTitle?: string;
  headerColor?: string;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  pageSize: 'A4',
  templateId: 'official',
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  showLogo: true,
  showNotes: true,
  showSignatures: true,
  showTax: true,
  showDiscount: true,
  showEconomicDetails: true,
  showWarehouse: true,
  showPaymentDetails: true,
  fontSize: 'medium',
  customTitle: '',
  headerColor: '#1e293b',
};
