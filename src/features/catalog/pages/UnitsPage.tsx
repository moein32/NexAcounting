import React, { useState, useEffect, useCallback } from 'react';
import { Ruler, Plus, Edit2, Power, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { unitService } from '../../../services/unitService';
import { Unit, UnitType } from '../../../types/catalog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Dialog } from '../../../components/ui/Dialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { showToast } from '../../../components/ui/Toast';

const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  count: 'تعدادی / عددی',
  weight: 'وزنی (کیلوگرم، تن)',
  length: 'طولی (متر، سانتیمتر)',
  area: 'مساحت (مترمربع)',
  volume: 'حجم (لیتر، مترمکعب)',
  time: 'زمانی (ساعت، روز)',
  service: 'خدماتی / سرویس',
  other: 'سایر',
};

export function UnitsPage() {
  const currentBusiness = useAuthStore((state) => state.currentBusiness);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('count');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUnits = useCallback(async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    try {
      const data = await unitService.getUnits(currentBusiness.id);
      setUnits(data || []);
    } catch (err: any) {
      showToast.error('خطا در دریافت واحدها', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleOpenCreateModal = () => {
    setEditingUnit(null);
    setName('');
    setSymbol('');
    setUnitType('count');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setName(unit.name);
    setSymbol(unit.symbol || '');
    setUnitType(unit.unit_type);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !name.trim()) {
      showToast.error('نام واحد الزامی است.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUnit) {
        await unitService.updateUnit(
          currentBusiness.id,
          editingUnit.id,
          {
            name: name.trim(),
            symbol: symbol.trim() || null,
            unit_type: unitType,
          },
          currentUserId
        );
        showToast.success('واحد اندازه‌گیری با موفقیت ویرایش شد.');
      } else {
        await unitService.createUnit(
          currentBusiness.id,
          {
            name: name.trim(),
            symbol: symbol.trim() || null,
            unit_type: unitType,
          },
          currentUserId
        );
        showToast.success('واحد اندازه‌گیری جدید ثبت شد.');
      }
      setIsModalOpen(false);
      fetchUnits();
    } catch (err: any) {
      showToast.error('خطا در ذخیره واحد', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (unit: Unit) => {
    if (!currentBusiness) return;
    try {
      await unitService.updateUnit(
        currentBusiness.id,
        unit.id,
        { is_active: !unit.is_active },
        currentUserId
      );
      showToast.success(`واحد با موفقیت ${unit.is_active ? 'غیرفعال' : 'فعال'} شد.`);
      fetchUnits();
    } catch (err: any) {
      showToast.error('خطا در تغییر وضعیت واحد', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="مدیریت واحدهای اندازه‌گیری"
        description="تعریف واحدهای سنجش کالاها و خدمات (عدد، متر، مترمربع، کیلوگرم، ساعت و...)"
        icon={<Ruler className="w-6 h-6 text-emerald-600" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف واحد جدید</span>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState text="در حال دریافت لیست واحدهای اندازه‌گیری..." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">عنوان واحد</th>
                  <th className="py-3.5 px-4">نماد / علامت</th>
                  <th className="py-3.5 px-4">نوع اندازه‌گیری</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(units || []).map((unit) => (
                  <tr
                    key={unit.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {unit.name}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {unit.symbol || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {UNIT_TYPE_LABELS[unit.unit_type] || unit.unit_type}
                    </td>

                    <td className="py-3.5 px-4">
                      {unit.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> غیرفعال
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditModal(unit)}
                          className="text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(unit)}
                          className={unit.is_active ? 'text-amber-600' : 'text-emerald-600'}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'ویرایش واحد' : 'تعریف واحد جدید'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان واحد <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="مثلاً: مترمربع"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              نماد اختصاری (Symbol)
            </label>
            <Input
              placeholder="مثلاً: m²"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              نوع کمیت
            </label>
            <Select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as UnitType)}
              options={Object.entries(UNIT_TYPE_LABELS).map(([key, label]) => ({
                value: key,
                label: label,
              }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              ذخیره
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
