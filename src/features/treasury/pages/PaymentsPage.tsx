import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { CreditCard } from 'lucide-react';

export function PaymentsPage() {
  return (
    <PlaceholderPage
      title="پرداخت‌های خزانه"
      description="ثبت خروج نقدینگی، انتقال کارت به کارت، حواله بانکی و صدور چک"
      icon={<CreditCard className="w-6 h-6" />}
      moduleName="پرداخت‌های خزانه"
      plannedFeatures={[
        'ثبت پرداخت بابت فاکتور خرید یا هزینه جاری',
        'انتقال بین حساب‌های بانکی و صندوق شرکت',
      ]}
    />
  );
}
