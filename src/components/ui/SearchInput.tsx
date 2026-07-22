import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = 'جستجو...', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute right-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          ref={ref}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full h-10 pr-10 pl-9 text-sm rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-150',
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={onClear || (() => onChange && onChange({ target: { value: '' } } as any))}
            className="absolute left-3 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
