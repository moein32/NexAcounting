import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 1,
  max = 999999,
  step = 1,
  unit,
  size = 'md',
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  const buttonSize = {
    sm: 'w-8 h-8 min-h-[32px] min-w-[32px] text-xs',
    md: 'w-10 h-10 min-h-[40px] min-w-[40px] text-sm',
    lg: 'w-12 h-12 min-h-[48px] min-w-[48px] text-base',
  };

  return (
    <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className={cn(
          'rounded-xl font-black bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-xs flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation cursor-pointer',
          buttonSize[size]
        )}
      >
        <Minus className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-center px-2 min-w-[48px]">
        <input
          type="number"
          value={value === 0 ? '' : value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (isNaN(parsed)) {
              onChange(0);
            } else {
              onChange(parsed);
            }
          }}
          className="w-12 text-center font-black font-mono text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
        />
        {unit && <span className="text-[10px] text-slate-400 font-bold mr-0.5">{unit}</span>}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className={cn(
          'rounded-xl font-black bg-indigo-600 text-white shadow-xs flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation cursor-pointer',
          buttonSize[size]
        )}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
