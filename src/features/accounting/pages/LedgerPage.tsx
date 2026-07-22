import React from 'react';
import { PlaceholderPage } from '../../../components/common/PlaceholderPage';
import { Calculator } from 'lucide-react';

export function LedgerPage() {
  return (
    <PlaceholderPage
      title="دفتر کل و معین"
      description="گزارش تفکیکی و گردش حساب‌های کل و معین همراه با مانده نهایی"
      icon={<Calculator className="w-6 h-6" />}
      moduleName="دفتر کل و معین"
      plannedFeatures={[
        'استخراج تراز ۴ ستونی و ۸ ستونی آزمایشی',
        'مشاهده کارت گردش حساب و مانده بدهکار/بستانکار',
      ]}
    />
  );
}
