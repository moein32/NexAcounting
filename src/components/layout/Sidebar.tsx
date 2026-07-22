import React, { useState } from 'react';
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
  ChevronDown,
  ChevronLeft,
  LogOut,
  Building2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

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

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed } = useUIStore();
  const { currentBusiness, currentUser } = useAppStore();

  // Track expanded submenus
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    SIDEBAR_NAV_ITEMS.forEach((item) => {
      if (item.children && item.children.some((child) => location.pathname.startsWith(child.path))) {
        initial[item.title] = true;
      }
    });
    return initial;
  });

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 z-40 bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out select-none',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Top Logo Section */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
        <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                {APP_CONFIG.name}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                نرم‌افزار جامع مالی
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all group cursor-pointer',
                    isActive
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200 text-slate-400',
                        isSubmenuOpen && 'rotate-180'
                      )}
                    />
                  )}
                </button>

                {!sidebarCollapsed && isSubmenuOpen && (
                  <div className="pr-8 space-y-1 my-1 border-r-2 border-slate-100 dark:border-slate-800 mr-4">
                    {item.children?.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive: isChildActive }) =>
                          cn(
                            'block py-2 px-3 text-xs font-medium rounded-lg transition-colors truncate',
                            isChildActive
                              ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-bold'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
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
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all group',
                  isSelfActive
                    ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                )
              }
              title={sidebarCollapsed ? item.title : undefined}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
              </div>
              {!sidebarCollapsed && item.badge && (
                <Badge variant="warning" size="sm">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Profile & Business Info */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0 space-y-2">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {currentBusiness.name}
              </span>
              <span className="text-[10px] text-slate-400">کد: {currentBusiness.code}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-1.5">
          <div className="flex items-center gap-2 truncate">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
            />
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{currentUser.role}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => alert('خروج از سیستم')}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
            title="خروج از سیستم"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
