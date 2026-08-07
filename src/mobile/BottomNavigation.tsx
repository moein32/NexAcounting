import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingCart,
  Warehouse,
  Landmark,
  Menu,
} from 'lucide-react';
import { MOBILE_BOTTOM_NAV_ITEMS } from './MobileRoutes';
import { useUIStore } from '../stores/uiStore';
import { cn } from '../lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Home,
  ShoppingCart,
  Warehouse,
  Landmark,
  Menu,
};

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { setMobileMenuOpen } = useUIStore();

  return (
    <nav
      aria-label="ناوبری اصلی موبایل"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 flex items-center justify-around shadow-2xl safe-area-bottom"
    >
      {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.iconName] || Home;
        const isMore = item.id === 'more';

        if (isMore) {
          return (
            <button
              key={item.id}
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 px-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 transition-colors touch-manipulation cursor-pointer"
              title="سایر منوها"
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold">{item.title}</span>
            </button>
          );
        }

        const isActive =
          location.pathname === item.path ||
          (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center min-w-[60px] min-h-[48px] py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer relative',
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800'
            )}
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full shadow-xs" />
            )}
            <Icon className={cn('w-5 h-5 mb-0.5 transition-transform', isActive && 'scale-110')} />
            <span className="text-[10px] tracking-tight">{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
