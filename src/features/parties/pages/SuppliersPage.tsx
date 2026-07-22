import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { Truck } from 'lucide-react';

export function SuppliersPage() {
  return (
    <PlaceholderPage
      title="تأمین‌کنندگان"
      description="لیست و مانده حساب فروشندگان کالای اولیه و پیمانکاران"
      icon={<Truck className="w-6 h-6" />}
      moduleName="تأمین‌کنندگان"
      plannedFeatures={[
        'مدیریت پرونده طرف حساب و شناسه ملی/کد اقتصادی',
        'مشاهده صورتحساب و گردش مبالغ خرید و پرداخت',
      ]}
    />
  );
}
