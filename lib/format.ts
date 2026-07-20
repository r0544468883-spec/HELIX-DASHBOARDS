import type { WidgetConfig } from './types';

// Hebrew-locale value formatting for widgets.
export function formatValue(v: number, fmt: WidgetConfig['format'] = 'number'): string {
  if (fmt === 'currency') return '₪' + v.toLocaleString('he-IL', { maximumFractionDigits: 0 });
  if (fmt === 'percent') return v.toLocaleString('he-IL', { maximumFractionDigits: 1 }) + '%';
  return v.toLocaleString('he-IL', { maximumFractionDigits: 1 });
}

export const BRAND = '#059669';
export const PALETTE = ['#059669', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
