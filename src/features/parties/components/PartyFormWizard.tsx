import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PartyType,
  PartyRoleType,
  CreatePartyInput,
  Party,
  PartyContact,
  PartyAddress,
} from '../../../types/party';
import { partyService } from '../../../services/partyService';
import { useAuthStore } from '../../../stores/authStore';
import { PartyDuplicateModal } from './PartyDuplicateModal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { showToast } from '../../../components/ui/Toast';
import {
  User,
  Building2,
  Landmark,
  HelpCircle,
  ShoppingCart,
  Truck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  FileText,
  MapPin,
  CreditCard,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface PartyFormWizardProps {
  initialData?: Party;
  isEditMode?: boolean;
}

const PROVINCES = [
  'تهران', 'البرز', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی',
  'خوزستان', 'مازندران', 'گیلان', 'کرمان', 'یزد', 'هرمزگان',
  'قزوین', 'قم', 'مرکزی', 'همدان', 'کرمانشاه', 'سایر استان‌ها',
];

export function PartyFormWizard({ initialData, isEditMode = false }: PartyFormWizardProps) {
  const navigate = useNavigate();
  const { currentBusiness, user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [partyType, setPartyType] = useState<PartyType>(initialData?.party_type || 'individual');
  const [roles, setRoles] = useState<PartyRoleType[]>(
    initialData?.roles || ['customer']
  );

  // Basic Info
  const [displayName, setDisplayName] = useState(initialData?.display_name || '');
  const [firstName, setFirstName] = useState(initialData?.first_name || '');
  const [lastName, setLastName] = useState(initialData?.last_name || '');
  const [companyName, setCompanyName] = useState(initialData?.company_name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [mobile, setMobile] = useState(initialData?.mobile || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [nationalId, setNationalId] = useState(initialData?.national_id || '');
  const [economicCode, setEconomicCode] = useState(initialData?.economic_code || '');
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registration_number || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Address
  const [province, setProvince] = useState(initialData?.province || 'تهران');
  const [city, setCity] = useState(initialData?.city || 'تهران');
  const [postalCode, setPostalCode] = useState(initialData?.postal_code || '');
  const [address, setAddress] = useState(initialData?.address || '');

  // Contacts List
  const [contacts, setContacts] = useState<PartyContact[]>(
    initialData?.contacts || []
  );

  // Financial Profile
  const [creditLimit, setCreditLimit] = useState<number>(
    initialData?.financial_profile?.credit_limit || 0
  );
  const [openingBalance, setOpeningBalance] = useState<number>(
    initialData?.financial_profile?.opening_balance || 0
  );
  const [openingBalanceType, setOpeningBalanceType] = useState<'debit' | 'credit'>(
    initialData?.financial_profile?.opening_balance_type || 'debit'
  );
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(
    initialData?.financial_profile?.payment_terms_days || 0
  );
  const [defaultDiscountPercent, setDefaultDiscountPercent] = useState<number>(
    initialData?.financial_profile?.default_discount_percent || 0
  );
  const [taxExempt, setTaxExempt] = useState<boolean>(
    initialData?.financial_profile?.tax_exempt || false
  );
  const [financialNotes, setFinancialNotes] = useState<string>(
    initialData?.financial_profile?.notes || ''
  );

  // Duplicate Modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    existingParty: Party | null;
    duplicateField?: 'mobile' | 'phone' | 'national_id' | 'economic_code';
  }>({ existingParty: null });

  // Auto update display name if user is filling first/last name or company name
  useEffect(() => {
    if (!isEditMode && (!displayName || displayName === 'طرف حساب جدید')) {
      if (partyType === 'company' || partyType === 'organization') {
        if (companyName) setDisplayName(companyName);
      } else {
        const full = [firstName, lastName].filter(Boolean).join(' ');
        if (full) setDisplayName(full);
      }
    }
  }, [firstName, lastName, companyName, partyType, isEditMode]);

  const toggleRole = (r: PartyRoleType) => {
    if (roles.includes(r)) {
      if (roles.length === 1) {
        showToast.warning('حداقل انتخاب یک نقش (مشتری یا تأمین‌کننده) الزامی است');
        return;
      }
      setRoles(roles.filter((role) => role !== r));
    } else {
      setRoles([...roles, r]);
    }
  };

  // Step 3 Validation
  const validateStep3 = (): boolean => {
    if (partyType === 'company' || partyType === 'organization') {
      if (!companyName.trim()) {
        showToast.error('لطفا نام شرکت یا سازمان را وارد نمایید');
        return false;
      }
    } else if (partyType === 'individual') {
      if (!firstName.trim() || !lastName.trim()) {
        showToast.error('وارد کردن نام و نام خانوادگی الزامی است');
        return false;
      }
    }

    if (mobile && !/^09\d{9}$/.test(mobile.replace(/\s+/g, ''))) {
      showToast.warning('فرمت شماره موبایل نامعتبر است (مثال: 09123456789)');
    }

    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (roles.length === 0) {
        showToast.error('لطفاً حداقل یک نقش انتخاب کنید');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFormSubmit = async (overrideDuplicate = false) => {
    if (!currentBusiness) {
      showToast.error('کسب‌وکار فعال انتخاب نشده است');
      return;
    }

    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }

    // Check duplicates first if not overriding
    if (!overrideDuplicate) {
      setIsSubmitting(true);
      try {
        const dupCheck = await partyService.checkDuplicateParty(
          currentBusiness.id,
          { mobile, phone, national_id: nationalId, economic_code: economicCode },
          initialData?.id
        );

        if (dupCheck.isDuplicate && dupCheck.existingParty) {
          setIsSubmitting(false);
          setDuplicateInfo({
            existingParty: dupCheck.existingParty,
            duplicateField: dupCheck.duplicateField,
          });
          setDuplicateModalOpen(true);
          return;
        }
      } catch (e) {
        console.warn('Duplicate check error:', e);
      }
    }

    setIsSubmitting(true);

    try {
      const computedDisplayName =
        displayName.trim() ||
        (partyType === 'company' || partyType === 'organization'
          ? companyName.trim()
          : `${firstName} ${lastName}`.trim()) ||
        'طرف حساب جدید';

      const payload: CreatePartyInput = {
        business_id: currentBusiness.id,
        party_type: partyType,
        roles,
        display_name: computedDisplayName,
        first_name: firstName || null,
        last_name: lastName || null,
        company_name: companyName || null,
        phone: phone || null,
        mobile: mobile || null,
        email: email || null,
        national_id: nationalId || null,
        economic_code: economicCode || null,
        registration_number: registrationNumber || null,
        province: province || null,
        city: city || null,
        postal_code: postalCode || null,
        address: address || null,
        notes: notes || null,
        contacts: contacts.filter((c) => c.name.trim()),
        financial_profile: {
          credit_limit: Number(creditLimit) || 0,
          opening_balance: Number(openingBalance) || 0,
          opening_balance_type: openingBalanceType,
          payment_terms_days: Number(paymentTermsDays) || 0,
          default_discount_percent: Number(defaultDiscountPercent) || 0,
          tax_exempt: taxExempt,
          notes: financialNotes || null,
        },
      };

      if (isEditMode && initialData) {
        await partyService.updateParty(
          { ...payload, id: initialData.id },
          user?.id
        );
        showToast.success('اطلاعات طرف حساب با موفقیت به روز شد');
        navigate(`/parties/${initialData.id}`);
      } else {
        const created = await partyService.createParty(payload, user?.id);
        showToast.success('طرف حساب جدید با موفقیت ثبت گردید');
        navigate(`/parties/${created.id}`);
      }
    } catch (err: any) {
      showToast.error(err.message || 'خطا در ثبت اطلاعات طرف حساب');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Contact Row
  const addContactRow = () => {
    setContacts([
      ...contacts,
      {
        id: `temp_${Date.now()}`,
        name: '',
        position: '',
        mobile: '',
        phone: '',
        email: '',
        is_primary: contacts.length === 0,
      },
    ]);
  };

  const removeContactRow = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContactRow = (index: number, field: keyof PartyContact, value: any) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Wizard Header Progress Bar */}
      <Card className="p-4 md:p-6 bg-slate-900 text-white border-slate-800 shadow-xl">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {[
            { step: 1, title: '۱. نوع شخص', icon: <User className="w-4 h-4" /> },
            { step: 2, title: '۲. نقش', icon: <ShoppingCart className="w-4 h-4" /> },
            { step: 3, title: '۳. اطلاعات پایه', icon: <FileText className="w-4 h-4" /> },
            { step: 4, title: '۴. آدرس و تماس', icon: <MapPin className="w-4 h-4" /> },
            { step: 5, title: '۵. مالی و اعتبار', icon: <CreditCard className="w-4 h-4" /> },
          ].map((item) => {
            const isCompleted = item.step < currentStep;
            const isCurrent = item.step === currentStep;

            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  if (item.step < currentStep || isEditMode) {
                    setCurrentStep(item.step);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md'
                    : isCompleted
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : item.icon}
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* STEP 1: PARTY TYPE */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>انتخاب نوع شخص طرف حساب</span>
            </h3>
            <p className="text-xs text-slate-500">
              مشخص کنید طرف حساب شما حقیقی، حقوقی، سازمان یا سایر است.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                id: 'individual' as PartyType,
                title: 'شخص حقیقی',
                desc: 'افراد مستقل، مشتریان شخصی، خریداران تک',
                icon: <User className="w-8 h-8 text-blue-600" />,
              },
              {
                id: 'company' as PartyType,
                title: 'شخص حقوقی / شرکت',
                desc: 'شرکت‌های خصوصی، سهامی، مسئولیت محدود',
                icon: <Building2 className="w-8 h-8 text-indigo-600" />,
              },
              {
                id: 'organization' as PartyType,
                title: 'سازمان / ارگان دولتی',
                desc: 'ادارات، سازمان‌ها، مؤسسات عمومی',
                icon: <Landmark className="w-8 h-8 text-emerald-600" />,
              },
              {
                id: 'other' as PartyType,
                title: 'سایر / متفرقه',
                desc: 'سایر حساب‌های متفرقه یا موقت',
                icon: <HelpCircle className="w-8 h-8 text-slate-600" />,
              },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setPartyType(item.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-3 ${
                  partyType === item.id
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xs">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 2: ROLES */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span>تعیین نقش در سیستم (مشتری / تأمین‌کننده)</span>
            </h3>
            <p className="text-xs text-slate-500">
              یک طرف حساب می‌تواند <strong>همزمان هم مشتری و هم تأمین‌کننده</strong> باشد تا از ثبت تکراری اطلاعات جلوگیری شود.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => toggleRole('customer')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                roles.includes('customer')
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="p-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 rounded-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    نقش مشتری (Customer)
                  </h4>
                  {roles.includes('customer') && (
                    <Badge variant="success" size="sm">انتخاب شده</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  امکان صدور فاکتور فروش، دریافت وجه، ثبت سفارش مشتری و دفتر حساب فروش.
                </p>
              </div>
            </div>

            <div
              onClick={() => toggleRole('supplier')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                roles.includes('supplier')
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="p-3 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    نقش تأمین‌کننده (Supplier)
                  </h4>
                  {roles.includes('supplier') && (
                    <Badge variant="warning" size="sm">انتخاب شده</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  امکان ثبت فاکتور خرید، پرداخت وجه، سفارشات انبار و دفتر حساب خریدهای شرکت.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              نکته: در صورت انتخاب هر دو نقش، تمامی تراکنش‌های خرید و فروش این شخص در یک پروفایل واحد تجمیع خواهد شد.
            </span>
          </div>
        </Card>
      )}

      {/* STEP 3: BASIC INFO */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>مشخصات شناسنامه‌ای و ثبتی</span>
            </h3>
            <p className="text-xs text-slate-500">
              اطلاعات اصلی جهت استفاده در اسناد و فاکتورهای رسمی/غیررسمی.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partyType === 'individual' ? (
              <>
                <Input
                  label="نام *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="مثال: علی"
                  required
                />
                <Input
                  label="نام خانوادگی *"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="مثال: محمدی"
                  required
                />
              </>
            ) : (
              <div className="md:col-span-2">
                <Input
                  label={partyType === 'organization' ? 'نام سازمان / ارگان *' : 'نام شرکت / مجموعه *'}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: شرکت صنایع فولاد ایران (سهامی خاص)"
                  required
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Input
                label="نام نمایشی در فاکتورها *"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="عنوان اصلی جهت جستجو و چاپ روی فاکتورها"
                helperText="این عنوان به طور خودکار از نام اشخاص یا شرکت تولید می‌شود، اما می‌توانید آن را تغییر دهید."
                required
              />
            </div>

            <Input
              label="شماره همراه (موبایل)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="09123456789"
              icon={<Phone className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="شماره تلفن ثابت"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02188990000"
              icon={<Phone className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label="پست الکترونیکی (ایمیل)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@example.com"
              icon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <Input
              label={partyType === 'individual' ? 'کد ملی' : 'شناسه ملی شرکت / سازمان'}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="10 رقمی یا 11 رقمی"
            />

            <Input
              label="کد اقتصادی"
              value={economicCode}
              onChange={(e) => setEconomicCode(e.target.value)}
              placeholder="کد اقتصادی 12 رقمی"
            />

            {partyType !== 'individual' && (
              <Input
                label="شماره ثبت شرکت"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="شماره ثبت رسمی"
              />
            )}
          </div>
        </Card>
      )}

      {/* STEP 4: ADDRESS & CONTACTS */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>نشانی، آدرس و رابط‌های اصلی</span>
            </h3>
            <p className="text-xs text-slate-500">
              ثبت آدرس جهت ارسال کالا، صدور فاکتور و معرفی افراد رابط شرکت.
            </p>
          </div>

          {/* Primary Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <Select
              label="استان"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              options={PROVINCES.map((p) => ({ value: p, label: p }))}
            />

            <Input
              label="شهر"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="مثال: تهران"
            />

            <Input
              label="کد پستی"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="۱۰ رقمی"
            />

            <div className="md:col-span-3">
              <Input
                label="آدرس کامل"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="خیابان، کوچه، پلاک، طبقه، واحد"
              />
            </div>
          </div>

          {/* Secondary Contacts List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                افراد رابط / مدیران مربوطه (اختیاری)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={addContactRow}
              >
                افزودن فرد رابط جدید
              </Button>
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                هیچ فرد رابطی هنوز اضافه نشده است. (مناسب برای شرکت‌های دارای چند مدیر خرید/فروش)
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact, idx) => (
                  <div
                    key={contact.id || idx}
                    className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-2 items-center"
                  >
                    <Input
                      placeholder="نام رابط *"
                      value={contact.name}
                      onChange={(e) => updateContactRow(idx, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="سمت (مثال: مدیر فروش)"
                      value={contact.position || ''}
                      onChange={(e) => updateContactRow(idx, 'position', e.target.value)}
                    />
                    <Input
                      placeholder="شماره موبایل"
                      value={contact.mobile || ''}
                      onChange={(e) => updateContactRow(idx, 'mobile', e.target.value)}
                    />
                    <Input
                      placeholder="ایمیل"
                      value={contact.email || ''}
                      onChange={(e) => updateContactRow(idx, 'email', e.target.value)}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContactRow(idx)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* STEP 5: FINANCIAL PROFILE */}
      {currentStep === 5 && (
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>تنظیمات مالی، سقف اعتبار و مانده اولیه</span>
            </h3>
            <p className="text-xs text-slate-500">
              اطلاعات اعتبار سنجی و مانده حساب اول دوره (قبل از شروع سیستم).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={`سقف اعتبار نسیه (${currentBusiness?.currency || 'تومان'})`}
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              placeholder="0 (بدون محدودیت)"
              helperText="حداکثر مبلغ مجاز بدهکاری این طرف حساب در فاکتورها"
            />

            <Input
              label="مهلت تسویه فاکتورها (به روز)"
              type="number"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
              placeholder="مثال: 30 روز"
            />

            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>مانده اول دوره (Opening Balance)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={`مبلغ مانده اول دوره (${currentBusiness?.currency || 'تومان'})`}
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  placeholder="0"
                />

                <Select
                  label="ماهیت مانده حساب اول دوره"
                  value={openingBalanceType}
                  onChange={(e) => setOpeningBalanceType(e.target.value as 'debit' | 'credit')}
                  options={[
                    { value: 'debit', label: 'بدهکار (این شخص به ما بدهکار است)' },
                    { value: 'credit', label: 'بستانکار (ما به این شخص بدهکاریم)' },
                  ]}
                />
              </div>
            </div>

            <Input
              label="درصد تخفیف پیش‌فرض روی فاکتورها"
              type="number"
              value={defaultDiscountPercent}
              onChange={(e) => setDefaultDiscountPercent(Number(e.target.value))}
              placeholder="0"
            />

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="taxExempt"
                checked={taxExempt}
                onChange={(e) => setTaxExempt(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="taxExempt" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                این طرف حساب معاف از مالیات بر ارزش افزوده است
              </label>
            </div>

            <div className="md:col-span-2">
              <Input
                label="توضیحات و یادداشت‌های عمومی"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="یادداشت‌های داخلی درباره رفتار مالی یا مشخصات کاربر..."
              />
            </div>
          </div>
        </Card>
      )}

      {/* WIZARD BOTTOM ACTIONS */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? () => navigate('/parties') : handlePrevStep}
          icon={<ChevronRight className="w-4 h-4" />}
        >
          {currentStep === 1 ? 'انصراف' : 'مرحله قبلی'}
        </Button>

        {currentStep < 5 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNextStep}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            گام بعدی
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            onClick={() => handleFormSubmit(false)}
            icon={<CheckCircle2 className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
          >
            {isEditMode ? 'ثبت تغییرات طرف حساب' : 'ایجاد و ثبت نهایی طرف حساب'}
          </Button>
        )}
      </div>

      {/* Duplicate Alert Modal */}
      <PartyDuplicateModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        onProceedAnyway={() => {
          setDuplicateModalOpen(false);
          handleFormSubmit(true);
        }}
        existingParty={duplicateInfo.existingParty}
        duplicateField={duplicateInfo.duplicateField}
      />
    </div>
  );
}
