import React, { useState, useEffect } from 'react';
import { InventoryHeader } from '../components/InventoryHeader';
import { inventoryService } from '../../../services/inventoryService';
import { useAuthStore } from '../../../stores/authStore';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingDown,
  Warehouse,
  CheckCircle,
  X,
  PlusCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { InventoryBalance } from '../../../types/inventory';

export function LowStockPage() {
  const { currentBusiness, user } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';
  const currentUserId = user?.id || 'demo_user';

  // State
  const [lowStockList, setLowStockList] = useState<InventoryBalance[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Replenish quick modal
  const [showQuickRefillModal, setShowQuickRefillModal] = useState(false);
  const [refillItem, setRefillItem] = useState<any | null>(null);
  const [refillQty, setRefillQty] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const whs = await inventoryService.getWarehouses(businessId);
      setWarehouses(whs);

      const items = await inventoryService.getLowStockItems(businessId, selectedWarehouse);
      setLowStockList(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId, selectedWarehouse]);

  const handleOpenRefill = (item: any) => {
    setErrorMsg('');
    const deficit = Math.max(1, (item.min_stock || 0) - item.quantity);
    setRefillItem(item);
    setRefillQty(deficit);
    setShowQuickRefillModal(true);
  };

  const handleQuickRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillItem) return;
    setErrorMsg('');
    try {
      const doc = await inventoryService.createInventoryDocument(
        businessId,
        {
          warehouse_id: refillItem.warehouse_id,
          document_type: 'receipt',
          description: `شارژ سریع کالا پس از هشدار کسری موجودی`,
          items: [
            {
              item_id: refillItem.item_id,
              quantity: refillQty,
              unit_cost: refillItem.unit_cost,
            } as any,
          ],
        },
        currentUserId
      );

      await inventoryService.confirmInventoryDocument(businessId, doc.id, currentUserId);

      setSuccessMsg(`تعداد ${refillQty} عدد کالا با موفقیت به انبار "${refillItem.warehouse_name}" اضافه شد.`);
      setShowQuickRefillModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در شارژ موجودی انبار');
    }
  };

  const filteredLowStock = lowStockList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      item.item_name.toLowerCase().includes(q) ||
      item.item_code.toLowerCase().includes(q) ||
      item.warehouse_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <InventoryHeader />

      {/* Success alert */}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex justify-between items-center animate-fade-in">
          <div className="flex gap-2 items-center text-sm font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview stats for deficit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-amber-800 text-xs font-semibold block">کالاهای نیازمند شارژ انبار</span>
            <span className="text-3xl font-extrabold text-amber-950 mt-1.5 block">
              {lowStockList.length} <span className="text-sm font-normal text-amber-800">کالا</span>
            </span>
            <span className="text-xs text-amber-700 font-medium block mt-1">دارای موجودی کمتر از حد آستانه</span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold block">کل تخمین کسر موجودی انبارها</span>
            <span className="text-3xl font-bold text-gray-950 mt-1.5 block">
              {lowStockList.reduce((sum, item) => sum + Math.max(0, (item.min_stock || 0) - item.quantity), 0).toLocaleString()}{' '}
              <span className="text-sm font-normal text-gray-500">واحد</span>
            </span>
            <span className="text-xs text-gray-500 font-medium block mt-1">تعداد واحد کالا جهت رسیدن به حد تعادل</span>
          </div>
          <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-semibold block">ارزش سرمایه مورد نیاز جهت خرید شارژ</span>
            <span className="text-2xl font-bold text-gray-950 mt-1.5 block">
              {lowStockList
                .reduce((sum, item) => sum + Math.max(0, (item.min_stock || 0) - item.quantity) * (item.unit_cost || 0), 0)
                .toLocaleString()}{' '}
              <span className="text-sm font-normal text-gray-500">تومان</span>
            </span>
            <span className="text-xs text-gray-500 font-medium block mt-1">مبتنی بر بهای خرید کاتالوگ سیستم</span>
          </div>
          <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          {/* Warehouse */}
          <div className="flex-1 flex flex-col gap-1 text-right">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white"
            >
              <option value="all">همه انبارها</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="flex-[2] relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در کالاهای دارای کسری موجودی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-gray-950 rounded-xl pl-3 pr-9 py-2.5 outline-none"
            />
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Warnings Grid & Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-extrabold text-gray-950 text-base">لیست هشدارهای کسری موجودی کالا</h3>
          <p className="text-gray-400 text-xs mt-0.5">اقلامی که موجودی آنها از آستانه حداقل کاتالوگ کالا کمتر است</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-gray-400 bg-gray-50/50 border-b border-gray-50">
                  <th className="py-3.5 pr-6 font-semibold text-xs">کالا / آیتم</th>
                  <th className="py-3.5 font-semibold text-xs">کد فنی</th>
                  <th className="py-3.5 font-semibold text-xs">انبار</th>
                  <th className="py-3.5 text-left font-semibold text-xs">موجودی فعلی</th>
                  <th className="py-3.5 text-left font-semibold text-xs">حداقل مورد نیاز</th>
                  <th className="py-3.5 text-left font-semibold text-xs text-amber-700">کسری واحد</th>
                  <th className="py-3.5 text-left pl-6 font-semibold text-xs">اقدام فوری شارژ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLowStock.length > 0 ? (
                  filteredLowStock.map((item) => {
                    const deficit = Math.max(1, (item.min_stock || 0) - item.quantity);
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/10 transition-colors">
                        <td className="py-4 pr-6 font-bold text-gray-900">{item.item_name}</td>
                        <td className="py-4 text-gray-500 font-mono text-xs">{item.item_code || '---'}</td>
                        <td className="py-4 text-gray-600 text-xs font-semibold">{item.warehouse_name}</td>
                        <td className="py-4 text-left font-extrabold text-rose-600 font-mono">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="py-4 text-left text-gray-600 font-mono">
                          {(item.min_stock || 0).toLocaleString()}
                        </td>
                        <td className="py-4 text-left text-amber-700 font-bold font-mono">
                          {deficit.toLocaleString()}
                        </td>
                        <td className="py-4 text-left pl-6">
                          <button
                            onClick={() => handleOpenRefill(item)}
                            className="inline-flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>صدور رسید ورود فوری</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                      خوشبختانه هیچ کالایی در انبار زیر آستانه حداقل تعریف شده نیست.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- QUICK REFILL MODAL --- */}
      {showQuickRefillModal && refillItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowQuickRefillModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-950 mb-3 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-gray-950" />
              <span>صدور رسید ورود فوری و شارژ موجودی</span>
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-4 mb-4 text-xs text-gray-700 leading-relaxed">
              <div className="font-bold text-gray-900 text-sm mb-1">{refillItem.item_name}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>کد کالا: <strong className="font-mono text-[10px]">{refillItem.item_code}</strong></div>
                <div>انبار مقصد: <strong>{refillItem.warehouse_name}</strong></div>
                <div>موجودی فعلی: <strong className="text-rose-600">{refillItem.quantity}</strong></div>
                <div>حداقل انبار: <strong>{refillItem.min_stock || 0}</strong></div>
              </div>
            </div>

            <form onSubmit={handleQuickRefillSubmit} className="flex flex-col gap-4 text-right">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">تعداد کالا جهت افزایش <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min={1}
                  required
                  value={refillQty}
                  onChange={(e) => setRefillQty(Math.max(1, Number(e.target.value)))}
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none font-mono text-left"
                />
                <span className="text-[10px] text-gray-400">کسری برای حد آستانه حداقل کالا: {(refillItem.min_stock || 0) - refillItem.quantity} عدد</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">قیمت خرید واحد (ریال)</label>
                <input
                  type="number"
                  value={refillItem.unit_cost || 0}
                  disabled
                  className="w-full text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 outline-none font-mono text-left cursor-not-allowed"
                />
                <span className="text-[10px] text-gray-400">قیمت تعریف شده پیش‌فرض در کاتالوگ کالا</span>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowQuickRefillModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-xl text-white text-sm font-medium"
                >
                  ثبت و شارژ فوری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
