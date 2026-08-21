import React, { useState, useEffect, useCallback } from 'react';
import { FolderTree, Plus, Edit2, Power, Trash2, Tag, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { categoryService } from '../../../services/categoryService';
import { ItemCategory } from '../../../types/catalog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Dialog } from '../../../components/ui/Dialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { showToast } from '../../../components/ui/Toast';
import { ItemCategoryTree } from '../components/ItemCategoryTree';

export function CategoriesPage() {
  const currentBusiness = useAuthStore((state) => state.currentBusiness);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Delete Dialog
  const [deletingCategory, setDeletingCategory] = useState<ItemCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    try {
      const data = await categoryService.getCategories(currentBusiness.id);
      setCategories(data || []);
    } catch (err: any) {
      showToast.error('خطا در دریافت دسته‌بندی‌ها', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = (parent?: ItemCategory) => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setParentId(parent ? parent.id : '');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: ItemCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parent_id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !name.trim()) {
      showToast.error('نام دسته‌بندی الزامی است.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(
          currentBusiness.id,
          editingCategory.id,
          {
            name: name.trim(),
            description: description.trim() || null,
            parent_id: parentId || null,
          },
          currentUserId
        );
        showToast.success('دسته‌بندی با موفقیت ویرایش شد.');
      } else {
        await categoryService.createCategory(
          currentBusiness.id,
          {
            name: name.trim(),
            description: description.trim() || null,
            parent_id: parentId || null,
          },
          currentUserId
        );
        showToast.success('دسته‌بندی جدید با موفقیت ثبت شد.');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast.error('خطا در ذخیره دسته‌بندی', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: ItemCategory) => {
    if (!currentBusiness) return;
    try {
      await categoryService.updateCategory(
        currentBusiness.id,
        cat.id,
        { is_active: !cat.is_active },
        currentUserId
      );
      showToast.success(`دسته‌بندی با موفقیت ${cat.is_active ? 'غیرفعال' : 'فعال'} شد.`);
      fetchCategories();
    } catch (err: any) {
      showToast.error('خطا در تغییر وضعیت دسته‌بندی', err.message);
    }
  };

  const handleDelete = async () => {
    if (!currentBusiness || !deletingCategory) return;
    try {
      await categoryService.deleteCategory(currentBusiness.id, deletingCategory.id, currentUserId);
      showToast.success('دسته‌بندی با موفقیت حذف شد.');
      fetchCategories();
    } catch (err: any) {
      showToast.error('امکان حذف دسته‌بندی وجود ندارد', err.message);
    } finally {
      setDeletingCategory(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="مدیریت دسته‌بندی‌های کالا و خدمات"
        description="سازمان‌دهی درختی و چندسطحی محصولات و خدمات کسب‌وکار"
        icon={<FolderTree className="w-6 h-6 text-amber-600" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>دسته‌بندی جدید</span>
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState text="در حال دریافت ساختار درختی دسته‌بندی‌ها..." />
      ) : (categories || []).length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <p className="text-slate-500 text-sm">هیچ دسته‌بندی تعریف نشده است.</p>

          <Button variant="primary" onClick={() => handleOpenCreateModal()} className="mx-auto">
            ایجاد اولین دسته‌بندی
          </Button>
        </Card>
      ) : (
        <Card className="p-5">
          <ItemCategoryTree
            categories={categories}
            onAddSubcategory={(parent) => handleOpenCreateModal(parent)}
            onEditCategory={(cat) => handleOpenEditModal(cat)}
            onDeactivateCategory={(cat) => handleToggleActive(cat)}
            onDeleteCategory={(cat) => setDeletingCategory(cat)}
          />
        </Card>
      )}

      {/* Modal Form */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'ویرایش دسته‌بندی' : 'تعریف دسته‌بندی جدید'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              نام دسته‌بندی <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="مثلاً: پنجره دوجداره"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              دسته‌بندی مادر (والد)
            </label>
            <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">-- بدون والد (دسته‌بندی اصلی) --</option>
              {categories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات
            </label>
            <Input
              placeholder="شرح مختصر دسته‌بندی..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

      {/* Delete Dialog */}
      {deletingCategory && (
        <ConfirmDialog
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleDelete}
          title="حذف دسته‌بندی"
          message={`آیا از حذف دسته‌بندی «${deletingCategory.name}» اطمینان دارید؟ اگر کالا یا زیرمجموعه‌ای به این دسته متصل باشد، حذف انجام نخواهد شد.`}
          confirmText="حذف کامل"
          variant="danger"
        />
      )}
    </div>
  );
}
