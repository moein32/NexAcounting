import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { Search, QrCode, Package, Plus, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { itemService } from '../../services/itemService';
import { Item } from '../../types/catalog';
import { formatCurrency } from '../../lib/utils';
import { QuantityStepper } from './QuantityStepper';

interface ProductPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Item, quantity: number, unitPrice: number) => void;
  selectedProductIds?: string[];
}

export const ProductPickerSheet: React.FC<ProductPickerSheetProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  selectedProductIds = [],
}) => {
  const { currentBusiness } = useAuthStore();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedItemQuantities, setSelectedItemQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen && currentBusiness) {
      loadProducts();
    }
  }, [isOpen, currentBusiness]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await itemService.getItems(currentBusiness!.id, {
        item_type: 'product',
      });
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to load products for picker:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(
    new Set(items.map((i) => i.category?.name).filter(Boolean))
  );

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category?.name !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = (item.code || '').toLowerCase().includes(q);
      const matchBarcode = (item.barcode || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBarcode) return false;
    }
    return true;
  });

  const handleAddProduct = (item: Item) => {
    const qty = selectedItemQuantities[item.id] || 1;
    onSelectProduct(item, qty, item.default_sale_price || 0);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="انتخاب و افزودن کالا"
      subtitle="کالاهای مورد نظر را برای فاکتور انتخاب کنید"
      maxHeight="max-h-[90vh]"
    >
      <div className="space-y-3">
        {/* Search and Barcode Scanner Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="جستجوی کالا، کد یا بارکد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={() => alert('اسکنر بارکد فعال شد')}
            className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 text-xs font-bold hover:bg-indigo-500/20 active:scale-95 transition-all touch-manipulation cursor-pointer"
            title="اسکن بارکد"
          >
            <QrCode className="w-5 h-5" />
            <span className="hidden sm:inline">بارکدخوان</span>
          </button>
        </div>

        {/* Category Chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              همه کالاها
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat!)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products Mobile List */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              در حال دریافت لیست کالاها...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              هیچ کالایی مطابق با جستجو پیدا نشد.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isAdded = selectedProductIds.includes(item.id);
              const qty = selectedItemQuantities[item.id] || 1;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                          {item.name}
                        </h4>
                        {item.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500">
                            #{item.code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-[11px]">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(item.default_sale_price || 0)} تومان
                        </span>
                        <span className="text-slate-400">
                          واحد: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.unit?.name || 'عدد'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
                    <QuantityStepper
                      size="sm"
                      value={qty}
                      onChange={(newQty) =>
                        setSelectedItemQuantities((prev) => ({ ...prev, [item.id]: newQty }))
                      }
                      unit={item.unit?.name || 'عدد'}
                    />

                    <button
                      type="button"
                      onClick={() => handleAddProduct(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 touch-manipulation cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>افزودن مجدد</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>افزودن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
