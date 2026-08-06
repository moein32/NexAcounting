import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers with Persian digits or standard numbers formatted with commas
 */
export function formatCurrency(amount: number, unit: string = 'تومان'): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(amount);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

export function formatPersianDate(dateString?: string | null): string {
  if (!dateString) return '---';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}
