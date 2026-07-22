export type ThemeMode = 'light' | 'dark' | 'system';
export * from './auth';
export * from './party';
export * from './catalog';
export * from './inventory';

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
}

export interface BusinessInfo {
  id: string;
  name: string;
  code: string;
  taxId?: string;
  currency: 'ریال' | 'تومان';
  logoUrl?: string;
  fiscalYear: string;
}

export interface NavItem {
  title: string;
  path: string;
  iconName: string;
  badge?: string;
  children?: { title: string; path: string; iconName?: string }[];
}

export interface StatCardData {
  id: string;
  title: string;
  value: number;
  unit: string;
  changePercent?: number;
  isPositive?: boolean;
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon: string;
}

export interface Transaction {
  id: string;
  code: string;
  title: string;
  partyName: string;
  amount: number;
  type: 'sale' | 'purchase' | 'receipt' | 'payment';
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  date: string;
  category: 'check' | 'inventory' | 'debt' | 'system';
  actionUrl?: string;
}

export interface ChartDataPoint {
  name: string;
  sales?: number;
  purchases?: number;
  income?: number;
  expense?: number;
  profit?: number;
}
