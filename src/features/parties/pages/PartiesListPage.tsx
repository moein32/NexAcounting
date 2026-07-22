import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { partyService } from '../../../services/partyService';
import { useAuthStore } from '../../../stores/authStore';
import { Party, PartyRoleType, PartyType, PartyFilters } from '../../../types/party';
import { PartyTypeBadge, PartyRoleBadge } from '../components/PartyBadge';
import { PartyBalanceBadge } from '../components/PartyBalanceBadge';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Dropdown } from '../../../components/ui/Dropdown';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { LoadingState } from '../../../components/ui/LoadingState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Dialog } from '../../../components/ui/Dialog';
import { showToast } from '../../../components/ui/Toast';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Eye,
  Edit,
  Power,
  Trash2,
  Phone,
  Building2,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  FileSpreadsheet,
} from 'lucide-react';

interface PartiesListPageProps {
  fixedRoleFilter?: PartyRoleType;
  pageTitle?: string;
  pageDescription?: string;
}

export function PartiesListPage({
  fixedRoleFilter,
  pageTitle = 'مدیریت طرف‌های حساب',
  pageDescription = 'فهرست مشتریان، تأمین‌کنندگان و سایر طرف‌های حساب تجاری',
}: PartiesListPageProps) {
  const navigate = useNavigate();
  const { currentBusiness, user, hasPermission } = useAuthStore();

  const [parties, setParties] = useState<Party[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<PartyRoleType | 'all'>(fixedRoleFilter || 'all');
  const [typeFilter, setTypeFilter] = useState<PartyType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Deactivation dialog state
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Import / Export Placeholder Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const loadParties = useCallback(async () => {
    if (!currentBusiness) return;
    setIsLoading(true);

    try {
      const filters: PartyFilters = {
        search: searchQuery,
        role: fixedRoleFilter || roleFilter,
        type: typeFilter,
        status: statusFilter,
        page: currentPage,
        pageSize,
      };

      const result = await partyService.getParties(currentBusiness.id, filters);
      setParties(result.data);
      setTotalCount(result.count);
    } catch (err: any) {
      showToast.error(err.message || 'خطا در بارگیری اطلاعات طرف‌های حساب');
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness, searchQuery, fixedRoleFilter, roleFilter, typeFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  const handleDeactivate = async () => {
    if (!deactivateId || !currentBusiness) return;
    setIsDeactivating(true);

    try {
      await partyService.deactivateParty(currentBusiness.id, deactivateId, user?.id);
      showToast.success('وضعیت طرف حساب به غیرفعال تغییر یافت');
      setDeactivateId(null);
      loadParties();
    } catch (err: any) {
      showToast.error(err.message || 'خطا در غیرفعال‌سازی');
    } finally {
      setIsDeactivating(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        icon={<Users className="w-6 h-6 text-blue-600" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Import / Export UI Placeholders */}
            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="w-4 h-4 text-slate-500" />}
              onClick={() => setImportModalOpen(true)}
            >
              ورود از اکسل (Import)
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4 text-slate-500" />}
              onClick={() => setExportModalOpen(true)}
            >
              خروجی (Export)
            </Button>

            {hasPermission('parties.create') && (
              <Button
                variant="primary"
                size="sm"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => navigate('/parties/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                ثبت طرف حساب جدید
              </Button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="جستجو بر اساس نام، شرکت، موبایل، کد ملی..."
          />

          {!fixedRoleFilter && (
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'همه نقش‌ها (مشتری و تأمین‌کننده)' },
                { value: 'customer', label: 'فقط مشتریان' },
                { value: 'supplier', label: 'فقط تأمین‌کنندگان' },
              ]}
            />
          )}

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'همه انواع اشخاص' },
              { value: 'individual', label: 'حقیقی' },
              { value: 'company', label: 'حقوقی / شرکت' },
              { value: 'organization', label: 'سازمان / ارگان' },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            options={[
              { value: 'active', label: 'وضعیت: فعال' },
              { value: 'inactive', label: 'وضعیت: غیرفعال' },
              { value: 'all', label: 'وضعیت: همه' },
            ]}
          />
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState text="در حال بارگیری طرف‌های حساب..." />
      ) : parties.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="هیچ طرف حسابی یافت نشد"
            description="طرف حسابی با مشخصات یا فیلترهای جستجوی شما پیدا نشد."
            icon={<Users className="w-10 h-10 text-slate-400" />}
            action={
              hasPermission('parties.create') ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/parties/new')}
                  icon={<UserPlus className="w-4 h-4" />}
                >
                  ثبت طرف حساب جدید
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell isHeader>نام طرف حساب</TableCell>
                    <TableCell isHeader>نوع شخص</TableCell>
                    <TableCell isHeader>نقش</TableCell>
                    <TableCell isHeader>موبایل / تلفن</TableCell>
                    <TableCell isHeader>کد / شناسه ملی</TableCell>
                    <TableCell isHeader>شهر</TableCell>
                    <TableCell isHeader>مانده حساب</TableCell>
                    <TableCell isHeader>وضعیت</TableCell>

                    <TableCell isHeader className="text-left">
                      عملیات
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parties.map((party) => (
                    <TableRow key={party.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-bold text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{party.display_name}</span>
                          {party.company_name && party.party_type === 'individual' && (
                            <span className="text-[11px] font-normal text-slate-500">
                              {party.company_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <PartyTypeBadge type={party.party_type} />
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {party.roles.map((r) => (
                            <PartyRoleBadge key={r} role={r} />
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        <div className="flex flex-col">
                          <span>{party.mobile || '—'}</span>
                          {party.phone && (
                            <span className="text-[11px] text-slate-400">{party.phone}</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">
                        {party.national_id || '—'}
                      </TableCell>

                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {party.city || party.province || '—'}
                      </TableCell>

                      <TableCell>
                        <PartyBalanceBadge
                          balance={party.calculated_balance}
                          currency={currentBusiness?.currency}
                        />
                      </TableCell>

                      <TableCell>
                        <Badge variant={party.is_active ? 'success' : 'neutral'} size="sm">
                          {party.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-left">
                        <Dropdown
                          items={[
                            {
                              label: 'مشاهده پروفایل کامل',
                              icon: <Eye className="w-4 h-4 text-blue-600" />,
                              onClick: () => navigate(`/parties/${party.id}`),
                            },
                            {
                              label: 'ویرایش اطلاعات',
                              icon: <Edit className="w-4 h-4 text-amber-600" />,
                              onClick: () => navigate(`/parties/${party.id}/edit`),
                            },
                            {
                              label: party.is_active ? 'غیرفعال کردن' : 'فعال‌سازی',
                              icon: <Power className="w-4 h-4 text-slate-500" />,
                              onClick: () => setDeactivateId(party.id),
                            },
                          ]}
                        >
                          <Button variant="ghost" size="sm" icon={<MoreVertical className="w-4 h-4" />} />
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {parties.map((party) => (
              <Card key={party.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h4
                      onClick={() => navigate(`/parties/${party.id}`)}
                      className="text-sm font-black text-slate-900 dark:text-white cursor-pointer hover:text-blue-600"
                    >
                      {party.display_name}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <PartyTypeBadge type={party.party_type} />
                      {party.roles.map((r) => (
                        <PartyRoleBadge key={r} role={r} />
                      ))}
                    </div>
                  </div>

                  <PartyBalanceBadge
                    balance={party.calculated_balance}
                    currency={currentBusiness?.currency}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg">
                  <div>
                    موبایل: <span className="font-mono font-bold">{party.mobile || '—'}</span>
                  </div>
                  <div>
                    شهر: <span>{party.city || party.province || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <Badge variant={party.is_active ? 'success' : 'neutral'} size="sm">
                    {party.is_active ? 'فعال' : 'غیرفعال'}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => navigate(`/parties/${party.id}`)}
                    >
                      نمایش
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-3.5 h-3.5 text-amber-600" />}
                      onClick={() => navigate(`/parties/${party.id}/edit`)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              نمایش {parties.length} از {totalCount} طرف حساب
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                قبلی
              </Button>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                بعدی
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Deactivate Dialog */}
      <ConfirmDialog
        isOpen={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleDeactivate}
        title="غیرفعال‌سازی طرف حساب"
        description="آیا از غیرفعال‌سازی این طرف حساب اطمینان دارید؟ اطلاعات حذف نخواهند شد اما در صدور فاکتورهای جدید غیرفعال می‌گردد."
        confirmText="تأیید و غیرفعال‌سازی"
        isLoading={isDeactivating}
        variant="warning"
      />

      {/* UI Placeholder: Import Modal */}
      <Dialog
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="ورود گروهی طرف‌های حساب (Import)"
        icon={<Upload className="w-5 h-5 text-blue-600" />}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 text-xs text-blue-900 dark:text-blue-200">
            <p className="font-bold flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>قابلیت ورود اکسل آماده‌سازی شده است</span>
            </p>
            <p className="text-blue-800 dark:text-blue-300">
              در مراحل بعدی سیستم، می‌توانید فایل فایل اکسل استاندارد (مشتریان و تأمین‌کنندگان) را آپلود کرده و به صورت گروهی در پایگاه‌داده بارگذاری کنید.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(false)}>
              متوجه شدم
            </Button>
          </div>
        </div>
      </Dialog>

      {/* UI Placeholder: Export Modal */}
      <Dialog
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="گرفتن خروجی از دفتر طرف‌های حساب (Export)"
        icon={<Download className="w-5 h-5 text-blue-600" />}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
            <p className="font-bold flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>گزارش‌گیری اکسل و PDF</span>
            </p>
            <p className="text-emerald-800 dark:text-emerald-300">
              امکان دریافت فایل Excel و PDF دفتر مشتریان و تأمین‌کنندگان با فیلترهای فعال آماده اتصال به موتور گزارش‌گیری است.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setExportModalOpen(false)}>
              بستن
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
