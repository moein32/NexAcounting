import React from 'react';
import { MOCK_SYSTEM_ALERTS } from '../../../services/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { AlertCircle, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SystemAlerts() {
  return (
    <Card className="h-full border-amber-200/50 dark:border-amber-900/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>هشدارها و رویدادهای مهم</span>
          </CardTitle>
          <CardDescription>موارد نیازمند پیگیری فورس‌ماژور و سررسیدها</CardDescription>
        </div>
        <Badge variant="warning">{MOCK_SYSTEM_ALERTS.length} هشدار</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {MOCK_SYSTEM_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{alert.title}</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">{alert.date}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-6">{alert.description}</p>
              {alert.actionUrl && (
                <div className="pt-1 flex justify-end">
                  <Link
                    to={alert.actionUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline"
                  >
                    <span>پیگیری و بررسی</span>
                    <ChevronLeft className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
