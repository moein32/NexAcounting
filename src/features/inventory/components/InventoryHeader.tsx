import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Warehouse,
  History,
  AlertTriangle,
  ClipboardList,
  Settings,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from 'lucide-react';
import { inventoryService } from '../../../services/inventoryService';
import { useAuthStore } from '../../../stores/authStore';

export function InventoryHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';

  const [allowNegative, setAllowNegative] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const val = inventoryService.getAllowNegativeStock(businessId);
    setAllowNegative(val);
  }, [businessId]);

  const handleToggleNegative = () => {
    const newVal = !allowNegative;
    inventoryService.setAllowNegativeStock(businessId, newVal);
    setAllowNegative(newVal);
  };

  const navItems = [
    { title: 'داشبورد', path: '/inventory', icon: LayoutDashboard },
    { title: 'مدیریت انبارها', path: '/inventory/warehouses', icon: Warehouse },
    { title: 'گردش کالا (کاردکس)', path: '/inventory/transactions', icon: History },
    { title: 'کمبود موجودی', path: '/inventory/low-stock', icon: AlertTriangle },
    { title: 'انبارگردانی', path: '/inventory/stock-count', icon: ClipboardList },
  ];

  return (
    <div id="inventory-header" className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">سیستم مدیریت انبار و موجودی</h1>
          <p className="text-gray-500 text-sm mt-1">کنترل موجودی چندانباره، انتقال بین انبارها، حواله‌ها و انبارگردانی دوره‌ای</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              showConfig
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>تنظیمات قوانین انبار</span>
          </button>
        </div>
      </div>

      {showConfig && (
        <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 text-sm">مجوز خروج با موجودی منفی</h4>
              <p className="text-amber-700 text-xs mt-0.5">
                در صورت فعال بودن این گزینه، سیستم اجازه صدور حواله خروج فراتر از موجودی فعلی انبار را می‌دهد. در غیر این صورت، موجودی به صفر محدود شده و خطا صادر می‌شود.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleNegative}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-amber-200 shadow-sm hover:bg-amber-50 transition-colors text-sm font-medium self-end md:self-auto"
          >
            {allowNegative ? (
              <>
                <ToggleRight className="w-6 h-6 text-emerald-600" />
                <span className="text-emerald-700">موجودی منفی مجاز است</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6 text-gray-400" />
                <span className="text-gray-500">موجودی منفی غیرمجاز است</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pt-5 scrollbar-none">
        {(navItems || []).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
