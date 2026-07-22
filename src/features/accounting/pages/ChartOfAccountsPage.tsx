import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Calculator, Plus, Folder, FolderOpen, FileText } from 'lucide-react';

interface AccountNode {
  code: string;
  title: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  level: 'group' | 'general' | 'subsidiary';
  children?: AccountNode[];
}

const mockChart: AccountNode[] = [
  {
    code: '1',
    title: 'دارایی‌های جاری',
    type: 'asset',
    level: 'group',
    children: [
      {
        code: '101',
        title: 'موجود نقد و بانک',
        type: 'asset',
        level: 'general',
        children: [
          { code: '10101', title: 'صندوق مرکزی ریالی', type: 'asset', level: 'subsidiary' },
          { code: '10102', title: 'بانک ملت - حساب جاری 9042', type: 'asset', level: 'subsidiary' },
          { code: '10103', title: 'بانک سامان - حساب جاری 1102', type: 'asset', level: 'subsidiary' },
        ],
      },
      {
        code: '102',
        title: 'حساب‌ها و اسناد دریافتنی تجاری',
        type: 'asset',
        level: 'general',
        children: [
          { code: '10201', title: 'بدهکاران تجاری (مشتریان)', type: 'asset', level: 'subsidiary' },
          { code: '10202', title: 'اسناد دریافتنی نزد صندوق (چک‌ها)', type: 'asset', level: 'subsidiary' },
        ],
      },
    ],
  },
  {
    code: '2',
    title: 'بدهی‌های جاری',
    type: 'liability',
    level: 'group',
    children: [
      {
        code: '201',
        title: 'حساب‌ها و اسناد پرداختنی تجاری',
        type: 'liability',
        level: 'general',
        children: [
          { code: '20101', title: 'بستانکاران تجاری (تأمین‌کنندگان)', type: 'liability', level: 'subsidiary' },
          { code: '20102', title: 'اسناد پرداختنی (چک‌های صادرشده)', type: 'liability', level: 'subsidiary' },
        ],
      },
    ],
  },
];

export function ChartOfAccountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="کدینگ و درخت حساب‌ها"
        description="ساختار گروه، کل و معین حسابداری دوبل بر اساس استانداردهای مالی"
        icon={<Calculator className="w-6 h-6" />}
        actions={
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => alert('افزودن حساب جدید')}>
            تعریف کد حساب جدید
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>درخت کدینگ استاندارد حسابداری</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockChart.map((group) => (
            <div key={group.code} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    [{group.code}] {group.title}
                  </span>
                </div>
                <Badge variant="primary">حساب گروه</Badge>
              </div>

              {group.children?.map((general) => (
                <div key={general.code} className="pr-6 space-y-2 border-r-2 border-blue-200 dark:border-blue-800/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      <span>
                        [{general.code}] {general.title}
                      </span>
                    </div>
                    <Badge variant="neutral">حساب کل</Badge>
                  </div>

                  <div className="pr-6 space-y-1.5 border-r-2 border-indigo-100 dark:border-indigo-900/40">
                    {general.children?.map((sub) => (
                      <div key={sub.code} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            [{sub.code}] {sub.title}
                          </span>
                        </div>
                        <Badge variant="success" size="sm">معین فعال</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
