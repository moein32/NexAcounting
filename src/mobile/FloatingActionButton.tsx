import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ShoppingCart, ArrowDownLeft, ArrowUpRight, UserPlus, Package, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'invoice',
      title: 'فاکتور فروش',
      path: '/sales/invoices/new',
      icon: ShoppingCart,
      color: 'bg-emerald-500 text-white shadow-emerald-500/30',
    },
    {
      id: 'receipt',
      title: 'دریافت وجه',
      path: '/treasury/receipts/new',
      icon: ArrowDownLeft,
      color: 'bg-blue-500 text-white shadow-blue-500/30',
    },
    {
      id: 'payment',
      title: 'پرداخت وجه',
      path: '/treasury/payments/new',
      icon: ArrowUpRight,
      color: 'bg-rose-500 text-white shadow-rose-500/30',
    },
    {
      id: 'customer',
      title: 'ثبت طرف حساب',
      path: '/parties/new',
      icon: UserPlus,
      color: 'bg-purple-500 text-white shadow-purple-500/30',
    },
    {
      id: 'item',
      title: 'ثبت کالا',
      path: '/items/new',
      icon: Package,
      color: 'bg-amber-500 text-white shadow-amber-500/30',
    },
  ];

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating Speed Dial Container */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden flex flex-col items-end">
        {/* Speed Dial Action Items */}
        <AnimatePresence>
          {isOpen && (
            <motion.div className="flex flex-col gap-2.5 mb-3 items-end">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 15, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ delay: index * 0.04, duration: 0.18 }}
                    onClick={() => handleSelect(item.path)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl touch-manipulation cursor-pointer active:scale-95"
                  >
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {item.title}
                    </span>
                    <div className={cn('p-2 rounded-xl shadow-md', item.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-black text-xs shadow-2xl shadow-indigo-500/40 border border-indigo-400/30 touch-manipulation cursor-pointer min-h-[52px]',
            isOpen && 'bg-slate-800 dark:bg-slate-700'
          )}
          title="ثبت سریع"
        >
          <motion.div
            animate={{ rotate: isOpen ? 135 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-5 h-5" />
          </motion.div>
          <span className="tracking-tight">{isOpen ? 'بستن' : 'ثبت سریع'}</span>
        </motion.button>
      </div>
    </>
  );
};
