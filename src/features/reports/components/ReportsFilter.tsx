import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Calendar, Filter, RotateCcw, Search, User } from 'lucide-react';

interface ReportsFilterProps {
  onFilterChange: (filters: any) => void;
  parties?: any[];
  warehouses?: any[];
  categories?: any[];
  showPartySelect?: 'customer' | 'supplier' | 'all' | 'none';
}

export function ReportsFilter({
  onFilterChange,
  parties = [],
  warehouses = [],
  categories = [],
  showPartySelect = 'all'
}: ReportsFilterProps) {
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedParty, setSelectedParty] = React.useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleApply = () => {
    onFilterChange({
      startDate,
      endDate,
      partyId: selectedParty,
      warehouseId: selectedWarehouse,
      search: searchQuery
    });
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedParty('all');
    setSelectedWarehouse('all');
    setSearchQuery('');
    onFilterChange({
      startDate: '',
      endDate: '',
      partyId: 'all',
      warehouseId: 'all',
      search: ''
    });
  };

  // Filter parties based on requested role
  const filteredParties = React.useMemo(() => {
    if (showPartySelect === 'customer') {
      return parties.filter(p => p.roles?.includes('customer'));
    }
    if (showPartySelect === 'supplier') {
      return parties.filter(p => p.roles?.includes('supplier'));
    }
    return parties;
  }, [parties, showPartySelect]);

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>موتور فیلتر پیشرفته گزارش‌گیری</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">از تاریخ</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">تا تاریخ</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Party select (Customer or Supplier) */}
          {showPartySelect !== 'none' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">
                {showPartySelect === 'customer' ? 'فیلتر مشتری' : showPartySelect === 'supplier' ? 'فیلتر تامین‌کننده' : 'طرف حساب'}
              </label>
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="all">همه طرف حساب‌ها</option>
                {(filteredParties || []).map(p => (
                  <option key={p.id} value={p.id}>{p.display_name || p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">جستجوی متنی</label>
            <div className="relative">
              <input
                type="text"
                placeholder="عنوان، کد، فاکتور و..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            بازنشانی فیلترها
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="text-xs font-bold"
          >
            اعمال و استخراج گزارش
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
