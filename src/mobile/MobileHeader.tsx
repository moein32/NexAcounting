import React from 'react';
import { Building2, Search, Menu, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { NotificationBadge } from '../notifications/ui/NotificationBadge';

interface MobileHeaderProps {
  onOpenSearch?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSearch }) => {
  const { currentBusiness, isDemoMode } = useAuthStore();
  const { setMobileMenuOpen } = useUIStore();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center justify-between shadow-xs">
      {/* Right: Drawer Trigger + Brand */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95 touch-manipulation"
          title="منوی ناوبری"
          aria-label="باز کردن منو"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shadow-sm text-xs">
            NEX
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                {currentBusiness?.name || 'نکس‌جیب'}
              </span>
              {isDemoMode && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-400/20 text-amber-700 dark:text-amber-400 rounded-md">
                  دمو
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              حسابداری آفلاین و هوشمند
            </span>
          </div>
        </div>
      </div>

      {/* Left: Actions (Notification Badge + Search) */}
      <div className="flex items-center gap-1">
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95 touch-manipulation"
            title="جستجوی سریع"
            aria-label="جستجو"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        <NotificationBadge />
      </div>
    </header>
  );
};
