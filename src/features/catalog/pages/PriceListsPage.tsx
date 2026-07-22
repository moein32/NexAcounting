import React, { useState, useEffect, useCallback } from 'react';
import { Tags, Plus, Edit2, Star, Power, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { priceListService } from '../../../services/priceListService';
import { PriceList } from '../../../types/catalog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';
import { Dialog } from '../../../components/ui/Dialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { showToast } from '../../../components/ui/Toast';

export function PriceListsPage() {
  const { currentBusiness, currentUserId } = useAuthStore((state) => ({
    currentBusiness: state.currentBusiness,
    currentUserId: state.user?.id,
  }));

  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm Dialog
  const [deletingList, setDeletingList] = useState<PriceList | null>(null);

  const fetchPriceLists = useCallback(async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    try {
      const data = await priceListService.getPriceLists(currentBusiness.id);
      setPriceLists(data);
    } catch (err: any) {
      showToast.error('خطا در دریافت لیست‌های قیمت', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness]);

  useEffect(() => {
    fetchPriceLists();
  }, [fetchPriceLists]);

  const handleOpenCreateModal = () => {
    setEditingPriceList(null);
    setName('');
    setDescription('');
    setIsDefault(priceLists.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pl: PriceList) => {
    setEditingPriceList(pl);
    setName(pl.name);
    setDescription(pl.description || '');
    setIsDefault(pl.is_default);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !name.trim()) {
      showToast.error('نام لیست قیمت الزامی است.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPriceList) {
        await priceListService.updatePriceList(
          currentBusiness.id,
          editingPriceList.id,
          {
            name: name.trim(),
            description: description.trim() || null,
            is_default: isDefault,
          },
          currentUserId
        );
        showToast.success('لیست قیمت با موفقیت ویرایش شد.');
      } else {
        await priceListService.createPriceList(
          currentBusiness.id,
          {
            name: name.trim(),
            description: description.trim() || null,
            is_default: isDefault,
          },
          currentUserId
        );
        showToast.success('لیست قیمت جدید ایجاد گردید.');
      }
      setIsModalOpen(false);
      fetchPriceLists();
    } catch (err: any) {
      showToast.error('خطا در ثبت لیست قیمت', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (pl: PriceList) => {
    if (!currentBusiness) return;
    try {
      await priceListService.setDefaultPriceList(currentBusiness.id, pl.id);
      showToast.success(`لیست قیمت «${pl.name}» به عنوان لیست پیش‌فرض تنظیم شد.`);
      fetchPriceLists();
    } catch (err: any) {
      showToast.error('خطا در تنظیم لیست پیش‌فرض', err.message);
    }
  };

  const handleToggleActive = async (pl: PriceList) => {
    if (!currentBusiness) return;
    try {
      await priceListService.updatePriceList(
        currentBusiness.id,
        pl.id,
        { is_active: !pl.is_active },
        currentUserId
      );
      showToast.success(`لیست قیمت با موفقیت ${pl.is_active ? 'غیرفعال' : 'فعال'} شد.`);
      fetchPriceLists();
    } catch (err: any) {
      showToast.error('خطا در تغییر وضعیت لیست قیمت', err.message);
    }
  };

  const handleDelete = async () => {
    if (!currentBusiness || !deletingList) return;
    try {
      await priceListService.deletePriceList(currentBusiness.id, deletingList.id, currentUserId);
      showToast.success('لیست قیمت با موفقیت حذف شد.');
      fetchPriceLists();
    } catch (err: any) {
      showToast.error('خطا در حذف لیست قیمت', err.message);
    } finally {
      setDeletingList(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="مدیریت چند لیست قیمت"
        description="تعریف قیمت‌های متغیر و تخفیفات پله‌ای بر اساس گروه مشتریان (عمده‌فروشی، تک‌فروشی، همکار، سازمانی)"
        icon={<Tags className="w-6 h-6 text-purple-600" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>لیست قیمت جدید</span>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState text="در حال دریافت لیست‌های قیمت..." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">عنوان لیست قیمت</th>
                  <th className="py-3.5 px-4">توضیحات</th>
                  <th className="py-3.5 px-4">تعداد کالاها</th>
                  <th className="py-3.5 px-4">پیش‌فرض</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {priceLists.map((pl) => (
                  <tr
                    key={pl.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{pl.name}</span>
                        {pl.is_default && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            پیش‌فرض فاکتور
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {pl.description || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {pl.item_count ?? 0} کالا
                    </td>

                    <td className="py-3.5 px-4">
                      {pl.is_default ? (
                        <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                          <Star className="w-4 h-4 fill-blue-600" /> اصلی
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(pl)}
                          className="text-xs text-slate-400 hover:text-blue-600"
                        >
                          تنظیم به عنوان اصلی
                        </Button>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {pl.is_active ? (
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
                          onClick={() => handleOpenEditModal(pl)}
                          className="text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(pl)}
                          className={pl.is_active ? 'text-amber-600' : 'text-emerald-600'}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                        {!pl.is_default && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingList(pl)}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
        title={editingPriceList ? 'ویرایش لیست قیمت' : 'تعریف لیست قیمت جدید'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان لیست قیمت <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="مثلاً: قیمت عمده‌فروشی / نمایندگان"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات
            </label>
            <Input
              placeholder="توضیح کوتاه درباره شرایط این لیست قیمت..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefaultList"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
            <label
              htmlFor="isDefaultList"
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              لیست قیمت پیش‌فرض صدور فاکتورهای فروش باشد
            </label>
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

      {/* Delete Dialog */}
      {deletingList && (
        <ConfirmDialog
          isOpen={!!deletingList}
          onClose={() => setDeletingList(null)}
          onConfirm={handleDelete}
          title="حذف لیست قیمت"
          message={`آیا از حذف لیست قیمت «${deletingList.name}» اطمینان دارید؟`}
          confirmText="حذف کامل"
          variant="danger"
        />
      )}
    </div>
  );
}
