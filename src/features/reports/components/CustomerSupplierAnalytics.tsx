import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formatCurrency } from '../../../lib/utils';
import { Users, Search, Award, TrendingUp, TrendingDown, UserX } from 'lucide-react';

interface CustomerSupplierAnalyticsProps {
  customers: any[];
  suppliers: any[];
}

export function CustomerSupplierAnalytics({ customers = [], suppliers = [] }: CustomerSupplierAnalyticsProps) {
  const [activeTab, setActiveTab] = React.useState<'customers' | 'suppliers'>('customers');
  const [search, setSearch] = React.useState('');

  const list = activeTab === 'customers' ? customers : suppliers;
  
  const filteredList = list.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.phone && item.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('customers'); setSearch(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
            }`}
          >
            آنالیز مشتریان (خرید و مطالبات)
          </button>
          <button
            onClick={() => { setActiveTab('suppliers'); setSearch(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'suppliers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80'
            }`}
          >
            آنالیز تامین‌کنندگان (خرید و بدهی‌ها)
          </button>
        </div>

        {/* Local Search input */}
        <div className="relative w-48 sm:w-64">
          <input
            type="text"
            placeholder="جستجوی طرف حساب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-semibold p-2 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
        </div>
      </div>

      {/* Grid Profiling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Stats and Highlights */}
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">بخش‌بندی بر اساس وفاداری (CLV)</CardTitle>
              <CardDescription>بررسی ارزش طول عمر مشتریان</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTab === 'customers' ? (
                <>
                  <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>مشتریان ویژه (Premium)</span>
                    </span>
                    <Badge variant="primary">
                      {customers.filter(c => c.clvGroup === 'premium').length} نفر
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>مشتریان وفادار (Loyal)</span>
                    </span>
                    <Badge variant="success">
                      {customers.filter(c => c.clvGroup === 'loyal').length} نفر
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-rose-500" />
                      <span>مشتریان غیرفعال (Inactive)</span>
                    </span>
                    <Badge variant="danger">
                      {customers.filter(c => c.clvGroup === 'inactive').length} نفر
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-xs text-center py-6">
                  رتبه‌بندی تامین‌کنندگان بر بر اساس حجم معاملات ورودی محاسبه می‌شود.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Detailed Table / List */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">
                {activeTab === 'customers' ? 'شناسنامه مالی مشتریان' : 'شناسنامه مالی تامین‌کنندگان'}
              </CardTitle>
              <CardDescription>بررسی مانده حساب، میزان خرید و آخرین تاریخ فعالیت</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3.5">نام طرف حساب</th>
                      <th className="p-3.5">تعداد فاکتور</th>
                      <th className="p-3.5">حجم کل معامله</th>
                      <th className="p-3.5">مانده تراز (بدهکار/بستانکار)</th>
                      <th className="p-3.5">آخرین معامله</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {(filteredList || []).length > 0 ? (
                      filteredList.map((item) => {
                        const isDebtor = item.balance > 0;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                              <div className="flex flex-col gap-0.5">
                                <span>{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{item.phone}</span>
                              </div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">{item.invoiceCount} فاکتور</td>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.totalPurchases, 'تومان')}</td>
                            <td className="p-3.5 font-black">
                              <span className={isDebtor ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                {formatCurrency(Math.abs(item.balance), 'تومان')}
                                <span className="text-[10px] font-bold mr-1">{isDebtor ? '(بدهکار)' : '(تسویه/بستانکار)'}</span>
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-slate-500 dark:text-slate-400">{item.lastInvoice}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">طرف حسابی پیدا نشد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
