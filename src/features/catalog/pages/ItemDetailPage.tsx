import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  Wrench,
  Edit,
  ArrowRight,
  Power,
  Trash2,
  Tag,
  DollarSign,
  Info,
  Warehouse,
  History,
  Barcode,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { itemService } from '../../../services/itemService';
import { Item } from '../../../types/catalog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { showToast } from '../../../components/ui/Toast';
import { ItemTypeBadge, ItemStatusBadge } from '../components/ItemTypeBadge';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentBusiness = useAuthStore((state) => state.currentBusiness);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prices' | 'attributes' | 'inventory' | 'history'>('overview');

  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function loadItem() {
      if (!currentBusiness || !id) return;
      setIsLoading(true);
      try {
        const fetched = await itemService.getItemById(currentBusiness.id, id);
        if (!fetched) {
          showToast.error('کالا یا خدمت پیدا نشد');
          navigate('/items');
          return;
        }
        setItem(fetched);
      } catch (err: any) {
        showToast.error('خطا در دریافت اطلاعات کالا', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [currentBusiness, id, navigate]);

  const handleToggleActive = async () => {
    if (!currentBusiness || !item) return;
    try {
      if (item.is_active) {
        await itemService.deactivateItem(currentBusiness.id, item.id, currentUserId);
        setItem({ ...item, is_active: false });
        showToast.success('کالا با موفقیت غیرفعال شد.');
      } else {
        await itemService.updateItem(currentBusiness.id, item.id, { is_active: true }, currentUserId);
        setItem({ ...item, is_active: true });
        showToast.success('کالا با موفقیت فعال شد.');
      }
    } catch (err: any) {
      showToast.error('خطا در تغییر وضعیت کالا', err.message);
    } finally {
      setShowDeactivateDialog(false);
    }
  };

  const handleDelete = async () => {
    if (!currentBusiness || !item) return;
    try {
      await itemService.deleteItem(currentBusiness.id, item.id, currentUserId);
      showToast.success('کالا با موفقیت از سیستم حذف شد.');
      navigate('/items');
    } catch (err: any) {
      showToast.error('خطا در حذف کالا', err.message);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="در حال بارگذاری شناسنامه کالا..." />;
  }

  if (!item) {
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={item.name}
        description={`${item.item_type === 'product' ? 'کالای فیزیکی' : 'خدمت / سرویس'} - کد: ${item.code || '-'}`}
        icon={
          item.item_type === 'product' ? (
            <Package className="w-6 h-6 text-blue-600" />
          ) : (
            <Wrench className="w-6 h-6 text-purple-600" />
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/items')}
              className="gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به لیست</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/items/${item.id}/edit`)}
              className="gap-1.5 text-amber-600 hover:bg-amber-50"
            >
              <Edit className="w-4 h-4" />
              <span>ویرایش</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeactivateDialog(true)}
              className={`gap-1.5 ${
                item.is_active
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{item.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-1.5 text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </Button>
          </div>
        }
      />

      {/* Overview Top Info Banner */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                {item.item_type === 'product' ? (
                  <Package className="w-8 h-8 text-blue-500" />
                ) : (
                  <Wrench className="w-8 h-8 text-purple-500" />
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <ItemTypeBadge type={item.item_type} />
                <ItemStatusBadge isActive={item.is_active} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {item.name}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {item.code && <span>کد: <strong className="text-slate-700 dark:text-slate-300">{item.code}</strong></span>}
                {item.sku && <span>SKU: <strong className="text-slate-700 dark:text-slate-300">{item.sku}</strong></span>}
                {item.category?.name && (
                  <span>دسته‌بندی: <strong className="text-slate-700 dark:text-slate-300">{item.category.name}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="text-left bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              قیمت فروش پیش‌فرض
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {Number(item.default_sale_price).toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal text-slate-500">تومان</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>مشخصات عمومی</span>
        </button>

        <button
          onClick={() => setActiveTab('prices')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'prices'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>لیست‌های قیمت ({item.prices?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('attributes')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'attributes'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ویژگی‌های فنی ({item.attributes?.length || 0})</span>
        </button>

        {item.item_type === 'product' && (
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span>وضعیت انبار</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سوابق خرید و فروش</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              اطلاعات اصلی و شناسه
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">نام کالا / خدمت:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {item.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">نوع آیتم:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {item.item_type === 'product' ? 'کالای فیزیکی' : 'خدمت'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">کد داخلی:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {item.code || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">SKU:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block font-mono">
                  {item.sku || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">بارکد:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block font-mono">
                  {item.barcode || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">دسته‌بندی:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {item.category?.name || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">واحد اندازه‌گیری:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {item.unit?.name || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">برند / مدل:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {[item.brand, item.model].filter(Boolean).join(' - ') || '-'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              قیمت‌گذاری و ماليات
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">قیمت خرید:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  {Number(item.purchase_price).toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">قیمت فروش پیش‌فرض:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {Number(item.default_sale_price).toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">نرخ مالیات:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  %{item.tax_rate}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block">تخفیف پیش‌فرض:</span>
                <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                  %{item.default_discount_percent}
                </span>
              </div>
            </div>

            {item.description && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-xs mb-1">توضیحات تکمیلی:</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  {item.description}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 2. PRICES */}
      {activeTab === 'prices' && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            قیمت کالا در لیست‌های مختلف قیمت
          </h3>

          {!item.prices || item.prices.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">قیمت جداگانه‌ای برای لیست‌های متفرقه تعریف نشده است.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">عنوان لیست قیمت</th>
                    <th className="py-2.5 px-3">حداقل تعداد خرید</th>
                    <th className="py-2.5 px-3">قیمت واحد (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {item.prices.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {p.price_list_name || 'لیست قیمت'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {p.min_quantity} {item.unit?.name || 'عدد'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(p.price).toLocaleString('fa-IR')} تومان
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 3. ATTRIBUTES */}
      {activeTab === 'attributes' && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            ویژگی‌ها و مشخصات فنی کالا
          </h3>

          {!item.attributes || item.attributes.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">هیچ ویژگی فنی برای این کالا ثبت نشده است.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {item.attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs"
                >
                  <span className="text-slate-500 font-semibold">{attr.attribute_name}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{attr.attribute_value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 4. INVENTORY */}
      {activeTab === 'inventory' && item.item_type === 'product' && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            وضعیت انبار و کنترل موجودی
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200">
              <span className="block text-slate-500 dark:text-slate-400 mb-1">کنترل موجودی:</span>
              <span className="font-bold text-sm">
                {item.track_inventory ? 'فعال (کنترل می‌شود)' : 'غیرفعال'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="block text-slate-500 mb-1">حداقل موجودی (نقطه سفارش):</span>
              <span className="font-bold text-sm text-amber-600">
                {item.min_stock} {item.unit?.name || 'عدد'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="block text-slate-500 mb-1">حداکثر موجودی:</span>
              <span className="font-bold text-sm">
                {item.max_stock ? `${item.max_stock} ${item.unit?.name || 'عدد'}` : 'بدون سقف'}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 5. HISTORY */}
      {activeTab === 'history' && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            سوابق تراکنش‌ها و گردش کالا
          </h3>

          <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            با ایجاد فاکتورهای فروش و خرید در فازهای بعدی، گردش و سوابق دقیق قیمت و موجودی این کالا در اینجا نمایش داده می‌شود.
          </div>
        </Card>
      )}

      {/* Deactivate Dialog */}
      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={handleToggleActive}
        title={item.is_active ? 'غیرفعال‌سازی کالا' : 'فعال‌سازی کالا'}
        message={
          item.is_active
            ? 'آیا از غیرفعال‌سازی این کالا اطمینان دارید؟ در فاکتورهای جدید انتخاب نخواهد شد.'
            : 'آیا می‌خواهید این کالا را مجدداً فعال کنید؟'
        }
        confirmText={item.is_active ? 'بله، غیرفعال شود' : 'بله، فعال شود'}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="حذف کالا"
        message="آیا از حذف کامل این کالا از سیستم اطمینان دارید؟ این عمل غیرقابل بازگشت است."
        confirmText="حذف کامل"
        variant="danger"
      />
    </div>
  );
}
