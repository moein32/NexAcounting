import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { AlertCircle, ChevronLeft, ShieldAlert, Package, Calendar, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';

interface SystemAlertsProps {
  lowStockItems?: {
    id: string;
    name: string;
    code: string;
    current_qty: number;
    min_stock: number;
    unit: string;
  }[];
  upcomingChecks?: any[];
  upcomingCommitments?: any[];
}

export function SystemAlerts({ lowStockItems = [], upcomingChecks = [], upcomingCommitments = [] }: SystemAlertsProps) {
  const alertsCount = (lowStockItems || []).length + (upcomingChecks || []).length + (upcomingCommitments || []).length;

  return (
    <Card className="h-full border-amber-200/50 dark:border-amber-900/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>هشدارها و سررسیدهای مهم</span>
          </CardTitle>
          <CardDescription>موارد نیازمند پیگیری و کسری‌های انبار</CardDescription>
        </div>
        <Badge variant={alertsCount > 0 ? "warning" : "success"}>
          {alertsCount} هشدار فعال
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 1. Low Stock Alerts */}
          {(lowStockItems || []).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 px-1">
                <Package className="w-3.5 h-3.5" />
                <span>کسری موجودی انبار ({(lowStockItems || []).length} کالا)</span>
              </h3>
              <div className="space-y-2">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2.5 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="truncate">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">کد کالا: {item.code}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-black text-rose-600 dark:text-rose-400">{item.current_qty} {item.unit}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">حداقل: {item.min_stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Upcoming Checks */}
          {(upcomingChecks || []).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <h3 className="text-[11px] font-bold text-blue-500 flex items-center gap-1.5 px-1">
                <Landmark className="w-3.5 h-3.5" />
                <span>چک‌های سررسید نزدیک ({(upcomingChecks || []).length} فقره)</span>
              </h3>
              <div className="space-y-2">
                {upcomingChecks.slice(0, 3).map((check) => (
                  <div key={check.id} className="p-2.5 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="truncate">
                      <p className="font-bold text-slate-900 dark:text-slate-100 truncate">چک شماره {check.check_number}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{check.party_name} ({check.type === 'received' ? 'دریافتی' : 'پرداختی'})</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-black text-slate-900 dark:text-slate-100 block">{formatCurrency(check.amount, 'تومان')}</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-0.5">{formatPersianDate(check.due_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Upcoming Commitments */}
          {(upcomingCommitments || []).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <h3 className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5 px-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>تعهدهای مالی سررسید شده ({(upcomingCommitments || []).length} مورد)</span>
              </h3>
              <div className="space-y-2">
                {upcomingCommitments.slice(0, 3).map((commit) => {
                  const isOverdue = new Date(commit.due_date) < new Date();
                  return (
                    <div key={commit.id} className="p-2.5 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="truncate">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{commit.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">دسته‌بندی: {commit.category === 'rent' ? 'اجاره' : commit.category === 'salary' ? 'حقوق' : 'سایر'}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className="font-black text-slate-900 dark:text-slate-100 block">{formatCurrency(commit.amount, 'تومان')}</span>
                        <span className={`text-[10px] font-bold block mt-0.5 ${isOverdue ? 'text-rose-500' : 'text-amber-600'}`}>
                          {formatPersianDate(commit.due_date)} {isOverdue && '(گذشته)'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {alertsCount === 0 && (
            <div className="text-center py-6 text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
              <p className="text-xs font-semibold text-slate-500">هیچ هشدار یا سررسیدی وجود ندارد.</p>
              <p className="text-[10px] text-slate-400">وضعیت کسب‌و‌کار شما کاملاً سبز است!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
