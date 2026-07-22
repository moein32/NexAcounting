import React from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PartyFormWizard } from '../components/PartyFormWizard';
import { UserPlus } from 'lucide-react';

export function CreatePartyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="تعریف طرف حساب جدید"
        description="ثبت مشخصات شناسنامه‌ای، ارتباطی و تنظیمات مالی مشتری یا تأمین‌کننده"
        icon={<UserPlus className="w-6 h-6 text-blue-600" />}
      />

      <PartyFormWizard />
    </div>
  );
}
