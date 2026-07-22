import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { RotateCcw } from 'lucide-react';

export function SalesReturnsPage() {
  return (
    <PlaceholderPage
      title="برگشت از فروش"
      description="ثبت اقلام مرجوعی و اصلاح حساب مشتریان"
      icon={<RotateCcw className="w-6 h-6" />}
      moduleName="برگشت از فروش"
      plannedFeatures={[
        'ارجاع خودکار کالاهای مرجوعی به انبار مربوطه',
        'صدور خودکار سند بستانکاری مشتری',
        'گزارش‌گیری دلایل مرجوعی کالاها',
      ]}
    />
  );
}
