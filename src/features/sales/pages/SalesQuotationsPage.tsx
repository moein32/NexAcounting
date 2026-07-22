import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { FileText } from 'lucide-react';

export function SalesQuotationsPage() {
  return (
    <PlaceholderPage
      title="پیش‌فاکتورها"
      description="مدیریت و صدور پیش‌فاکتورهای ارائه‌شده به خریداران"
      icon={<FileText className="w-6 h-6" />}
      moduleName="پیش‌فاکتورهای فروش"
      plannedFeatures={[
        'تبدیل سریع پیش‌فاکتور به فاکتور فروش قطعی',
        'تعیین مهلت اعتبار و شرایط تسویه حساب',
        'ارسال لینک پیش‌فاکتور آنلاین و فایل PDF',
      ]}
    />
  );
}
