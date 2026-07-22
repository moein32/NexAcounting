import React from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Party } from '../../../types/party';
import { AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import { PartyTypeBadge, PartyRoleBadge } from './PartyBadge';

interface PartyDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAnyway: () => void;
  existingParty: Party | null;
  duplicateField?: 'mobile' | 'phone' | 'national_id' | 'economic_code';
}

const FIELD_LABELS: Record<string, string> = {
  mobile: 'شماره موبایل',
  phone: 'شماره تلفن',
  national_id: 'کد / شناسه ملی',
  economic_code: 'کد اقتصادی',
};

export function PartyDuplicateModal({
  isOpen,
  onClose,
  onProceedAnyway,
  existingParty,
  duplicateField = 'mobile',
}: PartyDuplicateModalProps) {
  if (!existingParty) return null;

  const fieldLabel = FIELD_LABELS[duplicateField] || 'مشخصات تماس';

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="هشدار وجود طرف حساب تکراری"
      icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-2">
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">یک شخص/شرکت مشابه قبلاً ثبت شده است!</p>
            <p className="text-amber-800 dark:text-amber-300">
              {fieldLabel} وارد شده ({existingParty[duplicateField] || 'تکراری'}) قبلاً برای یک طرف حساب دیگر در این کسب‌وکار استفاده شده است.
            </p>
          </div>
        </div>

        {/* Existing Party Preview Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">طرف حساب ثبت شده:</span>
            <div className="flex items-center gap-1.5">
              <PartyTypeBadge type={existingParty.party_type} />
              {existingParty.roles?.map((r) => (
                <PartyRoleBadge key={r} role={r} />
              ))}
            </div>
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {existingParty.display_name}
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
            <div>
              موبایل: <span className="font-mono text-slate-900 dark:text-slate-200">{existingParty.mobile || '—'}</span>
            </div>
            <div>
              کد ملی: <span className="font-mono text-slate-900 dark:text-slate-200">{existingParty.national_id || '—'}</span>
            </div>
            {existingParty.company_name && (
              <div className="col-span-2">
                نام شرکت: <span className="font-medium text-slate-800 dark:text-slate-200">{existingParty.company_name}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <a
              href={`/parties/${existingParty.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>مشاهده و بررسی پروفایل ثبت‌شده</span>
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          آیا مایلید ثبت اطلاعات تکراری را ادامه دهید یا می‌خواهید فرم را اصلاح نمایید؟
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            اصلاح اطلاعات
          </Button>
          <Button variant="warning" size="sm" onClick={onProceedAnyway}>
            ادامه و ثبت نهایی تکراری
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
