import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { SIDEBAR_NAV_ITEMS } from '../../config/navigation';
import { useUIStore } from '../../stores/uiStore';
import { useAppStore } from '../../stores/appStore';
import { APP_CONFIG } from '../../config/appConfig';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  Warehouse,
  Landmark,
  CreditCard,
  Calculator,
  BarChart3,
  Settings,
  X,
  ChevronDown,
  LogOut,
  Building2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Users,
  Package,
  Warehouse,
  Landmark,
  CreditCard,
  Calculator,
  BarChart3,
  Settings,
};

export function MobileDrawer() {
  const location = useLocation();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { currentBusiness, currentUser } = useAppStore();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Close mobile drawer on route change
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  if (!mobileMenuOpen) return null;

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Slide Drawer Content (RTL -> Slide from right) */}
      <div className="relative w-4/5 max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 border-l border-slate-200 dark:border-slate-800">
        {/* Top Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] font-medium text-slate-400 mt-1">{currentBusiness.name}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 h-9 w-9 rounded-xl text-slate-400"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.iconName] || LayoutDashboard;
            const hasChildren = item.children && item.children.length > 0;
            const isSubmenuOpen = !!openSubmenus[item.title];
            const isActive =
              location.pathname === item.path ||
              (hasChildren && item.children?.some((child) => location.pathname === child.path));

            if (hasChildren) {
              return (
                <div key={item.path} className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px]',
                      isActive
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-slate-500" />
                      <span>{item.title}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200 text-slate-400',
                        isSubmenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {isSubmenuOpen && (
                    <div className="pr-8 space-y-1 my-1 border-r-2 border-slate-100 dark:border-slate-800 mr-4">
                      {item.children?.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive: isChildActive }) =>
                            cn(
                              'block py-2.5 px-3 text-xs font-medium rounded-lg min-h-[40px] flex items-center',
                              isChildActive
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
                                : 'text-slate-600 dark:text-slate-400'
                            )
                          }
                        >
                          {child.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: isSelfActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px]',
                    isSelfActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.title}</span>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User Info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400">{currentUser.role}</span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
