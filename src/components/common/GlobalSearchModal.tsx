import React, { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { GlobalSearchView } from '../../features/reports/components/GlobalSearchView';
import { X } from 'lucide-react';

export function GlobalSearchModal() {
  const { globalSearchOpen, setGlobalSearchOpen } = useUIStore();
  const { currentBusiness } = useAuthStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      } else if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  if (!globalSearchOpen) return null;

  const businessId = currentBusiness?.id || 'demo_biz_1';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => setGlobalSearchOpen(false)} 
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 max-h-[80vh] overflow-y-auto">
        <button
          onClick={() => setGlobalSearchOpen(false)}
          className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        <GlobalSearchView businessId={businessId} />
      </div>
    </div>
  );
}
