import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowRight, Package, Wrench, Plus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { itemService } from '../../../services/itemService';
import { categoryService } from '../../../services/categoryService';
import { unitService } from '../../../services/unitService';
import { priceListService } from '../../../services/priceListService';
import { Item, ItemCategory, Unit, PriceList, ItemDuplicateCheckResult } from '../../../types/catalog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { LoadingState } from '../../../components/ui/LoadingState';
import { showToast } from '../../../components/ui/Toast';
import { ItemDuplicateWarningModal } from '../components/ItemDuplicateWarningModal';

export function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentBusiness = useAuthStore((state) => state.currentBusiness);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');

  const [purchasePrice, setPurchasePrice] = useState<number | ''>(0);
  const [defaultSalePrice, setDefaultSalePrice] = useState<number | ''>(0);
  const [taxRate, setTaxRate] = useState<number | ''>(10);
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState<number | ''>(0);

  const [trackInventory, setTrackInventory] = useState(true);
  const [minStock, setMinStock] = useState<number | ''>(0);
  const [maxStock, setMaxStock] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  // Prices and Attributes
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [pricesList, setPricesList] = useState<
    { price_list_id: string; price: number; min_quantity: number }[]
  >([]);
  const [attributes, setAttributes] = useState<
    { attribute_name: string; attribute_value: string }[]
  >([]);

  // Categories & Units
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Duplicate Check
  const [duplicateResult, setDuplicateResult] = useState<ItemDuplicateCheckResult | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!currentBusiness || !id) return;
      setIsLoading(true);
      try {
        const [cats, uns, plists, item] = await Promise.all([
          categoryService.getCategories(currentBusiness.id),
          unitService.getUnits(currentBusiness.id),
          priceListService.getPriceLists(currentBusiness.id),
          itemService.getItemById(currentBusiness.id, id),
        ]);

        setCategories(cats || []);
        setUnits(uns);
        setPriceLists(plists);

        if (!item) {
          showToast.error('کالای مورد نظر یافت نشد.');
          navigate('/items');
          return;
        }

        setItemType(item.item_type);
        setName(item.name);
        setCode(item.code || '');
        setSku(item.sku || '');
        setBarcode(item.barcode || '');
        setCategoryId(item.category_id || '');
        setUnitId(item.unit_id || '');
        setBrand(item.brand || '');
        setModel(item.model || '');
        setShortDescription(item.short_description || '');
        setDescription(item.description || '');

        setPurchasePrice(item.purchase_price);
        setDefaultSalePrice(item.default_sale_price);
        setTaxRate(item.tax_rate);
        setDefaultDiscountPercent(item.default_discount_percent);

        setTrackInventory(item.item_type === 'service' ? false : item.track_inventory);
        setMinStock(item.min_stock || 0);
        setMaxStock(item.max_stock ?? '');
        setIsActive(item.is_active);

        // Map existing item prices
        const mappedPrices = (plists || []).map((pl) => {
          const match = item.prices?.find((p) => p.price_list_id === pl.id);
          return {
            price_list_id: pl.id,
            price: match ? match.price : 0,
            min_quantity: match ? match.min_quantity : 1,
          };
        });
        setPricesList(mappedPrices);

        // Map existing item attributes
        if (item.attributes && (item.attributes || []).length > 0) {
          setAttributes(
            (item.attributes || []).map((a) => ({
              attribute_name: a.attribute_name,
              attribute_value: a.attribute_value,
            }))
          );
        }
      } catch (err: any) {
        showToast.error('خطا در بارگذاری اطلاعات کالا', err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentBusiness, id, navigate]);

  const handlePriceChange = (priceListId: string, value: number) => {
    setPricesList((prev) =>
      prev.map((p) => (p.price_list_id === priceListId ? { ...p, price: value } : p))
    );
  };

  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { attribute_name: '', attribute_value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, key: 'attribute_name' | 'attribute_value', val: string) => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [key]: val } : a))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness || !id) return;

    if (!name.trim()) {
      showToast.error('نام کالا یا خدمت الزامی است.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check duplicates excluding current item ID
      const dupCheck = await itemService.checkDuplicates(
        currentBusiness.id,
        { sku, barcode, code },
        id
      );

      if (
        dupCheck.hasDuplicateSku ||
        dupCheck.hasDuplicateBarcode ||
        dupCheck.hasDuplicateCode
      ) {
        setDuplicateResult(dupCheck);
        setIsSubmitting(false);
        return;
      }

      const activePrices = pricesList.filter((p) => p.price > 0);
      const validAttributes = attributes.filter(
        (a) => a.attribute_name.trim() && a.attribute_value.trim()
      );

      await itemService.updateItem(
        currentBusiness.id,
        id,
        {
          item_type: itemType,
          name: name.trim(),
          code: code.trim() || null,
          sku: sku.trim() || null,
          barcode: barcode.trim() || null,
          category_id: categoryId || null,
          unit_id: unitId || null,
          brand: brand.trim() || null,
          model: model.trim() || null,
          short_description: shortDescription.trim() || null,
          description: description.trim() || null,
          purchase_price: Number(purchasePrice) || 0,
          default_sale_price: Number(defaultSalePrice) || 0,
          tax_rate: Number(taxRate) || 0,
          default_discount_percent: Number(defaultDiscountPercent) || 0,
          min_stock: itemType === 'product' ? Number(minStock) || 0 : 0,
          max_stock: itemType === 'product' && maxStock !== '' ? Number(maxStock) : null,
          track_inventory: itemType === 'service' ? false : trackInventory,
          is_active: isActive,
          prices: activePrices,
          attributes: validAttributes,
        },
        currentUserId
      );

      showToast.success('اطلاعات کالا / خدمت با موفقیت به روز رسانی شد.');
      navigate(`/items/${id}`);
    } catch (err: any) {
      showToast.error('خطا در ویرایش کالا', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="در حال دریافت اطلاعات کالا..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={`ویرایش: ${name}`}
        description="تغییر اطلاعات شناسه، قیمت‌گذاری، مشخصات و انبار داری"
        icon={<Save className="w-6 h-6 text-amber-600" />}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/items/${id}`)}
            className="gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به جزئیات</span>
          </Button>
        }
      />

      <Card className="p-6 space-y-6">
        {/* Main Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            اطلاعات پایه و شناسه‌ها
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                نام کالا / خدمت <span className="text-rose-500">*</span>
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                کد کالا (Code)
              </label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شناسه SKU
              </label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                بارکد
              </label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                دسته‌بندی
              </label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                options={[
                  { value: '', label: '-- بدون دسته‌بندی --' },
                  ...(categories || []).map((c) => ({
                    value: c.id,
                    label: c.parent_name ? `${c.parent_name} > ${c.name}` : c.name,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                واحد اندازه‌گیری
              </label>
              <Select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                options={[
                  { value: '', label: '-- انتخاب واحد --' },
                  ...(units || []).map((u) => ({
                    value: u.id,
                    label: `${u.name}${u.symbol ? ` (${u.symbol})` : ''}`,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                برند
              </label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مدل
              </label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            قیمت‌گذاری
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                قیمت خرید (تومان)
              </label>
              <Input
                type="number"
                value={purchasePrice}
                onChange={(e) =>
                  setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                قیمت فروش پیش‌فرض (تومان)
              </label>
              <Input
                type="number"
                value={defaultSalePrice}
                onChange={(e) =>
                  setDefaultSalePrice(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                مالیات (%)
              </label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) =>
                  setTaxRate(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تخفیف پیش‌فرض (%)
              </label>
              <Input
                type="number"
                value={defaultDiscountPercent}
                onChange={(e) =>
                  setDefaultDiscountPercent(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>

          {/* Price Lists */}
          {(priceLists || []).length > 0 && (
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                قیمت در سایر لیست‌های قیمت:
              </label>
              {(priceLists || []).map((pl) => {
                const entry = pricesList.find((p) => p.price_list_id === pl.id);
                return (
                  <div
                    key={pl.id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {pl.name}
                    </span>
                    <div className="w-44">
                      <Input
                        type="number"
                        placeholder="0"
                        value={entry?.price || ''}
                        onChange={(e) => handlePriceChange(pl.id, Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Technical Attributes */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              ویژگی‌های فنی و مشخصات (Key - Value)
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAttribute}
              className="gap-1 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن ویژگی</span>
            </Button>
          </div>

          {(attributes || []).length === 0 ? (
            <p className="text-xs text-slate-400">هیچ ویژگی فنی ثبت نشده است.</p>
          ) : (
            <div className="space-y-2">
              {(attributes || []).map((attr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="عنوان ویژگی (مثلاً: رنگ)"
                    value={attr.attribute_name}
                    onChange={(e) =>
                      handleAttributeChange(idx, 'attribute_name', e.target.value)
                    }
                  />
                  <Input
                    placeholder="مقدار (مثلاً: سفید)"
                    value={attr.attribute_value}
                    onChange={(e) =>
                      handleAttributeChange(idx, 'attribute_value', e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => handleRemoveAttribute(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Settings (Product Only) */}
        {itemType === 'product' && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              تنظیمات انبار
            </h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="trackInventory"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <label
                htmlFor="trackInventory"
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                ردیابی و کنترل موجودی انبار فعال باشد
              </label>
            </div>

            {trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل موجودی (نقطه سفارش)
                  </label>
                  <Input
                    type="number"
                    value={minStock}
                    onChange={(e) =>
                      setMinStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حداکثر موجودی
                  </label>
                  <Input
                    type="number"
                    value={maxStock}
                    onChange={(e) =>
                      setMaxStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active status */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white">
            وضعیت کالا:
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="radio"
                name="status"
                checked={isActive}
                onChange={() => setIsActive(true)}
                className="accent-emerald-600"
              />
              <span className="text-emerald-700 font-semibold">فعال</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="radio"
                name="status"
                checked={!isActive}
                onChange={() => setIsActive(false)}
                className="accent-rose-600"
              />
              <span className="text-rose-700 font-semibold">غیرفعال</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/items/${id}`)}
          >
            انصراف
          </Button>

          <Button type="submit" variant="primary" isLoading={isSubmitting} className="gap-1.5">
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات</span>
          </Button>
        </div>
      </Card>

      {/* Duplicate Warning Modal */}
      {duplicateResult && (
        <ItemDuplicateWarningModal
          isOpen={!!duplicateResult}
          onClose={() => setDuplicateResult(null)}
          duplicateInfo={duplicateResult}
        />
      )}
    </form>
  );
}
