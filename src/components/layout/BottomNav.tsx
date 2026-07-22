import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BOTTOM_NAV_ITEMS } from '../../config/navigation';
import { useUIStore } from '../../stores/uiStore';
import {
  Home,
  ShoppingCart,
  FilePlus,
  Landmark,
  Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Home,
  ShoppingCart,
  FilePlus,
  Landmark,
  Menu,
};

export function BottomNav() {
  const location = useLocation();
  const { setMobileMenuOpen } = useUIStore();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = iconMap[item.iconName] || Home;
        const isMoreButton = item.iconName === 'Menu';

        if (isMoreButton) {
          return (
            <button
              key={item.path}
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 min-w-[56px] min-h-[48px] rounded-xl transition-colors cursor-pointer"
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">{item.title}</span>
            </button>
          );
        }

        if (item.isPrimary) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center -mt-5 min-w-[56px] cursor-pointer group"
            >
              <div className="p-3 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">{item.title}</span>
            </NavLink>
          );
        }

        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center p-1.5 min-w-[56px] min-h-[48px] rounded-xl transition-all cursor-pointer',
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{item.title}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
