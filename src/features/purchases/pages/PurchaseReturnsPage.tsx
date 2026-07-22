import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { RotateCcw } from 'lucide-react';

export function PurchaseReturnsPage() {
  return (
    <PlaceholderPage
      title="برگشت از خرید"
      description="ثبت اقلام عودت‌داده‌شده به فروشندگان و کاهش حساب بدهی"
      icon={<RotateCcw className="w-6 h-6" />}
      moduleName="برگشت از خرید"
      plannedFeatures={[
        'کاهش خودکار موجودی انبار اقلام مرجوعی',
        'صدور خودکار سند کسر حساب بستانکار',
      ]}
    />
  );
}
