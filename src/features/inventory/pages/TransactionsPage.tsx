import React, { useState, useEffect } from 'react';
import { InventoryHeader } from '../components/InventoryHeader';
import { inventoryService } from '../../../services/inventoryService';
import { useAuthStore } from '../../../stores/authStore';
import {
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  FileText,
  User,
  Printer,
  XCircle,
} from 'lucide-react';
import { InventoryTransaction, Warehouse } from '../../../types/inventory';

export function TransactionsPage() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';

  // Filters State
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const whList = await inventoryService.getWarehouses(businessId);
      setWarehouses(whList);

      const txs = await inventoryService.getInventoryTransactions(businessId, {
        warehouse_id: selectedWarehouse,
        transaction_type: selectedType,
        search: searchQuery,
      });
      setTransactions(txs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId, selectedWarehouse, selectedType, searchQuery]);

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'opening_balance':
        return { text: 'موجودی اولیه', style: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'stock_in':
        return { text: 'رسید ورود کالا', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'stock_out':
        return { text: 'حواله خروج کالا', style: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'transfer_in':
        return { text: 'انتقال (ورودی)', style: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'transfer_out':
        return { text: 'انتقال (خروجی)', style: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'adjustment_in':
        return { text: 'تعدیل مثبت (اصلاح)', style: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'adjustment_out':
        return { text: 'تعدیل منفی (اصلاح)', style: 'bg-orange-50 text-orange-700 border-orange-100' };
      default:
        return { text: 'گردش انبار', style: 'bg-gray-50 text-gray-700 border-gray-100' };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <InventoryHeader />

      {/* Filters Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {/* Warehouse select */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-gray-500">فیلتر بر اساس انبار</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
            >
              <option value="all">همه انبارها</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Operation type select */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-gray-500">نوع گردش / تراکنش</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
            >
              <option value="all">همه تراکنش‌ها</option>
              <option value="opening_balance">موجودی اولیه</option>
              <option value="stock_in">رسیدهای ورود</option>
              <option value="stock_out">حواله‌های خروج</option>
              <option value="transfer_in">انتقال ورودی</option>
              <option value="transfer_out">انتقال خروجی</option>
              <option value="adjustment_in">تعدیل‌های مثبت</option>
              <option value="adjustment_out">تعدیل‌های منفی</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="flex flex-col gap-1.5 text-right">
            <label className="text-xs font-semibold text-gray-500">جستجو در اقلام و کدهای کاردکس</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="نام کالا، کد، شرح سند یا تراکنش..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-gray-950 rounded-xl pl-3 pr-9 py-2.5 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200"
            title="بروزرسانی تراکنش‌ها"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش کاردکس</span>
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-extrabold text-gray-950 text-base">ریز تراکنش‌های کاردکس فیزیکی و ریالی</h3>
            <p className="text-gray-400 text-xs mt-0.5">ثبت‌شده بر اساس اولویت زمانی با جزییات بهای میانگین خرید</p>
          </div>
          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
            نمایش <strong>{transactions.length}</strong> تراکنش یافت شده
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            <p className="text-gray-500 text-xs mt-2">در حال بروزرسانی کاردکس کالا...</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-gray-400 bg-gray-50/50 border-b border-gray-50 pb-3">
                  <th className="py-3.5 pr-6 font-semibold text-xs">تاریخ و ساعت</th>
                  <th className="py-3.5 font-semibold text-xs">نوع تراکنش</th>
                  <th className="py-3.5 font-semibold text-xs">شرح تراکنش و سند</th>
                  <th className="py-3.5 font-semibold text-xs">کالا و مشخصات</th>
                  <th className="py-3.5 font-semibold text-xs">انبار مبادله</th>
                  <th className="py-3.5 text-left font-semibold text-xs">تعداد ورودی (+)/خروجی (-)</th>
                  <th className="py-3.5 text-left font-semibold text-xs">بهای واحد (ریال)</th>
                  <th className="py-3.5 text-left pl-6 font-semibold text-xs">ارزش کل تراکنش (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const badge = getTransactionBadge(tx.transaction_type);
                    const isAddition =
                      tx.transaction_type === 'stock_in' ||
                      tx.transaction_type === 'opening_balance' ||
                      tx.transaction_type === 'transfer_in' ||
                      tx.transaction_type === 'adjustment_in';

                    const totalValue = Number(tx.quantity) * Number(tx.unit_cost || 0);

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/40 transition-colors">
                        {/* Date */}
                        <td className="py-4 pr-6 text-gray-600 text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{new Date(tx.transaction_date).toLocaleDateString('fa-IR')}</span>
                          </div>
                        </td>

                        {/* Transaction Type Badge */}
                        <td className="py-4">
                          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-lg border ${badge.style}`}>
                            {badge.text}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 max-w-xs text-gray-700 text-xs leading-relaxed">
                          <div className="font-semibold text-gray-800">{tx.description || 'توضیحات پیش‌فرض سیستم'}</div>
                          {tx.reference_id && (
                            <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                              کد مرجع: {tx.reference_id.slice(-8)}
                            </div>
                          )}
                        </td>

                        {/* Item Info */}
                        <td className="py-4">
                          <div className="font-bold text-gray-900">{tx.item_name}</div>
                          <div className="text-gray-400 font-mono text-[10px] mt-0.5">کد کالا: {tx.item_code}</div>
                        </td>

                        {/* Warehouse */}
                        <td className="py-4 text-gray-600 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-gray-400" />
                            <span>{tx.warehouse_name}</span>
                          </div>
                        </td>

                        {/* Quantity with dynamic color */}
                        <td className={`py-4 text-left font-extrabold ${isAddition ? 'text-emerald-600' : 'text-rose-600'}`}>
                          <div className="flex items-center justify-end gap-1 font-mono">
                            {isAddition ? (
                              <ArrowDownLeft className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            <span>
                              {isAddition ? '+' : '-'}{tx.quantity.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400">
                              {tx.unit_name || 'عدد'}
                            </span>
                          </div>
                        </td>

                        {/* Unit Cost */}
                        <td className="py-4 text-left text-gray-500 font-mono text-xs">
                          {(tx.unit_cost || 0).toLocaleString()}
                        </td>

                        {/* Total Transaction Value */}
                        <td className="py-4 text-left pl-6 text-gray-850 font-mono text-xs font-bold">
                          {totalValue > 0 ? totalValue.toLocaleString() : '---'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                      هیچ گردشی منطبق با فیلترهای بالا یافت نشد. انبارها را مجددا بررسی کنید.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
