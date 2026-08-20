import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { documentService } from '../../../services/documentService';
import { partyService } from '../../../services/partyService';
import { inventoryService } from '../../../services/inventoryService';
import { itemService } from '../../../services/itemService';
import { SettingsRepository } from '../../../repositories';
import { Party } from '../../../types/party';
import { Warehouse } from '../../../types/inventory';
import { Item } from '../../../types/catalog';
import { DocumentType } from '../../../types/document';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import {
  ArrowRight,
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  Percent,
  Warehouse as WarehouseIcon,
  User,
  Package,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Truck,
  FileText,
} from 'lucide-react';
import {
  CustomerPickerSheet,
  ProductPickerSheet,
  QuantityStepper,
  PersianDatePickerSheet,
} from '../../../design/components';

interface FormLine {
  item_id: string;
  item_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  line_subtotal: number;
  line_total: number;
}

export function SalesCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentBusiness, user } = useAuthStore();

  const defaultType = (searchParams.get('type') || 'sales_invoice') as DocumentType;
  const editId = searchParams.get('edit');

  // Form State
  const [docType, setDocType] = useState<DocumentType>(defaultType);
  const [partyId, setPartyId] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [warehouseId, setWarehouseId] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [shippingTotal, setShippingTotal] = useState(0);

  // Dynamic lines state
  const [lines, setLines] = useState<FormLine[]>([]);

  // Master Data
  const [customers, setCustomers] = useState<Party[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Mobile Bottom Sheets State
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [showDatePickerSheet, setShowDatePickerSheet] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (currentBusiness) {
      loadMasterData();
    }
  }, [currentBusiness]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const bizId = currentBusiness!.id;

      const partiesResult = await partyService.getParties(bizId);
      const allParties = partiesResult.data || [];
      const filteredCustomers = allParties.filter((p) => p.roles.includes('customer'));
      setCustomers(filteredCustomers);

      const whs = await inventoryService.getWarehouses(bizId);
      setWarehouses(whs || []);
      if (whs && whs.length > 0) {
        setWarehouseId(whs[0].id);
      }

      const catalogItemsResult = await itemService.getItems(bizId);
      const catalogItems = catalogItemsResult.data || [];
      setItems(catalogItems);

      if (editId) {
        const docToEdit = await documentService.getDocumentById(bizId, editId);
        if (docToEdit.status === 'draft') {
          setDocType(docToEdit.document_type);
          setPartyId(docToEdit.party_id || '');
          if (docToEdit.party_id) {
            const foundP = filteredCustomers.find((c) => c.id === docToEdit.party_id);
            if (foundP) setSelectedParty(foundP);
          }
          setWarehouseId(docToEdit.warehouse_id || '');
          setDocumentDate(docToEdit.document_date.split('T')[0]);
          setDueDate(docToEdit.due_date ? docToEdit.due_date.split('T')[0] : '');
          setNotes(docToEdit.notes || '');
          setInternalNotes(docToEdit.internal_notes || '');
          setShippingTotal(docToEdit.shipping_total || 0);

          if (docToEdit.items && docToEdit.items.length > 0) {
            const mappedLines = docToEdit.items.map((it) => ({
              item_id: it.item_id,
              item_name: it.description || 'کالای سفارشی',
              description: it.description || '',
              quantity: it.quantity,
              unit_price: it.unit_price,
              discount_percent: it.discount_percent,
              tax_percent: it.tax_percent,
              line_subtotal: it.line_subtotal,
              line_total: it.line_total,
            }));
            setLines(mappedLines);
          }
        }
      }
    } catch (err) {
      console.error('Error loading sales form master data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomerFromSheet = (party: Party) => {
    setPartyId(party.id);
    setSelectedParty(party);
  };

  const handleAddProductFromSheet = (product: Item, quantity: number, unitPrice: number) => {
    const existingIdx = lines.findIndex((l) => l.item_id === product.id);
    const defaultTaxRate = Number(SettingsRepository.get('default_tax_rate') ?? 0);
    const itemTax = typeof product.tax_rate === 'number' ? Number(product.tax_rate) : defaultTaxRate;

    if (existingIdx >= 0) {
      const updated = [...lines];
      const line = { ...updated[existingIdx] };
      line.quantity += quantity;
      const math = documentService.calculateLineTotals(
        line.quantity,
        line.unit_price,
        line.discount_percent,
        line.tax_percent
      );
      line.line_subtotal = math.line_subtotal;
      line.line_total = math.line_total;
      updated[existingIdx] = line;
      setLines(updated);
    } else {
      const math = documentService.calculateLineTotals(quantity, unitPrice, 0, itemTax);
      setLines((prev) => [
        ...prev,
        {
          item_id: product.id,
          item_name: product.name,
          description: product.description || '',
          quantity,
          unit_price: unitPrice,
          discount_percent: 0,
          tax_percent: itemTax,
          line_subtotal: math.line_subtotal,
          line_total: math.line_total,
        },
      ]);
    }
  };

  const handleRemoveLine = (index: number) => {
    const updated = [...lines];
    updated.splice(index, 1);
    setLines(updated);
  };

  const handleLineQtyChange = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveLine(index);
      return;
    }
    const updated = [...lines];
    const line = { ...updated[index] };
    line.quantity = newQty;
    const math = documentService.calculateLineTotals(
      line.quantity,
      line.unit_price,
      line.discount_percent,
      line.tax_percent
    );
    line.line_subtotal = math.line_subtotal;
    line.line_total = math.line_total;
    updated[index] = line;
    setLines(updated);
  };

  const totals = documentService.calculateDocumentTotals(lines, shippingTotal);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentBusiness) return;

    if (!partyId) {
      alert('لطفا مشتری مورد نظر را انتخاب کنید.');
      return;
    }

    if (!warehouseId) {
      alert('لطفا انبار تحویل کالا را انتخاب کنید.');
      return;
    }

    if (lines.length === 0) {
      alert('لطفا حداقل یک کالا به فاکتور اضافه کنید.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        document_type: docType,
        party_id: partyId,
        warehouse_id: warehouseId,
        document_date: new Date(documentDate).toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        notes,
        internal_notes: internalNotes,
        shipping_total: shippingTotal,
        items: lines.map((line) => ({
          item_id: line.item_id,
          description: line.description || line.item_name,
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
          discount_percent: Number(line.discount_percent),
          tax_percent: Number(line.tax_percent),
          warehouse_id: warehouseId,
        })),
      };

      let doc;
      if (editId) {
        doc = await documentService.updateDocument(currentBusiness.id, editId, payload, user?.id);
      } else {
        doc = await documentService.createDocument(currentBusiness.id, payload, user?.id);
      }

      navigate(`/sales/${doc.id}`);
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سند پیش‌نویس');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500">در حال دریافت اطلاعات پایه مالی و اشخاص...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Page Title */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/sales')}>
            بازگشت
          </Button>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
              {editId ? 'ویرایش سند فروش' : 'صدور فاکتور فروش جدید'}
            </h1>
            <p className="text-[11px] text-slate-400">ثبت سریع و صدور هوشمند فاکتور همراه با بروزرسانی انبار</p>
          </div>
        </div>
      </div>

      {/* MOBILE STEPPER WIZARD HEADER (Mobile view) */}
      <div className="block md:hidden bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
          <button
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-2 rounded-xl text-center transition-all ${
              activeStep === 1
                ? 'bg-indigo-600 text-white shadow-xs'
                : partyId
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            ۱. خریدار
          </button>

          <ChevronLeft className="w-3 h-3 text-slate-300 shrink-0" />

          <button
            onClick={() => setActiveStep(2)}
            className={`flex-1 py-2 rounded-xl text-center transition-all ${
              activeStep === 2
                ? 'bg-indigo-600 text-white shadow-xs'
                : lines.length > 0
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            ۲. کالاها ({lines.length})
          </button>

          <ChevronLeft className="w-3 h-3 text-slate-300 shrink-0" />

          <button
            onClick={() => setActiveStep(3)}
            className={`flex-1 py-2 rounded-xl text-center transition-all ${
              activeStep === 3
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            ۳. ارسال/توضیحات
          </button>

          <ChevronLeft className="w-3 h-3 text-slate-300 shrink-0" />

          <button
            onClick={() => setActiveStep(4)}
            className={`flex-1 py-2 rounded-xl text-center transition-all ${
              activeStep === 4
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            ۴. بازبینی
          </button>
        </div>
      </div>

      {/* MOBILE STEP 1: CUSTOMER & WAREHOUSE */}
      <div className={`${activeStep === 1 ? 'block' : 'hidden'} md:block space-y-4`}>
        <Card className="p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-xs">
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>اطلاعات خریدار و شرایط سند</span>
          </h3>

          <div className="space-y-3">
            {/* Customer Picker Button / Selected Card */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                خریدار / طرف حساب:
              </label>
              {selectedParty ? (
                <div
                  onClick={() => setShowCustomerSheet(true)}
                  className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center">
                      {selectedParty.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {selectedParty.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dir-ltr text-right">
                        {selectedParty.mobile || 'بدون موبایل'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    تغییر خریدار
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomerSheet(true)}
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-500/10 active:scale-98 transition-all touch-manipulation cursor-pointer"
                >
                  <User className="w-5 h-5" />
                  <span>لمس کنید جهت انتخاب خریدار</span>
                </button>
              )}
            </div>

            {/* Warehouse & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Select
                label="انبار تحویل‌دهنده کالا"
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  تاریخ صدور فاکتور:
                </label>
                <button
                  type="button"
                  onClick={() => setShowDatePickerSheet(true)}
                  className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between"
                >
                  <span>{formatPersianDate(documentDate)}</span>
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </button>
              </div>

              <Select
                label="نوع سند"
                options={[
                  { value: 'sales_invoice', label: 'فاکتور فروش کالا/خدمات' },
                  { value: 'sales_quote', label: 'پیش‌فاکتور رسمی' },
                  { value: 'sales_order', label: 'سفارش فروش' },
                ]}
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* MOBILE STEP 2: PRODUCTS */}
      <div className={`${activeStep === 2 ? 'block' : 'hidden'} md:block space-y-4`}>
        <Card className="p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              <span>اقلام کالاها و خدمات فاکتور ({lines.length})</span>
            </h3>

            <button
              type="button"
              onClick={() => setShowProductSheet(true)}
              className="px-3 py-2 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 transition-all touch-manipulation cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کالا</span>
            </button>
          </div>

          {/* Lines Mobile Cards */}
          {lines.length === 0 ? (
            <div
              onClick={() => setShowProductSheet(true)}
              className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer"
            >
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                هنوز هیچ کالایی به این فاکتور اضافه نشده است.
              </p>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block mt-1">
                برای باز کردن لیست کالاها کلیک کنید
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {line.item_name || `کالا #${line.item_id}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        قیمت واحد: {formatCurrency(line.unit_price)} تومان
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      onChange={(newQty) => handleLineQtyChange(idx, newQty)}
                    />

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">جمع ردیف:</span>
                      <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(line.line_total)} تومان
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* MOBILE STEP 3: SHIPPING & NOTES */}
      <div className={`${activeStep === 3 ? 'block' : 'hidden'} md:block space-y-4`}>
        <Card className="p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>هزینه‌های جانبی و توضیحات</span>
          </h3>

          <Input
            type="number"
            min="0"
            label="هزینه حمل و نقل / باربری (تومان)"
            value={shippingTotal}
            onChange={(e) => setShippingTotal(Number(e.target.value))}
          />

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              توضیحات و شرایط روی فاکتور:
            </label>
            <textarea
              className="w-full h-20 p-3 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              placeholder="توضیحات تحویل، شماره حساب جهت واریز و..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              یادداشت‌های خصوصی (عدم چاپ):
            </label>
            <textarea
              className="w-full h-16 p-3 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
              placeholder="ملاحظات خصوصی..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </div>
        </Card>
      </div>

      {/* MOBILE STEP 4 & FINANCIAL SUMMARY */}
      <div className={`${activeStep === 4 ? 'block' : 'hidden'} md:block space-y-4`}>
        <Card className="p-4 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-xs space-y-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>خلاصه محاسبات مالی و تایید نهایی</span>
          </h3>

          <div className="space-y-2 text-xs font-bold">
            <div className="flex justify-between items-center text-slate-500">
              <span>جمع ناخالص اقلام:</span>
              <span className="font-mono">{formatCurrency(totals.subtotal)} تومان</span>
            </div>

            {totals.discount_total > 0 && (
              <div className="flex justify-between items-center text-amber-600">
                <span>مجموع تخفیفات:</span>
                <span className="font-mono">{formatCurrency(totals.discount_total)} - تومان</span>
              </div>
            )}

            {totals.tax_total > 0 && (
              <div className="flex justify-between items-center text-rose-600">
                <span>مجموع مالیات و عوارض (VAT):</span>
                <span className="font-mono">{formatCurrency(totals.tax_total)} + تومان</span>
              </div>
            )}

            {shippingTotal > 0 && (
              <div className="flex justify-between items-center text-blue-600">
                <span>هزینه حمل و نقل:</span>
                <span className="font-mono">{formatCurrency(shippingTotal)} + تومان</span>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
              <span>مبلغ نهایی فاکتور:</span>
              <span className="text-indigo-600 font-mono text-base">{formatCurrency(totals.grand_total)} تومان</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-98 transition-all touch-manipulation cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{submitting ? 'در حال ثبت فاکتور...' : 'ثبت و صدور نهایی فاکتور'}</span>
          </button>
        </Card>
      </div>

      {/* STICKY BOTTOM BAR FOR MOBILE WIZARD NAVIGATION */}
      <div className="block md:hidden fixed bottom-16 left-0 right-0 z-20 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-xl safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          {activeStep > 1 ? (
            <button
              onClick={() => setActiveStep((s) => (s - 1) as any)}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 active:scale-95 touch-manipulation"
            >
              <ChevronRight className="w-4 h-4" />
              <span>قبلی</span>
            </button>
          ) : (
            <div />
          )}

          <div className="text-center">
            <span className="text-[10px] text-slate-400 block font-bold">مبلغ نهایی:</span>
            <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
              {formatCurrency(totals.grand_total)} تومان
            </span>
          </div>

          {activeStep < 4 ? (
            <button
              onClick={() => setActiveStep((s) => (s + 1) as any)}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-indigo-500/20 active:scale-95 touch-manipulation"
            >
              <span>بعدی</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95 touch-manipulation"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ثبت فاکتور</span>
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM SHEETS FOR PICKERS */}
      <CustomerPickerSheet
        isOpen={showCustomerSheet}
        onClose={() => setShowCustomerSheet(false)}
        selectedPartyId={partyId}
        onSelectCustomer={handleSelectCustomerFromSheet}
        partyType="customer"
      />

      <ProductPickerSheet
        isOpen={showProductSheet}
        onClose={() => setShowProductSheet(false)}
        selectedProductIds={lines.map((l) => l.item_id)}
        onSelectProduct={handleAddProductFromSheet}
      />

      <PersianDatePickerSheet
        isOpen={showDatePickerSheet}
        onClose={() => setShowDatePickerSheet(false)}
        selectedDate={documentDate}
        onSelectDate={(d) => setDocumentDate(d)}
      />
    </div>
  );
}
