import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { Search, UserCheck, Phone, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { partyService } from '../../services/partyService';
import { Party } from '../../types/party';
import { formatCurrency } from '../../lib/utils';

interface CustomerPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (party: Party) => void;
  selectedPartyId?: string;
  partyType?: 'customer' | 'supplier' | 'all';
}

export const CustomerPickerSheet: React.FC<CustomerPickerSheetProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  selectedPartyId,
  partyType = 'all',
}) => {
  const { currentBusiness } = useAuthStore();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && currentBusiness) {
      loadParties();
    }
  }, [isOpen, currentBusiness]);

  const loadParties = async () => {
    try {
      setLoading(true);
      const res = await partyService.getParties(currentBusiness!.id);
      setParties(res.data || []);
    } catch (err) {
      console.error('Failed to load parties for picker:', err);
    } finally {
      setLoading(false);
    }
  };

  const safePartiesList = Array.isArray(parties) ? parties : [];

  const filteredParties = safePartiesList.filter((p) => {
    if (partyType === 'customer' && !p.roles?.includes('customer')) return false;
    if (partyType === 'supplier' && !p.roles?.includes('supplier')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || p.display_name || '').toLowerCase().includes(q);
      const matchPhone = (p.mobile || p.phone || '').includes(q);
      const matchCode = (p.code || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCode) return false;
    }
    return true;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={partyType === 'supplier' ? 'انتخاب تامین‌کننده' : 'انتخاب خریدار / مشتری'}
      subtitle="طرف حساب مورد نظر را لمس و انتخاب کنید"
      maxHeight="max-h-[85vh]"
    >
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="جستجوی نام مشتری، کد یا شماره تماس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              در حال بارگذاری لیست اشخاص...
            </div>
          ) : filteredParties.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              طرف حسابی یافت نشد.
            </div>
          ) : (
            filteredParties.map((party) => {
              const isSelected = selectedPartyId === party.id;
              const balance = party.calculated_balance || party.current_balance || 0;

              return (
                <div
                  key={party.id}
                  onClick={() => {
                    onSelectCustomer(party);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-98 flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-900 dark:text-indigo-100 shadow-md'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-black flex items-center justify-center shrink-0 shadow-xs text-xs">
                      {(party.display_name || party.name || 'P').charAt(0)}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                          {party.display_name || party.name}
                        </h4>
                        {party.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500">
                            #{party.code}
                          </span>
                        )}
                      </div>

                      {party.mobile && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 dir-ltr justify-end">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{party.mobile}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-left shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-400 block">مانده حساب:</span>
                      <span
                        className={`text-xs font-black font-mono ${
                          balance > 0
                            ? 'text-rose-600'
                            : balance < 0
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatCurrency(Math.abs(balance))} تومان
                      </span>
                    </div>

                    {isSelected && (
                      <div className="p-1 rounded-full bg-indigo-600 text-white">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
