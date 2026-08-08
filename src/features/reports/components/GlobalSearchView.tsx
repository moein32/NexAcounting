import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { formatCurrency, formatPersianDate } from '../../../lib/utils';
import { Search, User, Package, FileText, Landmark, CornerDownLeft, Loader2 } from 'lucide-react';
import { PartyRepository, ItemRepository, DocumentRepository } from '../../../repositories';
import { CheckRepository } from '../../../repositories/treasuryRepository';

interface GlobalSearchViewProps {
  businessId: string;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'party' | 'product' | 'invoice' | 'check';
  badge: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  metaValue?: string | number;
}

export function GlobalSearchView({ businessId }: GlobalSearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const formattedQuery = val.toLowerCase().trim();
      const tempResults: SearchResultItem[] = [];

      // 1. Indexed Search Parties (Customers & Suppliers)
      const partyMatches = PartyRepository.search(businessId, formattedQuery, 15);
      partyMatches.forEach(p => {
        const isCustomer = p.roles?.includes('customer');
        tempResults.push({
          id: p.id,
          title: p.name,
          subtitle: p.phone || p.email || 'بدون تلفن تماس',
          category: 'party',
          badge: isCustomer ? 'مشتری' : 'تامین‌کننده',
          badgeVariant: isCustomer ? 'success' : 'warning',
          metaValue: p.mobile || undefined
        });
      });

      // 2. Indexed Search Items (Products)
      const itemMatches = ItemRepository.search(businessId, formattedQuery, 15);
      itemMatches.forEach(item => {
        tempResults.push({
          id: item.id,
          title: item.name,
          subtitle: `کد کالا: ${item.code || 'PRD'} • قیمت فروش: ${formatCurrency(item.sale_price || 0, 'تومان')}`,
          category: 'product',
          badge: 'کالا / محصول',
          badgeVariant: 'primary',
          metaValue: item.purchase_price
        });
      });

      // 3. Indexed Search Documents (Invoices)
      const docMatches = DocumentRepository.search(businessId, formattedQuery, 15);
      docMatches.forEach(doc => {
        const isSales = doc.document_type === 'sales_invoice';
        tempResults.push({
          id: doc.id,
          title: `${isSales ? 'فاکتور فروش' : 'فاکتور خرید'} شماره ${doc.document_number}`,
          subtitle: `وضعیت: ${doc.payment_status === 'paid' ? 'تسویه کامل' : 'بدهکار'} • تاریخ: ${formatPersianDate(doc.document_date)}`,
          category: 'invoice',
          badge: isSales ? 'فاکتور فروش' : 'فاکتور خرید',
          badgeVariant: isSales ? 'success' : 'neutral',
          metaValue: doc.total_amount
        });
      });

      // 4. Search Checks
      const checks = CheckRepository.getAll(businessId);
      let checkMatches = 0;
      for (const check of checks) {
        if (checkMatches >= 10) break;
        if (
          check.check_number?.toLowerCase().includes(formattedQuery) ||
          check.bank_name?.toLowerCase().includes(formattedQuery)
        ) {
          const isReceived = check.type === 'received';
          tempResults.push({
            id: check.id,
            title: `چک شماره ${check.check_number}`,
            subtitle: `بانک: ${check.bank_name} • سررسید: ${formatPersianDate(check.due_date)}`,
            category: 'check',
            badge: isReceived ? 'چک دریافتی' : 'چک صادره',
            badgeVariant: isReceived ? 'primary' : 'danger',
            metaValue: check.amount
          });
          checkMatches++;
        }
      }

      setResults(tempResults);
    } catch (e) {
      console.error('Global search error', e);
    } finally {
      setSearching(false);
    }
  };

  const categoryIcons = {
    party: <User className="w-4 h-4 text-emerald-600" />,
    product: <Package className="w-4 h-4 text-blue-600" />,
    invoice: <FileText className="w-4 h-4 text-slate-600" />,
    check: <Landmark className="w-4 h-4 text-amber-600" />
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span>موتور جستجوی یکپارچه و هوشمند نکس حساب (Global Search)</span>
        </h2>
        <p className="text-[11px] text-slate-400 mt-1">جستجوی بلادرنگ در اطلاعات فاکتورها، طرف حساب‌ها، کالاها، حساب‌ها و اسناد تجاری</p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="شروع به نوشتن کنید... (حداقل دو کاراکتر از شماره فاکتور، نام مشتری، عنوان کالا، شماره چک و ...)"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full font-bold p-4 pr-12 rounded-2xl border-2 border-blue-100 dark:border-blue-900 focus:border-blue-500 focus:outline-none bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 shadow-sm transition-all"
        />
        {searching ? (
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin absolute right-4 top-4.5" />
        ) : (
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-4.5" />
        )}
      </div>

      {/* Results panel */}
      {query.trim().length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-500">
              نتایج یافت‌شده ({results.length} مورد)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {results.length > 0 ? (
                results.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-xs">
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                        {categoryIcons[item.category]}
                      </div>
                      <div className="space-y-1 truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{item.title}</span>
                          <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {item.metaValue && typeof item.metaValue === 'number' && (
                        <span className="font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.metaValue, 'تومان')}
                        </span>
                      )}
                      <CornerDownLeft className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <p className="font-semibold text-xs">هیچ رکوردی منطبق با عبارت جستجو پیدا نشد.</p>
                  <p className="text-[10px] text-slate-400 mt-1">املا یا کلمات کلیدی را مجدداً بررسی کنید.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
