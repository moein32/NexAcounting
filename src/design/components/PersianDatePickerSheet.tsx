import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { ActionButton } from './ActionButton';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { formatPersianDate } from '../../lib/utils';

interface PersianDatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  title?: string;
}

export const PersianDatePickerSheet: React.FC<PersianDatePickerSheetProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  title = 'انتخاب تاریخ خورشیدی',
}) => {
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const today = getTodayISO();
  const [customDate, setCustomDate] = useState(selectedDate || today);

  const quickOptions = [
    { label: 'امروز', date: today },
    { label: 'دیروز', date: getRelativeDate(-1) },
    { label: 'پایان هفته', date: getRelativeDate(3) },
    { label: 'پایان ماه', date: getRelativeDate(15) },
  ];

  function getRelativeDate(daysOffset: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  const handleApply = () => {
    onSelectDate(customDate);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="تاریخ سررسید یا صدور سند را انتخاب کنید"
      footer={
        <ActionButton
          label="تایید و اعمال تاریخ"
          icon={Check}
          variant="primary"
          fullWidth
          onClick={handleApply}
        />
      }
    >
      <div className="space-y-4 py-2">
        {/* Quick Selection Chips */}
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
            انتخاب سریع:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setCustomDate(opt.date)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center touch-manipulation cursor-pointer ${
                  customDate === opt.date
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Field */}
        <div className="pt-2 space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            تاریخ خورشیدی:
          </label>
          <div className="relative">
            <CalendarIcon className="w-5 h-5 text-indigo-500 absolute right-3 top-3" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">تاریخ انتخاب شده به شمسی:</span>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
              {formatPersianDate(customDate)}
            </span>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};
