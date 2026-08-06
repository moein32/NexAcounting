import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { ReportsFilter } from '../components/ReportsFilter';
import { SalesReportView } from '../components/SalesReportView';
import { PurchaseReportView } from '../components/PurchaseReportView';
import { CustomerSupplierAnalytics } from '../components/CustomerSupplierAnalytics';
import { InventoryAnalyticsView } from '../components/InventoryAnalyticsView';
import { TreasuryAnalyticsView } from '../components/TreasuryAnalyticsView';
import { CommitmentsScheduler } from '../components/CommitmentsScheduler';
import { GlobalSearchView } from '../components/GlobalSearchView';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Warehouse, 
  Landmark, 
  Calendar, 
  Search, 
  Loader2, 
  Download, 
  Printer 
} from 'lucide-react';
import { useAppStore } from '../../../stores/appStore';
import { biService } from '../../../services/biService';
import { partyService } from '../../../services/partyService';

type ActiveTabType = 'sales' | 'purchases' | 'customers' | 'inventory' | 'treasury' | 'commitments' | 'search';

export function ReportsPage() {
  const { currentBusiness } = useAppStore();
  const [activeTab, setActiveTab] = useState<ActiveTabType>('sales');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [salesData, setSalesData] = useState<any>(null);
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [customersData, setCustomersData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [treasuryData, setTreasuryData] = useState<any>(null);
  const [parties, setParties] = useState<any[]>([]);

  // Filter States
  const [filters, setFilters] = useState<any>({
    startDate: '',
    endDate: '',
    partyId: 'all',
    search: ''
  });

  const loadParties = async () => {
    if (!currentBusiness?.id) return;
    try {
      const res = await partyService.getParties(currentBusiness.id);
      setParties(res.data || []);
    } catch (e) {
      console.error('Failed to load parties for filter', e);
    }
  };

  const fetchReportData = async () => {
    if (!currentBusiness?.id) return;
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const data = await biService.getSalesReport(currentBusiness.id, filters);
        setSalesData(data);
      } else if (activeTab === 'purchases') {
        const data = await biService.getPurchaseReport(currentBusiness.id, filters);
        setPurchaseData(data);
      } else if (activeTab === 'customers') {
        const custs = await biService.getCustomerReport(currentBusiness.id);
        const supps = await biService.getSupplierReport(currentBusiness.id);
        setCustomersData(custs);
        setSuppliersData(supps);
      } else if (activeTab === 'inventory') {
        const data = await biService.getInventoryReport(currentBusiness.id);
        setInventoryData(data);
      } else if (activeTab === 'treasury') {
        const data = await biService.getTreasuryReport(currentBusiness.id);
        setTreasuryData(data);
      }
    } catch (e) {
      console.error('Failed to extract business intelligence report', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [currentBusiness?.id]);

  useEffect(() => {
    fetchReportData();
  }, [currentBusiness?.id, activeTab, filters]);

  // Persian CSV Exporter (With UTF-8 BOM for perfect Excel compatibility)
  const handleExportCSV = (rows: any[], filename: string) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const content = rows.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csvContent = "\ufeff" + headers + '\n' + content;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const tabsConfig = [
    { id: 'sales' as const, label: 'فروش و خریداران', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'purchases' as const, label: 'خرید و زنجیره تامین', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'customers' as const, label: 'آنالیز طرف حساب‌ها', icon: <Users className="w-4 h-4" /> },
    { id: 'inventory' as const, label: 'ارزش‌گذاری انبار', icon: <Warehouse className="w-4 h-4" /> },
    { id: 'treasury' as const, label: 'جریان نقدینگی و بانک', icon: <Landmark className="w-4 h-4" /> },
    { id: 'commitments' as const, label: 'تقویم تعهدات مالی', icon: <Calendar className="w-4 h-4" /> },
    { id: 'search' as const, label: 'جستجوی سراسری', icon: <Search className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="گزارش‌های پیشرفته هوش تجاری (BI)"
          description="استخراج انواع نمودارها، گزارش‌های تحلیل فروش، سوددهی، ارزش دارایی‌های انبار و تقویم نقدینگی"
          icon={<BarChart3 className="w-6 h-6" />}
        />
      </div>

      {/* Segmented top navigation tabs */}
      <div className="flex items-center overflow-x-auto gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
        {tabsConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Reports Filter (Shows on Sales and Purchases only) */}
      {(activeTab === 'sales' || activeTab === 'purchases') && (
        <ReportsFilter
          parties={parties}
          showPartySelect={activeTab === 'sales' ? 'customer' : 'supplier'}
          onFilterChange={(newFilters) => setFilters(newFilters)}
        />
      )}

      {/* Main reporting view container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs font-semibold">در حال استخراج و تحلیل داده‌های مالی...</span>
        </div>
      ) : (
        <div className="animate-in fade-in-50 duration-150">
          {activeTab === 'sales' && (
            <SalesReportView 
              data={salesData} 
              onPrint={handlePrint} 
              onExportCSV={handleExportCSV} 
            />
          )}

          {activeTab === 'purchases' && (
            <PurchaseReportView 
              data={purchaseData} 
              onPrint={handlePrint} 
              onExportCSV={handleExportCSV} 
            />
          )}

          {activeTab === 'customers' && (
            <CustomerSupplierAnalytics 
              customers={customersData} 
              suppliers={suppliersData} 
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryAnalyticsView 
              data={inventoryData} 
            />
          )}

          {activeTab === 'treasury' && (
            <TreasuryAnalyticsView 
              data={treasuryData} 
            />
          )}

          {activeTab === 'commitments' && currentBusiness && (
            <CommitmentsScheduler 
              businessId={currentBusiness.id} 
              onRefresh={fetchReportData} 
            />
          )}

          {activeTab === 'search' && currentBusiness && (
            <GlobalSearchView 
              businessId={currentBusiness.id} 
            />
          )}
        </div>
      )}
    </div>
  );
}
export default ReportsPage;
