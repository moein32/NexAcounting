import React, { useState, useEffect } from 'react';
import { InventoryHeader } from '../components/InventoryHeader';
import { inventoryService } from '../../../services/inventoryService';
import { itemService } from '../../../services/itemService';
import { useAuthStore } from '../../../stores/authStore';
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  User,
  Phone,
  Layers,
  ArrowLeftRight,
  PlusCircle,
  Archive,
  Search,
  CheckCircle,
  X,
  FileText,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Warehouse, WarehouseLocation, InventoryBalance } from '../../../types/inventory';
import { Item } from '../../../types/catalog';

export function WarehousesPage() {
  const { currentBusiness, user } = useAuthStore();
  const businessId = currentBusiness?.id || 'demo_biz_1';
  const currentUserId = user?.id || 'demo_user';

  // State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);
  const [whStock, setWhStock] = useState<InventoryBalance[]>([]);
  const [whLocations, setWhLocations] = useState<WarehouseLocation[]>([]);
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Forms
  const [showWhModal, setShowWhModal] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [whForm, setWhForm] = useState({
    name: '',
    code: '',
    manager_name: '',
    phone: '',
    address: '',
    description: '',
  });

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locForm, setLocForm] = useState({ name: '', code: '', description: '' });

  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState<'receipt' | 'issue' | 'transfer'>('receipt');
  const [docForm, setDocForm] = useState<any>({
    warehouseId: '',
    targetWarehouseId: '',
    description: '',
    documentDate: new Date().toISOString().substring(0, 10),
    items: [{ itemId: '', quantity: 1, unitCost: 0 }],
  });

  const [searchStockQuery, setSearchStockQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const whList = await inventoryService.getWarehouses(businessId);
      setWarehouses(whList);

      const itemsResponse = await itemService.getItems(businessId);
      // Only track physical items
      const physicalItems = itemsResponse.data.filter(i => i.item_type !== 'service' && i.track_inventory !== false);
      setCatalogItems(physicalItems);

      if (whList.length > 0 && !selectedWh) {
        setSelectedWh(whList[0]);
      } else if (selectedWh) {
        const updatedSelected = whList.find(w => w.id === selectedWh.id);
        if (updatedSelected) setSelectedWh(updatedSelected);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSelectedWarehouseDetails = async (whId: string) => {
    try {
      const stock = await inventoryService.getWarehouseStock(businessId, whId);
      setWhStock(stock);

      const locs = await inventoryService.getWarehouseLocations(whId);
      setWhLocations(locs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  useEffect(() => {
    if (selectedWh) {
      loadSelectedWarehouseDetails(selectedWh.id);
    }
  }, [selectedWh]);

  // Handle direct url actions (e.g. from dashboard shortcuts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const type = params.get('type') as any;

    if (action === 'new-doc' && type) {
      openDocModal(type);
    } else if (action === 'transfer') {
      openDocModal('transfer');
    }
  }, [warehouses]);

  const openWhModal = (wh: Warehouse | null = null) => {
    setErrorMsg('');
    if (wh) {
      setEditingWh(wh);
      setWhForm({
        name: wh.name,
        code: wh.code || '',
        manager_name: wh.manager_name || '',
        phone: wh.phone || '',
        address: wh.address || '',
        description: wh.description || '',
      });
    } else {
      setEditingWh(null);
      setWhForm({
        name: '',
        code: '',
        manager_name: '',
        phone: '',
        address: '',
        description: '',
      });
    }
    setShowWhModal(true);
  };

  const saveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingWh) {
        await inventoryService.updateWarehouse(businessId, editingWh.id, whForm, currentUserId);
        setSuccessMsg('اطلاعات انبار با موفقیت ویرایش شد.');
      } else {
        await inventoryService.createWarehouse(businessId, whForm, currentUserId);
        setSuccessMsg('انبار جدید با موفقیت ثبت شد.');
      }
      setShowWhModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ذخیره اطلاعات');
    }
  };

  const handleDeleteWh = async (e: React.MouseEvent, wh: Warehouse) => {
    e.stopPropagation();
    if (!window.confirm(`آیا از حذف انبار "${wh.name}" اطمینان دارید؟`)) return;
    setErrorMsg('');
    try {
      await inventoryService.deleteWarehouse(businessId, wh.id, currentUserId);
      setSuccessMsg('انبار با موفقیت حذف شد.');
      if (selectedWh?.id === wh.id) {
        setSelectedWh(null);
      }
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در حذف انبار');
    }
  };

  const saveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWh) return;
    try {
      await inventoryService.createWarehouseLocation(selectedWh.id, locForm);
      setShowLocationModal(false);
      setLocForm({ name: '', code: '', description: '' });
      loadSelectedWarehouseDetails(selectedWh.id);
      setSuccessMsg('موقعیت جدید قفسه‌بندی ثبت شد.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const openDocModal = (type: 'receipt' | 'issue' | 'transfer') => {
    setErrorMsg('');
    setDocType(type);
    setDocForm({
      warehouseId: selectedWh?.id || (warehouses[0]?.id || ''),
      targetWarehouseId: warehouses.find((w) => w.id !== selectedWh?.id)?.id || '',
      description: type === 'receipt' ? 'رسید ورود کالای خریداری شده' : type === 'issue' ? 'حواله خروج کالای فروخته شده' : 'حواله انتقال بین انبارها',
      documentDate: new Date().toISOString().substring(0, 10),
      items: [{ itemId: '', quantity: 1, unitCost: 0 }],
    });
    setShowDocModal(true);
  };

  const addDocItemField = () => {
    setDocForm({
      ...docForm,
      items: [...docForm.items, { itemId: '', quantity: 1, unitCost: 0 }],
    });
  };

  const removeDocItemField = (idx: number) => {
    if (docForm.items.length <= 1) return;
    const items = [...docForm.items];
    items.splice(idx, 1);
    setDocForm({ ...docForm, items });
  };

  const handleItemSelect = (idx: number, itemId: string) => {
    const targetItem = catalogItems.find((i) => i.id === itemId);
    const items = [...docForm.items];
    items[idx] = {
      ...items[idx],
      itemId,
      unitCost: targetItem?.purchase_price || 0,
    };
    setDocForm({ ...docForm, items });
  };

  const submitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      // Validate empty items
      if (docForm.items.some((i: any) => !i.itemId)) {
        throw new Error('لطفا کالا را انتخاب کنید.');
      }
      if (docForm.items.some((i: any) => Number(i.quantity) <= 0)) {
        throw new Error('مقدار کالا باید بزرگتر از صفر باشد.');
      }

      if (docType === 'transfer') {
        if (!docForm.targetWarehouseId) throw new Error('انبار مقصد مشخص نشده است.');
        if (docForm.warehouseId === docForm.targetWarehouseId) {
          throw new Error('انبار مبدا و مقصد نمی‌توانند یکسان باشند.');
        }

        await inventoryService.transferInventory(
          businessId,
          {
            sourceWarehouseId: docForm.warehouseId,
            targetWarehouseId: docForm.targetWarehouseId,
            description: docForm.description,
            date: new Date(docForm.documentDate).toISOString(),
            items: docForm.items,
          },
          currentUserId
        );
        setSuccessMsg('عملیات انتقال بین انبارها با موفقیت انجام و کالا منتقل شد.');
      } else if (docType === 'receipt') {
        // Create draft receipt first, then confirm!
        const doc = await inventoryService.createInventoryDocument(
          businessId,
          {
            document_type: 'receipt',
            warehouse_id: docForm.warehouseId,
            description: docForm.description,
            document_date: new Date(docForm.documentDate).toISOString(),
            items: docForm.items.map((i: any) => ({
              item_id: i.itemId,
              quantity: i.quantity,
              unit_cost: i.unitCost,
            })),
          },
          currentUserId
        );
        await inventoryService.confirmInventoryDocument(businessId, doc.id, currentUserId);
        setSuccessMsg('سند رسید ورود انبار با موفقیت تأیید و موجودی افزایش یافت.');
      } else {
        // Issue
        const doc = await inventoryService.createInventoryDocument(
          businessId,
          {
            document_type: 'issue',
            warehouse_id: docForm.warehouseId,
            description: docForm.description,
            document_date: new Date(docForm.documentDate).toISOString(),
            items: docForm.items.map((i: any) => ({
              item_id: i.itemId,
              quantity: i.quantity,
              unit_cost: i.unitCost,
            })),
          },
          currentUserId
        );
        await inventoryService.confirmInventoryDocument(businessId, doc.id, currentUserId);
        setSuccessMsg('سند حواله خروج انبار با موفقیت تأیید و موجودی کالا کسر شد.');
      }

      setShowDocModal(false);
      if (selectedWh) loadSelectedWarehouseDetails(selectedWh.id);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت سند انبارداری');
    }
  };

  const filteredStock = whStock.filter((s) => {
    if (!searchStockQuery.trim()) return true;
    const q = searchStockQuery.trim().toLowerCase();
    return (
      s.item_name.toLowerCase().includes(q) ||
      s.item_code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <InventoryHeader />

      {/* Success/Error Alerts */}
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

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Warehouses List */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Archive className="w-5 h-5 text-gray-600" />
                <span>انبارهای تعریف‌شده</span>
              </h3>
              <button
                onClick={() => openWhModal()}
                className="p-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
                title="افزودن انبار جدید"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {warehouses.map((w) => {
                const isSelected = selectedWh?.id === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWh(w)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-[1.01]'
                        : 'bg-white border-gray-100 hover:border-gray-300 text-gray-800 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSelected ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {w.code || 'فاقد کد'}
                        </span>
                        <h4 className="font-bold text-sm mt-1.5">{w.name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhModal(w);
                          }}
                          className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${
                            isSelected ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                          }`}
                          title="ویرایش انبار"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteWh(e, w)}
                          className={`p-1 rounded-lg hover:bg-rose-500/20 transition-colors ${
                            isSelected ? 'text-rose-300 hover:text-rose-100' : 'text-rose-500 hover:text-rose-700'
                          }`}
                          title="حذف انبار"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className={`text-xs mt-2 line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {w.address || 'نشانی ثبت نشده است.'}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-gray-200/10 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{w.locations_count || 0} موقعیت قفسه</span>
                      </span>
                      <span className="font-semibold">
                        {w.item_count || 0} کالا ({w.total_quantity || 0} عدد)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Warehouse Inventory Stock List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedWh ? (
            <>
              {/* Wh Meta info card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold">بررسی انبار انتخاب‌شده</span>
                    <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedWh.name}</h2>
                    <p className="text-gray-500 text-xs mt-1">{selectedWh.description || 'فاقد توضیحات تکمیلی انبار'}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openDocModal('receipt')}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>رسید جدید (ورود)</span>
                    </button>
                    <button
                      onClick={() => openDocModal('issue')}
                      className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>حواله جدید (خروج)</span>
                    </button>
                    <button
                      onClick={() => openDocModal('transfer')}
                      className="px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>انتقال به انبار دیگر</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>مسئول انبار: <strong>{selectedWh.manager_name || 'نامشخص'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>تلفن تماس: <strong>{selectedWh.phone || 'نامشخص'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 animate-bounce" />
                    <span className="truncate">آدرس: {selectedWh.address || 'نشانی ثبت نشده'}</span>
                  </div>
                </div>
              </div>

              {/* Shelf Coordinates / Locations Section */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-sm">موقعیت‌یابی و قفسه‌بندی فیزیکی انبار</h3>
                  <button
                    onClick={() => {
                      setErrorMsg('');
                      setShowLocationModal(true);
                    }}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-semibold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>ایجاد قفسه جدید</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {whLocations.length > 0 ? (
                    whLocations.map((loc) => (
                      <div key={loc.id} className="px-3.5 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs flex items-center gap-2 hover:bg-gray-100 hover:border-gray-200 transition-all">
                        <span className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                        <span className="text-gray-900 font-bold">{loc.name}</span>
                        {loc.code && <span className="text-gray-400 font-mono text-[10px]">({loc.code})</span>}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 text-xs py-2">هیچ موقعیت قفسه‌بندی هنوز ثبت نشده است.</span>
                  )}
                </div>
              </div>

              {/* Warehouse Inventory Stock balances list */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                  <div>
                    <h3 className="font-bold text-gray-950 text-base">موجودی کالاها در این انبار</h3>
                    <p className="text-gray-500 text-xs mt-0.5">موجودی فیزیکی، مقدار رزرو شده و حداقل انبار</p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="جستجو در کالاها..."
                      value={searchStockQuery}
                      onChange={(e) => setSearchStockQuery(e.target.value)}
                      className="w-full text-xs text-gray-800 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-gray-950 rounded-xl pl-3 pr-9 py-2.5 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-50 pb-3">
                        <th className="pb-3 font-semibold">شرح کالا</th>
                        <th className="pb-3 font-semibold">کد کالا</th>
                        <th className="pb-3 font-semibold text-left">موجودی کل</th>
                        <th className="pb-3 font-semibold text-left">رزرو شده</th>
                        <th className="pb-3 font-semibold text-left">قابل فروش</th>
                        <th className="pb-3 font-semibold text-left">حداقل مجاز انبار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredStock.length > 0 ? (
                        filteredStock.map((s) => {
                          const isLow = s.quantity < (s.min_stock || 0);
                          return (
                            <tr key={s.id} className={`hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-amber-50/20' : ''}`}>
                              <td className="py-3.5 font-medium text-gray-900 flex items-center gap-2">
                                <span>{s.item_name}</span>
                                {isLow && (
                                  <span className="inline-block bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    نیاز به شارژ
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 text-gray-500 font-mono text-xs">{s.item_code || '---'}</td>
                              <td className="py-3.5 text-left font-bold text-gray-900">{s.quantity.toLocaleString()}</td>
                              <td className="py-3.5 text-left text-gray-400">{s.reserved_quantity?.toLocaleString() || 0}</td>
                              <td className="py-3.5 text-left font-bold text-gray-950">{(s.available_quantity || s.quantity).toLocaleString()}</td>
                              <td className="py-3.5 text-left font-mono text-gray-400 text-xs">{(s.min_stock || 0).toLocaleString()}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                            کالایی در این انبار ذخیره نشده است. با دکمه‌های بالا اولین کالا را وارد کنید.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 bg-white border border-gray-100 rounded-2xl">
              <Archive className="w-10 h-10 text-gray-300 animate-pulse" />
              <p className="text-gray-400 text-sm mt-3">انبار مورد نظر را انتخاب کنید یا یک انبار جدید بسازید.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL WAREHOUSE CREATION --- */}
      {showWhModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button onClick={() => setShowWhModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-950 mb-4">{editingWh ? 'ویرایش انبار' : 'تعریف انبار جدید'}</h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={saveWarehouse} className="flex flex-col gap-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">نام انبار <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={whForm.name}
                    onChange={(e) => setWhForm({ ...whForm, name: e.target.value })}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">کد اختصاصی انبار <span className="text-gray-400">(مثلا WH-001)</span></label>
                  <input
                    type="text"
                    value={whForm.code}
                    onChange={(e) => setWhForm({ ...whForm, code: e.target.value })}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">نام سرپرست / امین انبار</label>
                  <input
                    type="text"
                    value={whForm.manager_name}
                    onChange={(e) => setWhForm({ ...whForm, manager_name: e.target.value })}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">تلفن تماس مستقیم انبار</label>
                  <input
                    type="text"
                    value={whForm.phone}
                    onChange={(e) => setWhForm({ ...whForm, phone: e.target.value })}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">نشانی فیزیکی انبار</label>
                <textarea
                  value={whForm.address}
                  onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
                  rows={2}
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">توضیحات تکمیلی</label>
                <textarea
                  value={whForm.description}
                  onChange={(e) => setWhForm({ ...whForm, description: e.target.value })}
                  rows={2}
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowWhModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-900 hover:bg-gray-800 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  ثبت انبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CREATE SHELF LOCATION --- */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button onClick={() => setShowLocationModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-950 mb-4">ثبت قفسه‌بندی / موقعیت جدید</h3>

            <form onSubmit={saveLocation} className="flex flex-col gap-4 text-right">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">عنوان موقعیت <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مانند قفسه A-01"
                  value={locForm.name}
                  onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">کد شناسایی موقعیت</label>
                <input
                  type="text"
                  placeholder="مانند A01"
                  value={locForm.code}
                  onChange={(e) => setLocForm({ ...locForm, code: e.target.value })}
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">توضیحات موقعیت فیزیکی</label>
                <input
                  type="text"
                  value={locForm.description}
                  onChange={(e) => setLocForm({ ...locForm, description: e.target.value })}
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-xl text-white text-sm font-medium"
                >
                  ثبت موقعیت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CREATE DOCUMENT (RECEIPT, ISSUE, TRANSFER) --- */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative my-8">
            <button onClick={() => setShowDocModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
              <FileText className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-bold text-gray-950">
                {docType === 'receipt'
                  ? 'ثبت رسید ورود انبار (خرید / افزایش)'
                  : docType === 'issue'
                  ? 'ثبت حواله خروج انبار (فروش / کاهش)'
                  : 'عملیات انتقال بین دو انبار'}
              </h3>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={submitDocument} className="flex flex-col gap-4 text-right">
              {/* Warehouse selector rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    {docType === 'transfer' ? 'انبار مبدا (کاهش)' : 'انبار هدف عملیات'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={docForm.warehouseId}
                    onChange={(e) => setDocForm({ ...docForm, warehouseId: e.target.value })}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
                  >
                    <option value="">انتخاب انبار...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {docType === 'transfer' && (
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <label className="text-xs font-semibold text-gray-700">انبار مقصد (افزایش) <span className="text-rose-500">*</span></label>
                    <select
                      value={docForm.targetWarehouseId}
                      onChange={(e) => setDocForm({ ...docForm, targetWarehouseId: e.target.value })}
                      className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950"
                    >
                      <option value="">انتخاب انبار مقصد...</option>
                      {warehouses
                        .filter((w) => w.id !== docForm.warehouseId)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">تاریخ ثبت سند</label>
                  <input
                    type="date"
                    required
                    value={docForm.documentDate}
                    onChange={(e) => setDocForm({ ...docForm, documentDate: e.target.value })}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-gray-950 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">شرح / بابت سند</label>
                <input
                  type="text"
                  value={docForm.description}
                  onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                  placeholder="مثال: رسید کالا مربوط به خرید فاکتور شماره ۱۲"
                  className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none"
                />
              </div>

              {/* Items grid selection dynamic fields */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-xs text-gray-900">اقلام کالای سند</h4>
                  <button
                    type="button"
                    onClick={addDocItemField}
                    className="text-xs text-primary-600 hover:text-primary-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن سطر</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {docForm.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-white border border-gray-200/60 rounded-xl p-3 relative">
                      <div className="flex-1 w-full flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500">کالا <span className="text-rose-500">*</span></label>
                        <select
                          value={item.itemId}
                          required
                          onChange={(e) => handleItemSelect(idx, e.target.value)}
                          className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 outline-none"
                        >
                          <option value="">-- انتخاب کالا --</option>
                          {catalogItems.map((ci) => (
                            <option key={ci.id} value={ci.id}>
                              {ci.name} ({ci.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-24 flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500">تعداد <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const items = [...docForm.items];
                            items[idx].quantity = val;
                            setDocForm({ ...docForm, items });
                          }}
                          className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 outline-none font-mono text-left"
                        />
                      </div>

                      <div className="w-full sm:w-32 flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-500">بهای خرید/واحد (ریال)</label>
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const items = [...docForm.items];
                            items[idx].unitCost = val;
                            setDocForm({ ...docForm, items });
                          }}
                          className="w-full text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 outline-none font-mono text-left"
                        />
                      </div>

                      {docForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDocItemField(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 shrink-0 self-end sm:self-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings / Terms */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2 items-start text-xs text-blue-800 leading-relaxed">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  تأیید نهایی این سند بلافاصله روی کاردکس گردش کالاهای انتخاب شده در انبار تأثیر فیزیکی می‌گذارد و به تراکنش‌های تأیید شده تبدیل می‌گردد. امکان ابطال بعد از تأیید وجود دارد.
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-900 hover:bg-gray-800 rounded-xl text-white text-sm font-medium"
                >
                  تأیید و صدور نهایی سند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
