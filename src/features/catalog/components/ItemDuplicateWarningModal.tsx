import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { ItemDuplicateCheckResult } from '../../../types/catalog';

interface ItemDuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateInfo: ItemDuplicateCheckResult;
}

export function ItemDuplicateWarningModal({
  isOpen,
  onClose,
  duplicateInfo,
}: ItemDuplicateWarningModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="هشدار تکرار شناسه کالا" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">شناسه‌های وارد شده قبلاً برای کالاهای دیگر استفاده شده‌اند:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
              {duplicateInfo.hasDuplicateSku && (
                <li>
                  <span className="font-bold">SKU:</span> در کالای «
                  {duplicateInfo.duplicateItemNames.sku}» ثبت شده است.
                </li>
              )}
              {duplicateInfo.hasDuplicateBarcode && (
                <li>
                  <span className="font-bold">بارکد:</span> در کالای «
                  {duplicateInfo.duplicateItemNames.barcode}» ثبت شده است.
                </li>
              )}
              {duplicateInfo.hasDuplicateCode && (
                <li>
                  <span className="font-bold">کد کالا:</span> در کالای «
                  {duplicateInfo.duplicateItemNames.code}» ثبت شده است.
                </li>
              )}
            </ul>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          برای حفظ یکپارچگی انبار و سیستم مالی، SKU و بارکد کالا باید یکتا باشند. لطفاً مقادیر دیگری وارد کنید.
        </p>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            متوجه شدم، اصلاح می‌کنم
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
