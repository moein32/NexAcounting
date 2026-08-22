import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Wrench,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Tag,
  DollarSign,
  Percent,
  Warehouse,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { itemService } from '../../../services/itemService';
import { categoryService } from '../../../services/categoryService';
import { unitService } from '../../../services/unitService';
import { priceListService } from '../../../services/priceListService';
import { ItemType, ItemCategory, Unit, PriceList, ItemDuplicateCheckResult } from '../../../types/catalog';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { showToast } from '../../../components/ui/Toast';
import { ItemDuplicateWarningModal } from '../components/ItemDuplicateWarningModal';

export function CreateItemPage() {
  const navigate = useNavigate();
  const currentBusiness = useAuthStore((state) => state.currentBusiness);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [itemType, setItemType] = useState<ItemType>('product');
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

  // Pricing
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(0);
  const [defaultSalePrice, setDefaultSalePrice] = useState<number | ''>(0);
  const [pricesList, setPricesList] = useState<
    { price_list_id: string; price: number; min_quantity: number }[]
  >([]);

  // Tax & Discount
  const [taxRate, setTaxRate] = useState<number | ''>(10);
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState<number | ''>(0);

  // Inventory Settings (Product only)
  const [trackInventory, setTrackInventory] = useState(true);
  const [minStock, setMinStock] = useState<number | ''>(0);
  const [maxStock, setMaxStock] = useState<number | ''>('');

  // Dynamic Options
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);

  // Duplicate Check Modal state
  const [duplicateResult, setDuplicateResult] = useState<ItemDuplicateCheckResult | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;
    categoryService.getCategories(currentBusiness.id).then(res => setCategories(res || []));
    unitService.getUnits(currentBusiness.id).then(res => setUnits(res || []));
    priceListService.getPriceLists(currentBusiness.id).then((lists) => {
      setPriceLists(lists || []);
      // Pre-fill price list entries for default lists
      const initialPrices = (lists || []).map((pl) => ({
        price_list_id: pl.id,
        price: 0,
        min_quantity: 1,
      }));
      setPricesList(initialPrices);
    });
  }, [currentBusiness]);

  const handlePriceChange = (priceListId: string, value: number) => {
    setPricesList((prev) =>
      prev.map((p) => (p.price_list_id === priceListId ? { ...p, price: value } : p))
    );
  };

  const totalSteps = itemType === 'product' ? 5 : 4;

  const validateStep = async (targetStep: number): Promise<boolean> => {
    if (targetStep > 2 && !name.trim()) {
      showToast.error('نام کالا یا خدمت الزامی است.');
      return false;
    }

    if (targetStep > 2) {
      // Check duplicates before proceeding past step 2
      if (currentBusiness && (sku || barcode || code)) {
        const dupCheck = await itemService.checkDuplicates(currentBusiness.id, {
          sku,
          barcode,
          code,
        });

        if (
          dupCheck.hasDuplicateSku ||
          dupCheck.hasDuplicateBarcode ||
          dupCheck.hasDuplicateCode
        ) {
          setDuplicateResult(dupCheck);
          return false;
        }
      }
    }

    return true;
  };

  const handleNextStep = async () => {
    const isValid = await validateStep(step + 1);
    if (!isValid) return;

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!currentBusiness) return;
    if (!name.trim()) {
      showToast.error('لطفاً نام کالا را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check duplicates one last time
      const dupCheck = await itemService.checkDuplicates(currentBusiness.id, {
        sku,
        barcode,
        code,
      });

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

      await itemService.createItem(
        currentBusiness.id,
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
          prices: activePrices,
        },
        currentUserId
      );

      showToast.success('کالا / خدمت جدید با موفقیت ثبت گردید.');
      navigate('/items');
    } catch (err: any) {
      showToast.error('خطا در ثبت کالا', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="تعریف کالا / خدمت جدید"
        description="مراحل ثبت اطلاعات پایه، قیمت‌گذاری و تنظیمات انبار داری"
        icon={<Plus className="w-6 h-6 text-blue-600" />}
      />

      {/* Stepper Header */}
      <div className="grid grid-cols-4 md:grid-cols-5 gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div
          className={`p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 ${
            step === 1
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : step > 1
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
          }`}
        >
          <span>۱. نوع</span>
        </div>

        <div
          className={`p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 ${
            step === 2
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : step > 2
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
          }`}
        >
          <span>۲. اطلاعات اصلی</span>
        </div>

        <div
          className={`p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 ${
            step === 3
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : step > 3
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
          }`}
        >
          <span>۳. قیمت‌گذاری</span>
        </div>

        <div
          className={`p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 ${
            step === 4
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : step > 4
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
          }`}
        >
          <span>۴. مالیات و تخفیف</span>
        </div>

        {itemType === 'product' && (
          <div
            className={`p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 hidden md:flex ${
              step === 5
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
            }`}
          >
            <span>۵. انبارداری</span>
          </div>
        )}
      </div>

      {/* Step Content */}
      <Card className="p-6">
        {/* STEP 1: ITEM TYPE */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              مرحله اول: انتخاب نوع آیتم
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              لطفاً مشخص کنید که قصد ثبت یک کالای ملموس و قابل انبارداری دارید یا یک خدمت.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div
                onClick={() => setItemType('product')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 ${
                  itemType === 'product'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-xl">
                    <Package className="w-6 h-6" />
                  </div>
                  {itemType === 'product' && (
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    کالای فیزیکی (Product)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    دارای فیچر کنترل موجودی، نقطه سفارش، ورود/خروج انبار و گزارش‌های موجودی است.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setItemType('service')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 ${
                  itemType === 'service'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 dark:border-purple-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 rounded-xl">
                    <Wrench className="w-6 h-6" />
                  </div>
                  {itemType === 'service' && (
                    <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    خدمت / سرویس (Service)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    موجودی انبار ندارد و هیچ تراکنش انباری ایجاد نمی‌کند. فقط در فاکتورهای فروش و خرید استفاده می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MAIN INFO */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              مرحله دوم: اطلاعات شناسه و مشخصات اصلی
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام کالا / خدمت <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="مثال: پنجره دوجداره UPVC کشویی مدل ۶۰"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  کد داخلی (Code)
                </label>
                <Input
                  placeholder="مثال: PRD-1001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شناسه کالا (SKU)
                </label>
                <Input
                  placeholder="مثال: UPVC-WIN-1001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  بارکد (Barcode)
                </label>
                <Input
                  placeholder="مثال: 626001234001"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
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
                  برند (Brand)
                </label>
                <Input
                  placeholder="مثال: وین‌تک"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مدل (Model)
                </label>
                <Input
                  placeholder="مثال: Slide-60"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات کوتاه
                </label>
                <Input
                  placeholder="خلاصه کوتاه جهت نمایش در فاکتورها..."
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات تکمیلی و فنی
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="مشخصات کامل کالا، متریال، ابعاد، استانداردهای ساخت و..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRICING */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              مرحله سوم: قیمت‌گذاری و لیست قیمت‌ها
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  قیمت خرید (تومان)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={purchasePrice}
                  onChange={(e) =>
                    setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  قیمت فروش پیش‌فرض (تومان) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={defaultSalePrice}
                  onChange={(e) =>
                    setDefaultSalePrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Price Lists Table */}
            {(priceLists || []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  تعیین قیمت در سایر لیست‌های قیمت:
                </h4>

                <div className="space-y-2">
                  {(priceLists || []).map((pl) => {
                    const priceEntry = pricesList.find((p) => p.price_list_id === pl.id);
                    return (
                      <div
                        key={pl.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60"
                      >
                        <div>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {pl.name}
                          </span>
                          {pl.is_default && (
                            <span className="mr-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              پیش‌فرض
                            </span>
                          )}
                          {pl.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {pl.description}
                            </p>
                          )}
                        </div>

                        <div className="w-full sm:w-48">
                          <Input
                            type="number"
                            placeholder="قیمت (تومان)"
                            value={priceEntry?.price || ''}
                            onChange={(e) =>
                              handlePriceChange(pl.id, Number(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: TAX & DISCOUNT */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              مرحله چهارم: درصد مالیات و تخفیف پیش‌فرض
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نرخ مالیات بر ارزش افزوده (%)
                </label>
                <Input
                  type="number"
                  placeholder="10"
                  value={taxRate}
                  onChange={(e) =>
                    setTaxRate(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  نرخ ارزش افزوده قانونی سیستم (پیش‌فرض ۱۰٪ در سال ۱۴۰۳)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تخفیف پیش‌فرض (%)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={defaultDiscountPercent}
                  onChange={(e) =>
                    setDefaultDiscountPercent(
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  درصد تخفیفی که به صورت پیش‌فرض در فاکتورهای فروش اعمال می‌گردد.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: INVENTORY SETTINGS (PRODUCT ONLY) */}
        {step === 5 && itemType === 'product' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              مرحله پنجم: تنظیمات انبارداری و حداقل/حداکثر موجودی
            </h3>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  ردیابی موجودی انبار (Track Inventory)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تراکنش‌های ورود و خروج انبار برای این کالا ثبت خواهد شد.
                </p>
              </div>
              <input
                type="checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل موجودی (نقطه سفارش)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minStock}
                    onChange={(e) =>
                      setMinStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    در صورت کاهش موجودی از این مقدار، سیستم هشدار خواهد داد.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حداکثر موجودی مجاز
                  </label>
                  <Input
                    type="number"
                    placeholder="اختیاری"
                    value={maxStock}
                    onChange={(e) =>
                      setMaxStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    سقف مجاز نگهداری کالا در انبار
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stepper Navigation Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="gap-1.5"
          >
            <ArrowRight className="w-4 h-4" />
            <span>مرحله قبلی</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={handleNextStep}
            className="gap-1.5"
          >
            <span>{step === totalSteps ? 'ثبت نهایی کالا / خدمت' : 'مرحله بعدی'}</span>
            {step < totalSteps && <ArrowLeft className="w-4 h-4" />}
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
    </div>
  );
}
