import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}

export interface FilterBarProps {
  filters: FilterOption[];
  onReset?: () => void;
}

export function FilterBar({ filters, onReset }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
        <Filter className="w-3.5 h-3.5" />
        <span>فیلترها:</span>
      </div>

      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="h-8 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">{filter.label} (همه)</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-xs gap-1 text-slate-500">
          <RotateCcw className="w-3 h-3" />
          <span>بازنشانی</span>
        </Button>
      )}
    </div>
  );
}
