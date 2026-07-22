import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { Wallet } from 'lucide-react';

export function AccountsPage() {
  return (
    <PlaceholderPage
      title="حساب‌های بانکی و صندوق"
      description="تعریف کارتخوان، بانک‌ها، شماره حساب‌ها و صندوق‌های شرکت"
      icon={<Wallet className="w-6 h-6" />}
      moduleName="حساب‌های بانکی و صندوق"
      plannedFeatures={[
        'تعریف نامحدود حساب بانکی، شعب و شماره کارت',
        'مدیریت موجودی نقد و صورتحساب مغایرت‌گیری بانکی',
      ]}
    />
  );
}
