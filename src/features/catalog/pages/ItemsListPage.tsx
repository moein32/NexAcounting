import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Package,
  Wrench,
  Search,
  Filter,
  Eye,
  Edit,
  Power,
  FolderTree,
  Ruler,
  Tags,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { itemService } from '../../../services/itemService';
import { categoryService } from '../../../services/categoryService';
import { Item, ItemType, ItemCategory } from '../../../types/catalog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { Dropdown } from '../../../components/ui/Dropdown';
import { showToast } from '../../../components/ui/Toast';
import { ItemTypeBadge, ItemStatusBadge } from '../components/ItemTypeBadge';
import { formatCurrency } from '../../../lib/utils';

interface ItemsListPageProps {
  forcedType?: ItemType;
  titleOverride?: string;
  subtitleOverride?: string;
}

export function ItemsListPage({
  forcedType,
  titleOverride,
  subtitleOverride,
}: ItemsListPageProps) {
  const navigate = useNavigate();
  const currentBusiness = useAuthStore((state) => state.currentBusiness);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState<ItemType | 'all'>(forcedType || 'all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const fetchCategories = useCallback(async () => {
    if (!currentBusiness) return;
    try {
      const cats = await categoryService.getCategories(currentBusiness.id);
      setCategories(cats || []);
    } catch {
      console.error('Error loading categories');
    }
  }, [currentBusiness]);

  const fetchItems = useCallback(async () => {
    if (!currentBusiness) return;
    setIsLoading(true);
    try {
      const result = await itemService.getItems(currentBusiness.id, {
        search,
        item_type: forcedType || itemType,
        category_id: categoryId,
        status,
        page,
        pageSize,
      });
      setItems(result.data || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      showToast.error('خطا در دریافت لیست کالاها و خدمات', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness, search, itemType, forcedType, categoryId, status, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDeactivate = async (id: string) => {
    if (!currentBusiness) return;
    try {
      await itemService.deactivateItem(currentBusiness.id, id, currentUserId);
      showToast.success('کالا/خدمت با موفقیت غیرفعال شد.');
      fetchItems();
    } catch (err: any) {
      showToast.error('خطا در تغییر وضعیت کالا', err.message);
    }
  };

  const pageTitle =
    titleOverride ||
    (forcedType === 'product'
      ? 'مدیریت کالاهای فیزیکی'
      : forcedType === 'service'
      ? 'مدیریت خدمات'
      : 'کاتالوگ کالا و خدمات');

  const pageSubtitle =
    subtitleOverride ||
    (forcedType === 'product'
      ? 'فهرست کامل کالاهای فیزیکی قابل انبارداری و قیمت‌گذاری'
      : forcedType === 'service'
      ? 'فهرست خدمات و سرویس‌های قابل ارائه با قیمت‌گذاری چندگانه'
      : 'مدیریت متمرکز کالاها، خدمات، دسته‌بندی‌ها و لیست‌های قیمت');

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      <PageHeader
        title={pageTitle}
        description={pageSubtitle}
        icon={<Package className="w-6 h-6 text-blue-600" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!forcedType && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/items/categories')}
                  className="gap-1.5"
                >
                  <FolderTree className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">دسته‌بندی‌ها</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/items/units')}
                  className="gap-1.5"
                >
                  <Ruler className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">واحدها</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/items/price-lists')}
                  className="gap-1.5"
                >
                  <Tags className="w-4 h-4 text-purple-600" />
                  <span className="hidden sm:inline">لیست‌های قیمت</span>
                </Button>
              </>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/items/new')}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف آیتم جدید</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="جستجو بر اساس نام، کد، SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs font-bold"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {!forcedType && (
            <Select
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value as any);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'همه انواع (کالا + خدمت)' },
                { value: 'product', label: 'کالای فیزیکی' },
                { value: 'service', label: 'خدمت / سرویس' },
              ]}
            />
          )}

          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه دسته‌بندی‌ها' },
              ...categories.map((cat) => ({
                value: cat.id,
                label: cat.parent_name
                  ? `${cat.parent_name} > ${cat.name}`
                  : cat.name
              }))
            ]}
          />

          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'همه وضعیت‌ها' },
              { value: 'active', label: 'فعال' },
              { value: 'inactive', label: 'غیرفعال' },
            ]}
          />
        </div>
      </Card>

      {/* Main Table / Grid */}
      {isLoading ? (
        <LoadingState text="در حال دریافت فهرست کالاها و خدمات..." />
      ) : (items || []).length === 0 ? (
        <Card className="p-8 rounded-3xl">
          <EmptyState
            title="هیچ کالا یا خدمتی یافت نشد"
            description="موردی با مشخصات یا فیلترهای جستجوی شما پیدا نشد."
            actionLabel="ایجاد کالا / خدمت جدید"
            onAction={() => navigate('/items/new')}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* MOBILE CARDS LIST */}
          <div className="block md:hidden space-y-3">
            {(items || []).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/items/${item.id}`)}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-xs hover:border-indigo-500/50 active:scale-98 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                        {item.item_type === 'product' ? (
                          <Package className="w-6 h-6" />
                        ) : (
                          <Wrench className="w-6 h-6" />
                        )}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        کد: <span className="font-mono font-bold">{item.code || '---'}</span> • واحد: {item.unit?.name || '---'}
                      </p>
                    </div>
                  </div>

                  <ItemStatusBadge isActive={item.is_active} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400">
                    {item.category?.name || 'بدون دسته‌بندی'}
                  </span>

                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">قیمت فروش:</span>
                    <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(Number(item.default_sale_price))} تومان
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">کالا / خدمت</th>
                  <th className="py-3.5 px-4">نوع</th>
                  <th className="py-3.5 px-4">کد / SKU</th>
                  <th className="py-3.5 px-4">دسته‌بندی</th>
                  <th className="py-3.5 px-4">واحد</th>
                  <th className="py-3.5 px-4">قیمت فروش پیش‌فرض</th>
                  <th className="py-3.5 px-4">مالیات</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(items || []).map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            {item.item_type === 'product' ? (
                              <Package className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Wrench className="w-5 h-5 text-purple-500" />
                            )}
                          </div>
                        )}
                        <div>
                          <div
                            onClick={() => navigate(`/items/${item.id}`)}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          >
                            {item.name}
                          </div>
                          {(item.brand || item.model) && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {[item.brand, item.model].filter(Boolean).join(' - ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <ItemTypeBadge type={item.item_type} />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div>{item.code || '-'}</div>
                      {item.sku && (
                        <div className="text-slate-400 text-[10px]">SKU: {item.sku}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {item.category?.name || '-'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {item.unit?.name || '-'}
                    </td>

                    <td className="py-3.5 px-4 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(Number(item.default_sale_price))} تومان
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      %{item.tax_rate}
                    </td>

                    <td className="py-3.5 px-4">
                      <ItemStatusBadge isActive={item.is_active} />
                    </td>

                    <td className="py-3.5 px-4 text-left">
                      <Dropdown
                        items={[
                          {
                            label: 'مشاهده جزئیات کامل',
                            icon: <Eye className="w-4 h-4 text-blue-600" />,
                            onClick: () => navigate(`/items/${item.id}`),
                          },
                          {
                            label: 'ویرایش اطلاعات',
                            icon: <Edit className="w-4 h-4 text-amber-600" />,
                            onClick: () => navigate(`/items/${item.id}/edit`),
                          },
                          {
                            label: item.is_active ? 'غیرفعال کردن' : 'فعال‌سازی',
                            icon: <Power className="w-4 h-4 text-slate-500" />,
                            onClick: () => handleDeactivate(item.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
              <div>
                نمایش {(page - 1) * pageSize + 1} تا {Math.min(page * pageSize, totalCount)} از {totalCount} آیتم
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  قبلی
                </Button>
                <span className="font-semibold">{page}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * pageSize >= totalCount}
                  onClick={() => setPage(page + 1)}
                >
                  بعدی
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
