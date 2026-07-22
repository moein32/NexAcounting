import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { Warehouse } from 'lucide-react';

export function InventoryPage() {
  return (
    <PlaceholderPage
      title="مدیریت انبارها"
      description="کنترل کاردکس کالا، حواله انبار، رسید ورود و انبارگردانی"
      icon={<Warehouse className="w-6 h-6" />}
      moduleName="انبارداری"
      plannedFeatures={[
        'رسید ورود انبار (خرید) و حواله خروج انبار (فروش)',
        'انتقال کالا بین انبارهای مختلف شرکت',
        'گزارش موجودی تعدادی و ریالی به روش میانگین موزون یا FIFO',
        'ثبت انبارگردانی و مغایرت‌گیری پایان دوره',
      ]}
    />
  );
}
