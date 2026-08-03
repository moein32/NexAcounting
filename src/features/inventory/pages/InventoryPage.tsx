import React, { useState, useEffect } from 'react';
import { InventoryHeader } from '../components/InventoryHeader';
import { inventoryService } from '../../../services/inventoryService';
import { useAuthStore } from '../../../stores/authStore';
import {
  Warehouse,
  Boxes,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  ArrowLeftRight,
  Sliders,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export function InventoryPage() {
  const navigate = useNavigate();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalWarehouses: 0,
    totalStockItems: 0,
    lowStockItemsCount: 0,
    outOfStockItemsCount: 0,
    recentTransactions: [],
    inventoryValue: 0,
  });
  const [balancesByWarehouse, setBalancesByWarehouse] = useState<any[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getInventoryDashboardData(businessId);
      setStats(data);

      const warehouses = await inventoryService.getWarehouses(businessId);
      const balances = await inventoryService.getInventoryBalances(businessId);

      // Group stock by warehouse
      const grouped = warehouses.map((w) => {
        const whBalances = balances.filter((b) => b.warehouse_id === w.id);
        const totalQty = whBalances.reduce((sum, b) => sum + b.quantity, 0);
        const totalVal = whBalances.reduce((sum, b) => sum + (b.quantity * (b.unit_cost || 0)), 0);
        return {
          name: w.name,
          quantity: totalQty,
          value: totalVal / 1000000, // Value in Millions of Tomans
        };
      });
      setBalancesByWarehouse(grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const COLORS = ['#1f2937', '#4b5563', '#9ca3af', '#d1d5db', '#e5e7eb'];

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'opening_balance':
        return { text: 'موجودی اولیه', color: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'stock_in':
        return { text: 'رسید ورود', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'stock_out':
        return { text: 'حواله خروج', color: 'bg-rose-50 text-rose-700 border-rose-100' };
      case 'transfer_in':
        return { text: 'انتقال (ورود)', color: 'bg-purple-50 text-purple-700 border-purple-100' };
      case 'transfer_out':
        return { text: 'انتقال (خروج)', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
      case 'adjustment_in':
        return { text: 'تعدیل مثبت', color: 'bg-amber-50 text-amber-700 border-amber-100' };
      case 'adjustment_out':
        return { text: 'تعدیل منفی', color: 'bg-orange-50 text-orange-700 border-orange-100' };
      default:
        return { text: 'گردش انبار', color: 'bg-gray-50 text-gray-700 border-gray-100' };
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <InventoryHeader />

      {/* Toolbar / Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-gray-500 text-xs">بروزرسانی داده‌ها</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/inventory/warehouses?action=new-doc&type=receipt')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>رسید ورود کالا (خرید)</span>
          </button>
          <button
            onClick={() => navigate('/inventory/warehouses?action=new-doc&type=issue')}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>حواله خروج کالا (فروش)</span>
          </button>
          <button
            onClick={() => navigate('/inventory/warehouses?action=transfer')}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>انتقال بین انبارها</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white border border-gray-100 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-gray-500 text-sm mt-3">در حال بارگذاری اطلاعات داشبورد انبار...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-semibold block">کل انبارهای فعال</span>
                <span className="text-3xl font-bold text-gray-950 mt-1.5 block">{stats.totalWarehouses}</span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <span>۱۰۰٪ فعال</span>
                </span>
              </div>
              <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
                <Warehouse className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-semibold block">اقلام دارای موجودی</span>
                <span className="text-3xl font-bold text-gray-950 mt-1.5 block">{stats.totalStockItems}</span>
                <span className="text-xs text-gray-500 font-medium block mt-1">از کل کالاهای کاتالوگ</span>
              </div>
              <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-semibold block">کالاهای زیر حداقل موجودی</span>
                <span className="text-3xl font-bold text-amber-600 mt-1.5 block">{stats.lowStockItemsCount}</span>
                {stats.lowStockItemsCount > 0 ? (
                  <button
                    onClick={() => navigate('/inventory/low-stock')}
                    className="text-xs text-amber-700 underline font-medium block mt-1"
                  >
                    مشاهده هشدارها و شارژ انبار
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium block mt-1">وضعیت انبارها پایدار است</span>
                )}
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-gray-400 text-xs font-semibold block">ارزش ریالی دارایی انبار</span>
                <span className="text-2xl font-bold text-gray-950 mt-1.5 block">
                  {stats.inventoryValue.toLocaleString()} <span className="text-sm font-normal text-gray-500">تومان</span>
                </span>
                <span className="text-xs text-gray-500 font-medium block mt-1">محاسبه بر اساس بهای خرید</span>
              </div>
              <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">توزیع ریالی سرمایه در انبارها (میلیون تومان)</h3>
              <div className="h-72 w-full">
                {balancesByWarehouse.some((b) => b.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={balancesByWarehouse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <Tooltip
                        formatter={(value: any) => [`${Number(value).toFixed(2)} میلیون تومان`, 'ارزش کل']}
                        labelClassName="font-medium"
                      />
                      <Bar dataKey="value" fill="#111827" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    داده‌ای برای نمایش ارزش ریالی کالاها یافت نشد.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-gray-900 mb-4">سهم تعداد اقلام کل</h3>
              <div className="h-56 w-full flex-1">
                {balancesByWarehouse.some((b) => b.quantity > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={balancesByWarehouse}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="quantity"
                      >
                        {balancesByWarehouse.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${value} عدد`, 'تعداد کل کالاها']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    انبارها در حال حاضر خالی هستند.
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
                {balancesByWarehouse.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-600">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Ledger */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-950">آخرین تراکنش‌های گردش انبار</h3>
                <p className="text-gray-500 text-xs mt-0.5">تاریخچه ورود و خروج فیزیکی اقلام کالا</p>
              </div>
              <button
                onClick={() => navigate('/inventory/transactions')}
                className="text-xs text-primary-600 hover:text-primary-800 font-semibold border-b border-primary-100 pb-0.5 hover:border-primary-300 transition-colors"
              >
                مشاهده کاردکس کامل
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-50 pb-3">
                    <th className="pb-3 font-semibold">تاریخ تراکنش</th>
                    <th className="pb-3 font-semibold">نوع عملیات</th>
                    <th className="pb-3 font-semibold">شرح کالا</th>
                    <th className="pb-3 font-semibold">کد کالا</th>
                    <th className="pb-3 font-semibold">انبار</th>
                    <th className="pb-3 font-semibold text-left">تعداد</th>
                    <th className="pb-3 font-semibold text-left">بهای واحد (ریال)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentTransactions.length > 0 ? (
                    stats.recentTransactions.map((tx: any) => {
                      const label = getTransactionLabel(tx.transaction_type);
                      const isAddition =
                        tx.transaction_type === 'stock_in' ||
                        tx.transaction_type === 'opening_balance' ||
                        tx.transaction_type === 'transfer_in' ||
                        tx.transaction_type === 'adjustment_in';

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 text-gray-600 text-xs">
                            {new Date(tx.transaction_date).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg border ${label.color}`}>
                              {label.text}
                            </span>
                          </td>
                          <td className="py-3.5 font-medium text-gray-900">{tx.item_name}</td>
                          <td className="py-3.5 text-gray-500 font-mono text-xs">{tx.item_code || '---'}</td>
                          <td className="py-3.5 text-gray-600">{tx.warehouse_name}</td>
                          <td className={`py-3.5 text-left font-bold ${isAddition ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isAddition ? '+' : '-'}{tx.quantity.toLocaleString()} {tx.unit_name || 'عدد'}
                          </td>
                          <td className="py-3.5 text-left text-gray-500 font-mono text-xs">
                            {(tx.unit_cost || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                        تراکنش جدیدی ثبت نشده است. ابتدا یک کالا وارد انبار کنید.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
