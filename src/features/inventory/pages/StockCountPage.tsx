import React, { useState, useEffect } from 'react';
import { InventoryHeader } from '../components/InventoryHeader';
import { inventoryService } from '../../../services/inventoryService';
import { useAuthStore } from '../../../stores/authStore';
import {
  ClipboardList,
  RefreshCw,
  Plus,
  Layers,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  FileText,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { StockCount, Warehouse, InventoryBalance } from '../../../types/inventory';

export function StockCountPage() {
  const { currentBusiness, user } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';
  const currentUserId = user?.id || 'demo_user';

  // Lists
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCount, setSelectedCount] = useState<StockCount | null>(null);

  // Wizard State for New Stock Count
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // Step 1: Meta, Step 2: Counting, Step 3: Confirmation
  const [wizardForm, setWizardForm] = useState<any>({
    warehouseId: '',
    title: '',
    description: '',
    countDate: new Date().toISOString().substring(0, 10),
  });
  const [wizardBalances, setWizardBalances] = useState<any[]>([]); // Current balances to audit
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const counts = await inventoryService.getStockCounts(businessId);
      setStockCounts(counts);

      const whs = await inventoryService.getWarehouses(businessId);
      setWarehouses(whs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleOpenDetail = async (sc: StockCount) => {
    try {
      const fullSc = await inventoryService.getStockCountById(businessId, sc.id);
      setSelectedCount(fullSc);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (scId: string) => {
    if (!window.confirm('آیا از تأیید نهایی و اعمال مغایرت‌های این انبارگردانی به کاردکس انبار مطمئن هستید؟ این کار همزمان اسناد تعدیل موجودی مربوطه را صادر می‌کند.')) return;
    try {
      await inventoryService.approveStockCount(businessId, scId, currentUserId);
      setSuccessMsg('انبارگردانی با موفقیت تأیید شد و مغایرت‌ها اصلاح گردید.');
      setShowDetailModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در تأیید نهایی');
    }
  };

  const handleCancel = async (scId: string) => {
    if (!window.confirm('آیا از ابطال این انبارگردانی مطمئن هستید؟')) return;
    try {
      await inventoryService.cancelStockCount(businessId, scId, currentUserId);
      setSuccessMsg('انبارگردانی با موفقیت باطل شد.');
      setShowDetailModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'خطا در ابطال');
    }
  };

  // Wizard flow
  const handleOpenWizard = () => {
    setErrorMsg('');
    setWizardStep(1);
    setWizardForm({
      warehouseId: warehouses[0]?.id || '',
      title: `انبارگردانی دوره‌ای مورخ ${new Date().toLocaleDateString('fa-IR')}`,
      description: '',
      countDate: new Date().toISOString().substring(0, 10),
    });
    setWizardBalances([]);
    setShowWizardModal(true);
  };

  const handleWizardNext = async () => {
    setErrorMsg('');
    if (wizardStep === 1) {
      if (!wizardForm.warehouseId) {
        setErrorMsg('لطفا انبار هدف انبارگردانی را انتخاب کنید.');
        return;
      }
      // Load current balances of selected warehouse
      setIsLoading(true);
      try {
        const balances = await inventoryService.getWarehouseStock(businessId, wizardForm.warehouseId);
        if ((balances || []).length === 0) {
          setErrorMsg('انبار انتخاب شده در حال حاضر فاقد موجودی اولیه ثبت شده برای کالاهاست. کماکان می‌توانید انبارگردانی انجام دهید.');
        }

        // Map to counting rows
        setWizardBalances(
          balances.map((b) => ({
            itemId: b.item_id,
            itemName: b.item_name,
            itemCode: b.item_code,
            systemQuantity: b.quantity,
            countedQuantity: b.quantity, // Default to system quantity to save counter time
            variance: 0,
          }))
        );
        setWizardStep(2);
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }
    } else if (wizardStep === 2) {
      setWizardStep(3);
    }
  };

  const handleCountChange = (idx: number, qty: number) => {
    const list = [...wizardBalances];
    list[idx].countedQuantity = qty;
    list[idx].variance = qty - list[idx].systemQuantity;
    setWizardBalances(list);
  };

  const submitWizardCount = async () => {
    setErrorMsg('');
    try {
      const items = wizardBalances.map((b) => ({
        itemId: b.itemId,
        countedQuantity: Number(b.countedQuantity) || 0,
      }));

      await inventoryService.createStockCount(
        businessId,
        {
          warehouse_id: wizardForm.warehouseId,
          title: wizardForm.title,
          description: wizardForm.description,
          count_date: new Date(wizardForm.countDate).toISOString(),
          items,
        },
        currentUserId
      );

      setSuccessMsg('سند پیش‌نویس انبارگردانی با موفقیت ایجاد شد. اکنون می‌توانید مغایرت‌ها را تأیید نهایی کنید.');
      setShowWizardModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت انبارگردانی');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <InventoryHeader />

      {/* Success alert */}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex justify-between items-center animate-fade-in">
          <div className="flex gap-2 items-center text-sm font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-950">انبارگردانی، ممیزی و تعدیلات دوره‌ای</h2>
          <p className="text-gray-500 text-xs mt-1">مدیریت لیست شمارش‌ها، مغایرت‌گیری و صدور خودکار حواله تعدیل</p>
        </div>
        <button
          onClick={handleOpenWizard}
          className="flex items-center gap-2 bg-gray-950 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>شروع انبارگردانی جدید</span>
        </button>
      </div>

      {/* Stock Counts Grid/List */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-950 text-sm">پرونده‌های انبارگردانی ثبت شده</h3>
          <button onClick={loadData} className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-gray-400 bg-gray-50/50 border-b border-gray-50">
                  <th className="py-3.5 pr-6 font-semibold text-xs">شماره پرونده</th>
                  <th className="py-3.5 font-semibold text-xs">عنوان انبارگردانی</th>
                  <th className="py-3.5 font-semibold text-xs">انبار ممیزی‌شده</th>
                  <th className="py-3.5 font-semibold text-xs">تاریخ ممیزی</th>
                  <th className="py-3.5 font-semibold text-xs text-center">وضعیت پرونده</th>
                  <th className="py-3.5 font-semibold text-xs text-center">تعداد اقلام شمارش</th>
                  <th className="py-3.5 font-semibold text-xs text-center">دارای مغایرت</th>
                  <th className="py-3.5 text-left pl-6 font-semibold text-xs">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(stockCounts || []).length > 0 ? (
                  stockCounts.map((sc) => (
                    <tr key={sc.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-4 pr-6 text-gray-900 font-mono text-xs font-bold">{sc.count_number}</td>
                      <td className="py-4 font-semibold text-gray-950">{sc.title}</td>
                      <td className="py-4 text-gray-600 font-medium">{sc.warehouse_name}</td>
                      <td className="py-4 text-gray-500 text-xs">
                        {new Date(sc.count_date).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${
                          sc.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : sc.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-gray-50 text-gray-400 border border-gray-100'
                        }`}>
                          {sc.status === 'draft' ? 'پیش‌نویس' : sc.status === 'approved' ? 'تأیید نهایی' : 'باطل شده'}
                        </span>
                      </td>
                      <td className="py-4 text-center font-bold text-gray-800">{sc.items_count} کالا</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-semibold ${
                          sc.has_variance ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {sc.has_variance ? 'مغایرت دارد' : 'بدون مغایرت'}
                        </span>
                      </td>
                      <td className="py-4 text-left pl-6">
                        <button
                          onClick={() => handleOpenDetail(sc)}
                          className="inline-flex items-center gap-1.5 text-gray-950 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>بررسی پرونده</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                      هیچ سند انبارگردانی تاکنون ثبت نشده است. ممیزی‌های دوره‌ای به ارتقای یکپارچگی مالی کمک شایانی می‌کنند.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DETAIL MODAL FOR AUDIT DETAILS --- */}
      {showDetailModal && selectedCount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative my-8">
            <button onClick={() => setShowDetailModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-100 pb-3 mb-4 text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">پرونده انبارگردانی: {selectedCount.count_number}</span>
              <h3 className="text-lg font-extrabold text-gray-950 mt-1">{selectedCount.title}</h3>
              <p className="text-gray-500 text-xs mt-0.5">{selectedCount.description || 'بدون توضیحات اضافی'}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50 border border-gray-100 rounded-xl p-4 mb-4 text-xs text-gray-700">
              <div>انبار هدف: <strong>{selectedCount.warehouse_name}</strong></div>
              <div>تاریخ شمارش: <strong>{new Date(selectedCount.count_date).toLocaleDateString('fa-IR')}</strong></div>
              <div>تعداد کالا: <strong>{selectedCount.items_count} قلم</strong></div>
              <div>وضعیت: <strong className={selectedCount.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}>
                {selectedCount.status === 'draft' ? 'پیش‌نویس (منتظر تایید)' : selectedCount.status === 'approved' ? 'تأیید شده' : 'باطل شده'}
              </strong></div>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto border border-gray-100 rounded-xl mb-4 pr-1">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <th className="py-3 pr-4">نام کالا / شرح</th>
                    <th className="py-3 text-left">موجودی دفتر</th>
                    <th className="py-3 text-left">شمارش فیزیکی</th>
                    <th className="py-3 text-left font-bold">مغایرت (تعدیل)</th>
                    <th className="py-3 text-left pl-4">بهای خرید</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedCount.items?.map((it: any) => (
                    <tr key={it.id} className={it.variance !== 0 ? 'bg-amber-50/10' : ''}>
                      <td className="py-3 pr-4 font-bold text-gray-800">
                        <div>{it.item_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{it.item_code}</div>
                      </td>
                      <td className="py-3 text-left font-mono">{it.system_quantity}</td>
                      <td className="py-3 text-left font-mono font-bold text-gray-900">{it.counted_quantity}</td>
                      <td className={`py-3 text-left font-mono font-bold ${
                        it.variance === 0 ? 'text-gray-400' : it.variance > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {it.variance > 0 ? `+${it.variance}` : it.variance}
                      </td>
                      <td className="py-3 text-left pl-4 font-mono text-gray-400">
                        {(it.unit_cost || 0).toLocaleString()} ریال
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* If Draft, show actions */}
            {selectedCount.status === 'draft' && (
              <div className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-100 text-amber-900 rounded-xl mb-4 text-xs leading-relaxed">
                <div className="font-semibold flex items-center gap-1 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>توضیح ممیزی و اعمال تعدیل خودکار</span>
                </div>
                <p>
                  در صورت تأیید پرونده انبارگردانی، سیستم به صورت کاملا خودکار یک سند تعدیل موجودی (Adjustment) صادر نموده و مغایرت‌ها (کسری‌ها به عنوان حواله خروج و اضافات به عنوان رسید ورود) را در کاردکس ثبت خواهد کرد تا دفتر انبار با واقعیت فیزیکی همسان شود.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="flex gap-2">
                {selectedCount.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedCount.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      تأیید نهایی و ثبت مغایرت‌ها
                    </button>
                    <button
                      onClick={() => handleCancel(selectedCount.id)}
                      className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
                    >
                      ابطال پرونده
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-xs font-bold"
              >
                بستن پرونده
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- WIZARD MODAL FOR NEW COUNT COUNTING --- */}
      {showWizardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative my-8">
            <button onClick={() => setShowWizardModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>

            {/* Wizard Header Progress */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gray-900" />
                <h3 className="text-base font-bold text-gray-950">انبارگردانی دوره‌ای گام‌به‌گام</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  wizardStep >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>۱</span>
                <span className="text-gray-300">---</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  wizardStep >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>۲</span>
                <span className="text-gray-300">---</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  wizardStep >= 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>۳</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2 text-right">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: SELECT WAREHOUSE & TITLE */}
            {wizardStep === 1 && (
              <div className="flex flex-col gap-4 text-right">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">عنوان انبارگردانی <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={wizardForm.title}
                    onChange={(e) => setWizardForm({ ...wizardForm, title: e.target.value })}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">انبار هدف شمارش <span className="text-rose-500">*</span></label>
                    <select
                      value={wizardForm.warehouseId}
                      required
                      onChange={(e) => setWizardForm({ ...wizardForm, warehouseId: e.target.value })}
                      className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white"
                    >
                      <option value="">-- انتخاب انبار هدف --</option>
                      {(warehouses || []).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">تاریخ شمارش فیزیکی</label>
                    <input
                      type="date"
                      required
                      value={wizardForm.countDate}
                      onChange={(e) => setWizardForm({ ...wizardForm, countDate: e.target.value })}
                      className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">شرح / توضیحات پرونده</label>
                  <textarea
                    value={wizardForm.description}
                    onChange={(e) => setWizardForm({ ...wizardForm, description: e.target.value })}
                    placeholder="مثال: انبارگردانی پایان سال مالی ۱۴۰۳ جهت تهیه صورت‌های مالی دقیق"
                    rows={2}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: COUNTING ENTRIES LIST */}
            {wizardStep === 2 && (
              <div className="flex flex-col gap-3 text-right">
                <div>
                  <h4 className="font-bold text-sm text-gray-950">گزارش و ثبت موجودی واقعی کالاها</h4>
                  <p className="text-gray-500 text-xs mt-0.5">سیستم مقادیر دفتری را استخراج نموده است. لطفا تعداد شمارش‌شده را به صورت دستی وارد کنید.</p>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="py-2.5 pr-4">شرح کالا</th>
                        <th className="py-2.5 text-left">موجودی دفتری (سیستم)</th>
                        <th className="py-2.5 text-left pl-4">تعداد فیزیکی شمارش</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(wizardBalances || []).map((b, idx) => (
                        <tr key={b.itemId}>
                          <td className="py-2 pr-4 font-bold text-gray-800">
                            <span>{b.itemName}</span>
                            <div className="text-[9px] text-gray-400 font-mono mt-0.5">{b.itemCode}</div>
                          </td>
                          <td className="py-2 text-left font-mono font-semibold text-gray-600">{b.systemQuantity}</td>
                          <td className="py-2 text-left pl-4">
                            <input
                              type="number"
                              min={0}
                              value={b.countedQuantity}
                              onChange={(e) => handleCountChange(idx, Number(e.target.value))}
                              className="w-20 px-2 py-1 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded text-left font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW VARIANCE CHART & FINAL SUBMIT */}
            {wizardStep === 3 && (
              <div className="flex flex-col gap-4 text-right">
                <div>
                  <h4 className="font-bold text-sm text-gray-950">تأیید پیش‌نویس نهایی و مغایرت‌های فیزیکی</h4>
                  <p className="text-gray-500 text-xs mt-0.5">خلاصه‌ای از تفاوت شمارش فیزیکی و دفاتر جهت ایجاد پیش‌نویس:</p>
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="py-2.5 pr-4">کالا</th>
                        <th className="py-2.5 text-left">موجودی دفتری</th>
                        <th className="py-2.5 text-left">موجودی شمارش</th>
                        <th className="py-2.5 text-left pl-4">کسری (-) / اضافی (+)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(wizardBalances || []).map((b) => (
                        <tr key={b.itemId} className={b.variance !== 0 ? 'bg-amber-50/10' : ''}>
                          <td className="py-2 pr-4 font-semibold text-gray-800">{b.itemName}</td>
                          <td className="py-2 text-left font-mono">{b.systemQuantity}</td>
                          <td className="py-2 text-left font-mono font-bold text-gray-900">{b.countedQuantity}</td>
                          <td className={`py-2 text-left font-mono font-bold pl-4 ${
                            b.variance === 0 ? 'text-gray-400' : b.variance > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {b.variance > 0 ? `+${b.variance}` : b.variance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl leading-relaxed flex gap-2 items-start">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    ثبت نهایی این برگه ابتدا یک پرونده پیش‌نویس انبارگردانی (DRAFT) ایجاد می‌کند. جهت تغییر قطعی موجودی کالاها در کاردکس، باید پس از ثبت، دکمه <strong>"تأیید نهایی و ثبت مغایرت‌ها"</strong> را در لیست پرونده‌ها کلیک نمایید.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-5">
              <div className="flex gap-2">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(wizardStep - 1)}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>مرحله قبل</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowWizardModal(false)}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 text-xs font-bold"
                >
                  انصراف
                </button>
                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleWizardNext}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <span>مرحله بعد</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitWizardCount}
                    className="px-5 py-2 bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    ثبت نهایی پیش‌نویس انبارگردانی
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
