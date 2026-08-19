import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { partyService } from '../../../services/partyService';
import { useAuthStore } from '../../../stores/authStore';
import { Party, PartyLedgerEntry } from '../../../types/party';
import { PartyTypeBadge, PartyRoleBadge } from '../components/PartyBadge';
import { PartyBalanceBadge } from '../components/PartyBalanceBadge';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../../components/ui/Table';
import { LoadingState } from '../../../components/ui/LoadingState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { showToast } from '../../../components/ui/Toast';
import { formatCurrency } from '../../../lib/utils';
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  BookOpen,
  ShoppingBag,
  Truck,
  Receipt,
  Wallet,
  Edit,
  Power,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBusiness, user, hasPermission } = useAuthStore();

  const [party, setParty] = useState<Party | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<PartyLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Deactivate modal
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    async function loadPartyData() {
      if (!currentBusiness || !id) return;
      setIsLoading(true);
      try {
        const data = await partyService.getPartyById(currentBusiness.id, id);
        if (data) {
          setParty(data);
          const entries = partyService.getPartyLedgerPlaceholder(data);
          setLedgerEntries(entries);
        }
      } catch (err: any) {
        showToast.error(err.message || 'خطا در دریافت اطلاعات طرف حساب');
      } finally {
        setIsLoading(false);
      }
    }
    loadPartyData();
  }, [currentBusiness, id]);

  const handleToggleActive = async () => {
    if (!party || !currentBusiness) return;
    setIsDeactivating(true);

    try {
      if (party.is_active) {
        await partyService.deactivateParty(currentBusiness.id, party.id, user?.id);
        showToast.success('طرف حساب غیرفعال شد');
      } else {
        await partyService.updateParty({ id: party.id, business_id: currentBusiness.id, is_active: true }, user?.id);
        showToast.success('طرف حساب مجدداً فعال گردید');
      }
      const updated = await partyService.getPartyById(currentBusiness.id, party.id);
      if (updated) setParty(updated);
      setIsDeactivateOpen(false);
    } catch (err: any) {
      showToast.error(err.message || 'خطا در تغییر وضعیت');
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="در حال بارگیری پروفایل طرف حساب..." />;
  }

  if (!party) {
    return (
      <Card className="p-8">
        <EmptyState
          title="پروفایل طرف حساب پیدا نشد"
          description="ممکن است این طرف حساب حذف شده یا دسترسی به آن امکان‌پذیر نباشد."
          icon={<User className="w-10 h-10 text-slate-400" />}
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/parties')}>
              بازگشت به لیست طرف‌های حساب
            </Button>
          }
        />
      </Card>
    );
  }

  const detailTabs: TabItem[] = [
    { id: 'overview', label: 'اطلاعات کلی', icon: <FileText className="w-4 h-4" /> },
    { id: 'contacts', label: 'رابطین و مدیران', icon: <Phone className="w-4 h-4" />, badge: party.contacts?.length || 0 },
    { id: 'addresses', label: 'آدرس‌ها', icon: <MapPin className="w-4 h-4" />, badge: party.addresses?.length || 0 },
    { id: 'financial', label: 'تنظیمات مالی', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'ledger', label: 'دفتر معین (Ledger)', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'sales', label: 'فاکتورهای فروش', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'purchases', label: 'فاکتورهای خرید', icon: <Truck className="w-4 h-4" /> },
    { id: 'payments', label: 'دریافت و پرداخت', icon: <Receipt className="w-4 h-4" /> },
    { id: 'checks', label: 'چک‌ها', icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Page Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/parties')}
        >
          بازگشت به فهرست
        </Button>
      </div>

      {/* Profile Main Header Card */}
      <Card className="p-6 bg-slate-900 text-white border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <PartyTypeBadge type={party.party_type} />
              {party.roles?.map((r) => (
                <PartyRoleBadge key={r} role={r} />
              ))}
              <Badge variant={party.is_active ? 'success' : 'neutral'} size="sm">
                {party.is_active ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>

            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              {party.party_type === 'company' || party.party_type === 'organization' ? (
                <Building2 className="w-6 h-6 text-blue-400" />
              ) : (
                <User className="w-6 h-6 text-blue-400" />
              )}
              <span>{party.display_name}</span>
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-1">
              {party.mobile && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>موبایل: {party.mobile}</span>
                </span>
              )}
              {party.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>تلفن: {party.phone}</span>
                </span>
              )}
              {party.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{party.province ? `${party.province}، ${party.city}` : party.city}</span>
                </span>
              )}
            </div>
          </div>

          {/* Balance & Header Actions */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="text-left bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block pb-1">مانده دفتر حساب فعلی:</span>
              <PartyBalanceBadge
                balance={party.calculated_balance}
                currency={currentBusiness?.currency}
              />
            </div>

            <div className="flex items-center gap-2">
              {hasPermission('parties.update') && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit className="w-3.5 h-3.5" />}
                  onClick={() => navigate(`/parties/${party.id}/edit`)}
                  className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                >
                  ویرایش
                </Button>
              )}

              <Button
                variant={party.is_active ? 'ghost' : 'success'}
                size="sm"
                icon={<Power className="w-3.5 h-3.5" />}
                onClick={() => setIsDeactivateOpen(true)}
                className={party.is_active ? 'text-amber-400 hover:bg-slate-800' : ''}
              >
                {party.is_active ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Basic & Contact Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>اطلاعات اصلی و شناسه تجاری</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block pb-0.5">نام نمایشی:</span>
                  <strong className="text-slate-900 dark:text-white">{party.display_name}</strong>
                </div>

                {party.company_name && (
                  <div>
                    <span className="text-slate-500 block pb-0.5">نام کامل شرکت / سازمان:</span>
                    <strong className="text-slate-900 dark:text-white">{party.company_name}</strong>
                  </div>
                )}

                {party.first_name && (
                  <div>
                    <span className="text-slate-500 block pb-0.5">نام:</span>
                    <strong className="text-slate-900 dark:text-white">{party.first_name}</strong>
                  </div>
                )}

                {party.last_name && (
                  <div>
                    <span className="text-slate-500 block pb-0.5">نام خانوادگی:</span>
                    <strong className="text-slate-900 dark:text-white">{party.last_name}</strong>
                  </div>
                )}

                <div>
                  <span className="text-slate-500 block pb-0.5">کد / شناسه ملی:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{party.national_id || 'ثبت نشده'}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block pb-0.5">کد اقتصادی:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{party.economic_code || 'ثبت نشده'}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block pb-0.5">شماره ثبت:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{party.registration_number || 'ثبت نشده'}</strong>
                </div>

                <div>
                  <span className="text-slate-500 block pb-0.5">تاریخ ثبت در سیستم:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {new Date(party.created_at).toLocaleDateString('fa-IR')}
                  </strong>
                </div>
              </div>

              {party.notes && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 block pb-1 font-bold">یادداشت‌ها:</span>
                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg leading-relaxed">
                    {party.notes}
                  </p>
                </div>
              )}
            </Card>

            {/* Address & Primary Location */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>نشانی و اطلاعات تماس اصلی</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block pb-0.5">استان / شهر:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {party.province || party.city ? `${party.province || ''} - ${party.city || ''}` : 'ثبت نشده'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block pb-0.5">کد پستی:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{party.postal_code || 'ثبت نشده'}</strong>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-500 block pb-0.5">آدرس کامل:</span>
                  <strong className="text-slate-900 dark:text-white">{party.address || 'آدرسی ثبت نشده است'}</strong>
                </div>
              </div>
            </Card>
          </div>

          {/* Column 3: Financial Side Summary */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span>خلاصه وضعیت اعتباری و مالی</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg">
                  <span className="text-slate-300">سقف اعتبار نسیه:</span>
                  <strong className="font-bold text-amber-300">
                    {party.financial_profile?.credit_limit
                      ? formatCurrency(party.financial_profile.credit_limit, currentBusiness?.currency)
                      : 'بدون محدودیت'}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg">
                  <span className="text-slate-300">مانده اول دوره:</span>
                  <span className="font-mono font-bold">
                    {party.financial_profile?.opening_balance
                      ? `${formatCurrency(party.financial_profile.opening_balance, currentBusiness?.currency)} (${party.financial_profile.opening_balance_type === 'debit' ? 'بدهکار' : 'بستانکار'})`
                      : '۰'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg">
                  <span className="text-slate-300">مهلت تسویه فاکتور:</span>
                  <strong className="text-white">
                    {party.financial_profile?.payment_terms_days
                      ? `${party.financial_profile.payment_terms_days} روز`
                      : 'نقدی'}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg">
                  <span className="text-slate-300">تخفیف پیش‌فرض:</span>
                  <strong className="text-white">
                    {party.financial_profile?.default_discount_percent
                      ? `${party.financial_profile.default_discount_percent}٪`
                      : '۰٪'}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-lg">
                  <span className="text-slate-300">معافیت از مالیات:</span>
                  <Badge
                    variant={party.financial_profile?.tax_exempt ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {party.financial_profile?.tax_exempt ? 'معاف از ارزش افزوده' : 'مشمول ارزش افزوده'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CONTACTS */}
      {activeTab === 'contacts' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <span>لیست افراد رابط و مدیران</span>
          </h3>

          {!party.contacts || party.contacts.length === 0 ? (
            <EmptyState
              title="هیچ فرد رابطی ثبت نشده است"
              description="می‌توانید از طریق ویرایش طرف حساب، مدیران یا رابطین شرکت را اضافه نمایید."
              icon={<Phone className="w-8 h-8 text-slate-400" />}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>نام و نام خانوادگی</TableCell>
                  <TableCell isHeader>سمت / موقعیت</TableCell>
                  <TableCell isHeader>موبایل</TableCell>
                  <TableCell isHeader>تلفن ثابت</TableCell>
                  <TableCell isHeader>ایمیل</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {party.contacts?.map((c, i) => (
                  <TableRow key={c.id || i}>
                    <TableCell className="font-bold">{c.name}</TableCell>
                    <TableCell>{c.position || '—'}</TableCell>
                    <TableCell className="font-mono">{c.mobile || '—'}</TableCell>
                    <TableCell className="font-mono">{c.phone || '—'}</TableCell>
                    <TableCell className="font-mono">{c.email || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 3: ADDRESSES */}
      {activeTab === 'addresses' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>نشانی‌های ثبت شده جهت بارگیری و فاکتور</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600">آدرس اصلی و ثبتی</span>
                <Badge variant="primary" size="sm">اصلی</Badge>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200">
                {party.address || 'آدرسی ثبت نشده است'}
              </p>
              <div className="text-[11px] text-slate-500 pt-1 font-mono">
                استان/شهر: {party.province || '—'} / {party.city || '—'} | کد پستی: {party.postal_code || '—'}
              </div>
            </div>

            {party.addresses?.map((addr, i) => (
              <div key={addr.id || i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{addr.title || `آدرس فرعی ${i + 1}`}</span>
                <p className="text-xs text-slate-800 dark:text-slate-200">{addr.address}</p>
                <div className="text-[11px] text-slate-500 pt-1 font-mono">
                  کد پستی: {addr.postal_code || '—'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: FINANCIAL */}
      {activeTab === 'financial' && (
        <Card className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>تنظیمات اعتباری و پرونده مالی</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block">سقف اعتبار نسیه:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {party.financial_profile?.credit_limit
                    ? formatCurrency(party.financial_profile.credit_limit, currentBusiness?.currency)
                    : 'بدون محدودیت'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">مانده حساب اول دوره:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {party.financial_profile?.opening_balance
                    ? `${formatCurrency(party.financial_profile.opening_balance, currentBusiness?.currency)} (${party.financial_profile.opening_balance_type === 'debit' ? 'بدهکار' : 'بستانکار'})`
                    : '۰'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block">مهلت تسویه (روز):</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  {party.financial_profile?.payment_terms_days || 0} روز
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">وضعیت مالیات بر ارزش افزوده:</span>
                <Badge
                  variant={party.financial_profile?.tax_exempt ? 'success' : 'neutral'}
                  size="sm"
                >
                  {party.financial_profile?.tax_exempt ? 'معاف از مالیات' : 'مشمول مالیات ارزش افزوده'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: LEDGER ARCHITECTURE */}
      {activeTab === 'ledger' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>گردش حساب و دفتر معین (Party Ledger Architecture)</span>
            </h3>
            <span className="text-xs text-slate-500">
              واحد پول: {currentBusiness?.currency}
            </span>
          </div>

          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              معماری دفتر معین طرف حساب به صورت خودکار آماده شده است. با صدور فاکتورهای فروش، خرید، اسناد خزانه و چک در فازهای بعدی، تمامی ردیف‌های بدهکار و بستانکار در اینجا تجمیع می‌گردند.
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>تاریخ</TableCell>
                <TableCell isHeader>نوع سند</TableCell>
                <TableCell isHeader>شماره عطف</TableCell>
                <TableCell isHeader>شرح تراکنش</TableCell>
                <TableCell isHeader>بدهکار (+)</TableCell>
                <TableCell isHeader>بستانکار (-)</TableCell>
                <TableCell isHeader>مانده (تراز)</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">{entry.date}</TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {entry.reference_number}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{entry.reference_id}</TableCell>
                  <TableCell className="text-xs">{entry.description}</TableCell>
                  <TableCell className="font-mono font-bold text-rose-600">
                    {entry.debit > 0 ? formatCurrency(entry.debit, '') : '—'}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-emerald-600">
                    {entry.credit > 0 ? formatCurrency(entry.credit, '') : '—'}
                  </TableCell>
                  <TableCell className="font-mono font-bold">
                    {formatCurrency(Math.abs(entry.balance), '')} ({entry.balance >= 0 ? 'بدهکار' : 'بستانکار'})
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TABS 6-9: PLACEHOLDERS FOR SALES, PURCHASES, PAYMENTS, CHECKS */}
      {['sales', 'purchases', 'payments', 'checks'].includes(activeTab) && (
        <Card className="p-8">
          <EmptyState
            title={`ماژول ${
              activeTab === 'sales'
                ? 'فاکتورهای فروش'
                : activeTab === 'purchases'
                ? 'فاکتورهای خرید'
                : activeTab === 'payments'
                ? 'دریافت و پرداخت‌های خزانه'
                : 'چک‌های دریافتی و پرداختی'
            }`}
            description="این تب آماده اتصال به موتور عملیاتی در فاز مربوطه می‌باشد."
            icon={<Clock className="w-10 h-10 text-slate-400" />}
          />
        </Card>
      )}

      {/* Deactivate / Activate Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleToggleActive}
        title={party.is_active ? 'غیرفعال‌سازی طرف حساب' : 'فعال‌سازی مجدد طرف حساب'}
        description={
          party.is_active
            ? 'آیا از غیرفعال‌سازی این طرف حساب مطمئن هستید؟ امکان صدور فاکتور جدید برای او غیرفعال می‌شود.'
            : 'آیا می‌خواهید این طرف حساب را دوباره فعال نمایید؟'
        }
        confirmText={party.is_active ? 'غیرفعال کن' : 'فعال کن'}
        isLoading={isDeactivating}
        variant={party.is_active ? 'warning' : 'primary'}
      />
    </div>
  );
}
