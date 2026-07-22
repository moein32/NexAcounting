import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { CreditCard } from 'lucide-react';

export function ChecksIssuedPage() {
  return (
    <PlaceholderPage
      title="چک‌های پرداختی (دسته چک)"
      description="مدیریت دسته چک‌ها و برگه چک‌های صادرشده به نام فروشندگان"
      icon={<CreditCard className="w-6 h-6" />}
      moduleName="چک‌های پرداختی"
      plannedFeatures={[
        'تعریف دسته چک‌های فعال بانک‌ها',
        'پیگیری سررسید پاس شدن چک‌های پرداختی شرکتی',
      ]}
    />
  );
}
