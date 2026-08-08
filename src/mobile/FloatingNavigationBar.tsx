import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ShoppingCart, Warehouse, Landmark } from 'lucide-react';
import { cn } from '../lib/utils';

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', title: 'خانه', path: '/dashboard', icon: Home },
  { id: 'sales', title: 'فروش', path: '/sales', icon: ShoppingCart },
  { id: 'inventory', title: 'انبار', path: '/inventory', icon: Warehouse },
  { id: 'treasury', title: 'مالی', path: '/treasury', icon: Landmark },
];

export const FloatingNavigationBar: React.FC = React.memo(() => {
  const location = useLocation();

  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 flex justify-center safe-area-bottom pointer-events-none">
      <nav
        aria-label="ناوبری شناور"
        className="pointer-events-auto w-full max-w-md bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 rounded-full shadow-2xl shadow-indigo-500/10 flex items-center justify-around"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-full transition-colors touch-manipulation cursor-pointer',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="activePill"
                  className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5 mb-0.5 relative z-10 transition-transform', isActive && 'scale-110')} />
              <span className="text-[10px] tracking-tight relative z-10">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
});
