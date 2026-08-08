import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  FileText,
  User,
  Package,
  Warehouse,
  CreditCard,
  BarChart3,
  History,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { documentService } from '../../services/documentService';
import { partyService } from '../../services/partyService';
import { itemService } from '../../services/itemService';
import { formatCurrency } from '../../lib/utils';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentBusiness } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    invoices: any[];
    parties: any[];
    items: any[];
  }>({ invoices: [], parties: [], items: [] });
  const [loading, setLoading] = useState(false);

  const recentSearches = ['فاکتور شماره 102', 'مشتری علی رضایی', 'کالای لپ‌تاپ', 'چک دریافتی'];

  useEffect(() => {
    if (query.trim().length >= 2 && currentBusiness) {
      const timer = setTimeout(() => {
        performSearch();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setResults({ invoices: [], parties: [], items: [] });
    }
  }, [query, currentBusiness]);

  const performSearch = async () => {
    if (!currentBusiness) return;
    try {
      setLoading(true);
      const [docs, partiesRes, itemsRes] = await Promise.all([
        documentService.getDocuments(currentBusiness.id),
        partyService.getParties(currentBusiness.id),
        itemService.getItems(currentBusiness.id),
      ]);

      const q = query.toLowerCase().trim();

      const filteredDocs = docs
        .filter(
          (d) =>
            d.document_number.toLowerCase().includes(q) ||
            (d.party_display_name || '').toLowerCase().includes(q)
        )
        .slice(0, 3);

      const partiesList = Array.isArray(partiesRes) ? partiesRes : partiesRes.data || [];
      const filteredParties = partiesList
        .filter((p: any) => (p.name || p.display_name || '').toLowerCase().includes(q) || (p.mobile || '').includes(q))
        .slice(0, 3);

      const itemsList = Array.isArray(itemsRes) ? itemsRes : itemsRes.data || [];
      const filteredItems = itemsList
        .filter((i: any) => i.name.toLowerCase().includes(q) || (i.code || '').toLowerCase().includes(q))
        .slice(0, 3);

      setResults({
        invoices: filteredDocs,
        parties: filteredParties,
        items: filteredItems,
      });
    } catch (err) {
      console.error('Failed to perform global search:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fade-in">
        {/* Top Input Bar */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-indigo-500 mr-2 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی همه‌جانبه فاکتورها، مشتریان، کالاها و گزارش‌ها..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm focus:outline-none py-1.5"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {query.trim().length < 2 ? (
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-2 px-1">
                جستجوهای اخیر:
              </span>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(s)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 dark:bg-slate-800/80 text-slate-300 hover:text-white text-xs font-bold border border-white/5 active:scale-95 transition-all"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              در حال سرچ کامل سیستم...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Invoices */}
              {results.invoices.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-indigo-400 flex items-center gap-1.5 px-1">
                    <FileText className="w-4 h-4" />
                    <span>فاکتورها ({results.invoices.length})</span>
                  </span>
                  {results.invoices.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleNavigate(`/sales/${doc.id}`)}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer active:scale-98"
                    >
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                          فاکتور #{doc.document_number} - {doc.party_display_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatCurrency(doc.grand_total)} تومان
                        </span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Parties */}
              {results.parties.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-blue-400 flex items-center gap-1.5 px-1">
                    <User className="w-4 h-4" />
                    <span>اشخاص ({results.parties.length})</span>
                  </span>
                  {results.parties.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleNavigate(`/parties/${p.id}`)}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer active:scale-98"
                    >
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {p.name || p.display_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 dir-ltr block text-right">
                          {p.mobile || 'بدون تلفن'}
                        </span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Items */}
              {results.items.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5 px-1">
                    <Package className="w-4 h-4" />
                    <span>کالاها و خدمات ({results.items.length})</span>
                  </span>
                  {results.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNavigate(`/items/${item.id}`)}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer active:scale-98"
                    >
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          قیمت: {formatCurrency(item.default_sale_price || 0)} تومان
                        </span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}

              {results.invoices.length === 0 &&
                results.parties.length === 0 &&
                results.items.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    هیچ موردی مطابق با "{query}" پیدا نشد.
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};
