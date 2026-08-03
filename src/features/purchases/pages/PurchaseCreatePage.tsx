import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { documentService } from '../../../services/documentService';
import { partyService } from '../../../services/partyService';
import { inventoryService } from '../../../services/inventoryService';
import { itemService } from '../../../services/itemService';
import { Party } from '../../../types/party';
import { Warehouse } from '../../../types/inventory';
import { Item } from '../../../types/catalog';
import { DocumentType } from '../../../types/document';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { formatCurrency } from '../../../lib/utils';
import {
  ArrowRight,
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  Percent,
} from 'lucide-react';

interface FormLine {
  item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  line_subtotal: number;
  line_total: number;
}

export function PurchaseCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentBusiness, user } = useAuthStore();

  // Route/Query parameters
  const defaultType = (searchParams.get('type') || 'purchase_invoice') as DocumentType;
  const editId = searchParams.get('edit');

  // Form State
  const [docType, setDocType] = useState<DocumentType>(defaultType);
  const [partyId, setPartyId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [shippingTotal, setShippingTotal] = useState(0);

  // Dynamic lines state
  const [lines, setLines] = useState<FormLine[]>([
    {
      item_id: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_percent: 10, // Default VAT 10%
      line_subtotal: 0,
      line_total: 0,
    },
  ]);

  // Master Data State
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentBusiness) {
      loadMasterData();
    }
  }, [currentBusiness]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const bizId = currentBusiness!.id;

      // 1. Fetch suppliers
      const partiesResult = await partyService.getParties(bizId);
      const allParties = partiesResult.data || [];
      const filteredSuppliers = allParties.filter((p) => p.roles.includes('supplier'));
      setSuppliers(filteredSuppliers);

      // 2. Fetch warehouses
      const whs = await inventoryService.getWarehouses(bizId);
      setWarehouses(whs || []);
      if (whs && whs.length > 0) {
        setWarehouseId(whs[0].id);
      }

      // 3. Fetch catalog items
      const catalogItemsResult = await itemService.getItems(bizId);
      const catalogItems = catalogItemsResult.data || [];
      setItems(catalogItems);

      // If editing/duplicating an existing draft
      if (editId) {
        const docToEdit = await documentService.getDocumentById(bizId, editId);
        if (docToEdit.status === 'draft') {
          setDocType(docToEdit.document_type);
          setPartyId(docToEdit.party_id || '');
          setWarehouseId(docToEdit.warehouse_id || '');
          setDocumentDate(docToEdit.document_date.split('T')[0]);
          setDueDate(docToEdit.due_date ? docToEdit.due_date.split('T')[0] : '');
          setNotes(docToEdit.notes || '');
          setInternalNotes(docToEdit.internal_notes || '');
          setShippingTotal(docToEdit.shipping_total || 0);

          if (docToEdit.items && docToEdit.items.length > 0) {
            const mappedLines = docToEdit.items.map((it) => ({
              item_id: it.item_id,
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
      console.error('Error loading purchases form master data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        item_id: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_percent: 10,
        line_subtotal: 0,
        line_total: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    const updated = [...lines];
    updated.splice(index, 1);
    setLines(updated);
  };

  const handleLineChange = (index: number, field: keyof FormLine, value: any) => {
    const updated = [...lines];
    const line = { ...updated[index] };

    if (field === 'item_id') {
      line.item_id = value;
      const targetItem = items.find((it) => it.id === value);
      if (targetItem) {
        line.unit_price = targetItem.default_purchase_price || 0;
        line.description = targetItem.description || '';
        line.tax_percent = targetItem.tax_rate !== undefined ? targetItem.tax_rate : 10;
        line.discount_percent = 0;
      }
    } else {
      (line as any)[field] = value;
    }

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

  const getDocTypeOptions = () => [
    { value: 'purchase_invoice', label: 'فاکتور خرید کالا' },
    { value: 'purchase_order', label: 'سفارش خرید (درخواست تأمین)' },
    { value: 'purchase_return', label: 'برگشت از خرید (مرجوعی به تأمین‌کننده)' },
  ];

  const totals = documentService.calculateDocumentTotals(lines, shippingTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    if (!partyId) {
      alert('لطفا تأمین‌کننده مورد نظر را انتخاب کنید.');
      return;
    }

    if (!warehouseId) {
      alert('لطفا انبار دریافت کالا را انتخاب کنید.');
      return;
    }

    const invalidLines = lines.some((line) => !line.item_id || line.quantity <= 0);
    if (invalidLines) {
      alert('لطفا کالاها را مشخص و تعداد مثبت وارد کنید.');
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
          description: line.description,
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
        alert('سند خرید پیش‌نویس به‌روزرسانی شد.');
      } else {
        doc = await documentService.createDocument(currentBusiness.id, payload, user?.id);
        alert('سند خرید پیش‌نویس جدید صادر شد.');
      }

      navigate(`/purchases/${doc.id}`);
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت سند خرید');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">در حال دریافت اطلاعات پایه تدارکات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />} onClick={() => navigate('/purchases')}>
            بازگشت
          </Button>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {editId ? 'ویرایش سند تدارکاتی' : 'ثبت سند تجاری خرید جدید'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">تأمین کالا از تأمین‌کننده معتبر و درج مستقیم در کاردکس انبار</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Select
              label="نوع سند تجاری"
              options={getDocTypeOptions()}
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              disabled={!!editId}
            />

            <Select
              label="انتخاب فروشنده / تأمین‌کننده"
              options={[
                { value: '', label: 'انتخاب تأمین‌کننده...' },
                ...suppliers.map((s) => ({ value: s.id, label: s.display_name })),
              ]}
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              required
            />

            <Select
              label="انبار تحویل‌گیرنده کالا"
              options={[
                { value: '', label: 'انتخاب انبار...' },
                ...warehouses.map((w) => ({ value: w.id, label: w.name })),
              ]}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              required
            />

            <Input
              type="date"
              label="تاریخ فاکتور خرید"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              required
            />

            {docType === 'purchase_invoice' && (
              <Input
                type="date"
                label="سررسید تسویه"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            )}
          </div>
        </Card>

        {/* Lines */}
        <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl overflow-x-auto">
          <h2 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-500" />
            <span>اقلام فاکتور خرید</span>
          </h2>

          <div className="space-y-4 min-w-[800px]">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-end border-b border-slate-100 dark:border-slate-900 pb-4">
                <div className="col-span-3">
                  <Select
                    label={idx === 0 ? "انتخاب کالا / خدمت" : undefined}
                    options={[
                      { value: '', label: 'انتخاب کالا...' },
                      ...items.map((i) => ({ value: i.id, label: `${i.name} (${i.code || 'کد ندارد'})` })),
                    ]}
                    value={line.item_id}
                    onChange={(e) => handleLineChange(idx, 'item_id', e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-3">
                  <Input
                    type="text"
                    label={idx === 0 ? "توضیحات ردیف" : undefined}
                    placeholder="شرح جزئیات خرید..."
                    value={line.description}
                    onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    type="number"
                    min="1"
                    step="any"
                    label={idx === 0 ? "تعداد" : undefined}
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    label={idx === 0 ? "بهای واحد خرید (تومان)" : undefined}
                    value={line.unit_price}
                    onChange={(e) => handleLineChange(idx, 'unit_price', Number(e.target.value))}
                    required
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    label={idx === 0 ? "تخفیف (٪)" : undefined}
                    rightIcon={<Percent className="w-3.5 h-3.5 text-slate-400" />}
                    value={line.discount_percent}
                    onChange={(e) => handleLineChange(idx, 'discount_percent', Number(e.target.value))}
                  />
                </div>

                <div className="col-span-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    label={idx === 0 ? "مالیات (٪)" : undefined}
                    value={line.tax_percent}
                    onChange={(e) => handleLineChange(idx, 'tax_percent', Number(e.target.value))}
                  />
                </div>

                <div className="col-span-1 flex items-center justify-end gap-2 h-10">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(line.line_total)}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleAddLine}>
              افزودن ردیف جدید
            </Button>
          </div>
        </Card>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              ملاحظات خرید کالا
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">شرح و یادداشت فاکتور خرید:</label>
                <textarea
                  className="w-full h-24 p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
                  placeholder="ملاحظات پرداختی، اطلاعات بارنامه، شماره چک ضمانتی صادر شده..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">یادداشت‌های داخلی تدارکات:</label>
                <textarea
                  className="w-full h-16 p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-slate-200"
                  placeholder="ملاحظات خصوصی مدیران خرید یا مدیریت کیفیت..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              خلاصه صورت‌حساب خرید کالا
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>جمع ناخالص فاکتور خرید:</span>
                <span>{formatCurrency(totals.subtotal)} تومان</span>
              </div>
              {totals.discount_total > 0 && (
                <div className="flex justify-between items-center text-amber-600 font-semibold">
                  <span>مجموع تخفیف‌های فروشنده:</span>
                  <span>{formatCurrency(totals.discount_total)} - تومان</span>
                </div>
              )}
              {totals.tax_total > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-semibold">
                  <span>مالیات بر ارزش افزوده (۱۰٪):</span>
                  <span>{formatCurrency(totals.tax_total)} + تومان</span>
                </div>
              )}

              <div className="pt-2">
                <Input
                  type="number"
                  min="0"
                  label="هزینه باربری و حمل کالا (تومان)"
                  value={shippingTotal}
                  onChange={(e) => setShippingTotal(Number(e.target.value))}
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-900 pt-4 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                <span>بهای تمام‌شده کل:</span>
                <span className="text-blue-600">{formatCurrency(totals.grand_total)} تومان</span>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full justify-center" icon={<Save className="w-4 h-4" />} disabled={submitting}>
              {submitting ? 'در حال ثبت پیش‌نویس...' : 'ثبت پیش‌نویس سند خرید'}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
