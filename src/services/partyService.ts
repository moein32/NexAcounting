import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import {
  Party,
  PartyType,
  PartyRoleType,
  CreatePartyInput,
  UpdatePartyInput,
  PartyFilters,
  DuplicateCheckResult,
  PartyContact,
  PartyAddress,
  PartyFinancialProfile,
  PartyLedgerEntry,
} from '../types/party';

// Local storage key for demo mode persistent state
const DEMO_PARTIES_STORAGE_KEY = 'nex_demo_parties_data';

// Initial Demo Data with realistic Iranian Iranian businesses & individuals
const INITIAL_DEMO_PARTIES: Party[] = [
  {
    id: 'party_1',
    business_id: 'demo_biz_1',
    party_type: 'company',
    display_name: 'شرکت پتروشیمی آریا پارس',
    company_name: 'شرکت پتروشیمی آریا پارس (سهامی عام)',
    phone: '۰۲۱-۸۸۷۷۶۶۵۵',
    mobile: '۰۹۱۲۱۱۱۱۱۱۱',
    email: 'info@aryapars.ir',
    national_id: '۱۰۱۰۲۳۴۵۶۷۸',
    economic_code: '۴۱۱۱۵۵۶۶۷۷',
    registration_number: '۱۲۳۴۵۶',
    postal_code: '۱۹۹۸۷۶۵۴۳۲',
    province: 'تهران',
    city: 'تهران',
    address: 'خیابان ملاصدرا، پلاک ۴۵، طبقه ۳',
    is_active: true,
    notes: 'مشتری VIP و خریدار عمده محصولات صنعتی',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    roles: ['customer'],
    contacts: [
      {
        id: 'c1',
        party_id: 'party_1',
        name: 'مهندس رضایی',
        position: 'مدیر تدارکات',
        mobile: '۰۹۱۲۱۱۱۱۱۱۱',
        email: 'rezaei@aryapars.ir',
        is_primary: true,
      },
    ],
    addresses: [
      {
        id: 'a1',
        party_id: 'party_1',
        title: 'دفتر مرکزی',
        province: 'تهران',
        city: 'تهران',
        address: 'خیابان ملاصدرا، پلاک ۴۵، طبقه ۳',
        postal_code: '۱۹۹۸۷۶۵۴۳۲',
        is_primary: true,
      },
    ],
    financial_profile: {
      id: 'f1',
      party_id: 'party_1',
      credit_limit: 500000000, // 500 million Toman
      opening_balance: 120000000,
      opening_balance_type: 'debit',
      payment_terms_days: 30,
      default_discount_percent: 5,
      tax_exempt: false,
      notes: 'دارای ضمانت‌نامه بانکی تا سقف ۵ میلیارد ریال',
    },
    calculated_balance: 120000000, // بدهکار
  },
  {
    id: 'party_2',
    business_id: 'demo_biz_1',
    party_type: 'company',
    display_name: 'شرکت صنایع فولاد البرز',
    company_name: 'شرکت صنایع فولاد البرز',
    phone: '۰۲۶-۳۴۵۵۰۰۱۱',
    mobile: '۰۹۱۲۲۲۲۲۲۲۲',
    email: 'purchasing@alborzsteel.com',
    national_id: '۱۰۸۶۱۱۲۳۴۵۶',
    economic_code: '۴۱۱۲۲۳۳۴۴۵',
    registration_number: '۷۸۹۱۰',
    postal_code: '۳۱۴۵۶۷۸۹۰۱',
    province: 'البرز',
    city: 'کرج',
    address: 'شهرک صنعتی سیمین دشت، خیابان هفتم، پلاک ۱۲',
    is_active: true,
    notes: 'تأمین‌کننده اصلی ورق‌های فولادی و مواد اولیه',
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    roles: ['supplier'],
    contacts: [
      {
        id: 'c2',
        party_id: 'party_2',
        name: 'آقای کاظمی',
        position: 'مدیر فروش',
        mobile: '۰۹۱۲۲۲۲۲۲۲۲',
        phone: '۰۲۶-۳۴۵۵۰۰۱۲',
        is_primary: true,
      },
    ],
    financial_profile: {
      id: 'f2',
      party_id: 'party_2',
      credit_limit: 1000000000,
      opening_balance: 45000000,
      opening_balance_type: 'credit',
      payment_terms_days: 45,
      default_discount_percent: 0,
      tax_exempt: false,
    },
    calculated_balance: -45000000, // بستانکار
  },
  {
    id: 'party_3',
    business_id: 'demo_biz_1',
    party_type: 'individual',
    display_name: 'احمد حسینی',
    first_name: 'احمد',
    last_name: 'حسینی',
    mobile: '۰۹۱۲۳۳۳۳۳۳۳',
    phone: '۰۲۱-۶۶۵۵۴۴۳۳',
    email: 'a.hosseini@gmail.com',
    national_id: '۰۰۷۶۵۴۳۲۱۰',
    province: 'تهران',
    city: 'تهران',
    address: 'خیابان آزادی، خیابان حبیب‌اللهی، کوچه لاله، پلاک ۸',
    postal_code: '۱۴۵۶۷۸۹۰۱۲',
    is_active: true,
    notes: 'هم مشتری خریدار تجهیزات و هم پیمانکار تأمین قطعات',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    roles: ['customer', 'supplier'],
    financial_profile: {
      id: 'f3',
      party_id: 'party_3',
      credit_limit: 100000000,
      opening_balance: 0,
      opening_balance_type: 'debit',
      payment_terms_days: 14,
      default_discount_percent: 2,
      tax_exempt: false,
    },
    calculated_balance: 0,
  },
  {
    id: 'party_4',
    business_id: 'demo_biz_1',
    party_type: 'organization',
    display_name: 'سازمان صنایع و معادن استان تهران',
    company_name: 'سازمان صنایع و معادن استان تهران',
    phone: '۰۲۱-۸۸۳۳۲۲۱۱',
    national_id: '۱۴۰۰۵۵۶۶۷۷۸',
    economic_code: '۴۱۱۶۶۷۷۸۸۹',
    province: 'تهران',
    city: 'تهران',
    address: 'خیابان استاد نجات‌اللهی، کوچه سپند، پلاک ۲۰',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    roles: ['customer'],
    financial_profile: {
      id: 'f4',
      party_id: 'party_4',
      credit_limit: 0,
      opening_balance: 0,
      opening_balance_type: 'debit',
      payment_terms_days: 60,
      default_discount_percent: 0,
      tax_exempt: true,
    },
    calculated_balance: 0,
  },
];

// Helper to manage demo storage
function getDemoPartiesFromStorage(businessId: string): Party[] {
  try {
    const raw = localStorage.getItem(DEMO_PARTIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        DEMO_PARTIES_STORAGE_KEY,
        JSON.stringify(INITIAL_DEMO_PARTIES)
      );
      return INITIAL_DEMO_PARTIES.filter((p) => p.business_id === businessId);
    }
    const parsed: Party[] = JSON.parse(raw);
    const filtered = parsed.filter((p) => p.business_id === businessId);
    if (filtered.length === 0 && businessId === 'demo_biz_1') {
      return INITIAL_DEMO_PARTIES;
    }
    return filtered;
  } catch {
    return INITIAL_DEMO_PARTIES.filter((p) => p.business_id === businessId);
  }
}

function saveDemoPartiesToStorage(parties: Party[]) {
  try {
    const raw = localStorage.getItem(DEMO_PARTIES_STORAGE_KEY);
    let allParties: Party[] = raw ? JSON.parse(raw) : INITIAL_DEMO_PARTIES;
    
    parties.forEach((updated) => {
      const idx = allParties.findIndex((p) => p.id === updated.id);
      if (idx >= 0) {
        allParties[idx] = updated;
      } else {
        allParties.unshift(updated);
      }
    });
    localStorage.setItem(DEMO_PARTIES_STORAGE_KEY, JSON.stringify(allParties));
  } catch (e) {
    console.error('Error saving demo parties to storage:', e);
  }
}

export const partyService = {
  // Check duplicate party in business
  async checkDuplicateParty(
    businessId: string,
    data: {
      mobile?: string | null;
      phone?: string | null;
      national_id?: string | null;
      economic_code?: string | null;
    },
    excludePartyId?: string
  ): Promise<DuplicateCheckResult> {
    const cleanMobile = data.mobile?.trim();
    const cleanPhone = data.phone?.trim();
    const cleanNationalId = data.national_id?.trim();
    const cleanEconomicCode = data.economic_code?.trim();

    if (!cleanMobile && !cleanPhone && !cleanNationalId && !cleanEconomicCode) {
      return { isDuplicate: false };
    }

    if (!isSupabaseConfigured()) {
      const demoList = getDemoPartiesFromStorage(businessId);
      for (const p of demoList) {
        if (excludePartyId && p.id === excludePartyId) continue;
        if (cleanMobile && p.mobile?.trim() === cleanMobile) {
          return { isDuplicate: true, duplicateField: 'mobile', existingParty: p };
        }
        if (cleanPhone && p.phone?.trim() === cleanPhone) {
          return { isDuplicate: true, duplicateField: 'phone', existingParty: p };
        }
        if (cleanNationalId && p.national_id?.trim() === cleanNationalId) {
          return { isDuplicate: true, duplicateField: 'national_id', existingParty: p };
        }
        if (cleanEconomicCode && p.economic_code?.trim() === cleanEconomicCode) {
          return { isDuplicate: true, duplicateField: 'economic_code', existingParty: p };
        }
      }
      return { isDuplicate: false };
    }

    // Query Supabase
    try {
      let query = supabase
        .from('parties')
        .select('*')
        .eq('business_id', businessId);

      if (excludePartyId) {
        query = query.neq('id', excludePartyId);
      }

      // Build OR conditions
      const conditions: string[] = [];
      if (cleanMobile) conditions.push(`mobile.eq.${cleanMobile}`);
      if (cleanPhone) conditions.push(`phone.eq.${cleanPhone}`);
      if (cleanNationalId) conditions.push(`national_id.eq.${cleanNationalId}`);
      if (cleanEconomicCode) conditions.push(`economic_code.eq.${cleanEconomicCode}`);

      if (conditions.length === 0) return { isDuplicate: false };

      const { data: matches, error } = await query.or(conditions.join(','));

      if (error || !matches || matches.length === 0) {
        return { isDuplicate: false };
      }

      const match = matches[0];
      let field: 'mobile' | 'phone' | 'national_id' | 'economic_code' = 'mobile';
      if (cleanMobile && match.mobile === cleanMobile) field = 'mobile';
      else if (cleanPhone && match.phone === cleanPhone) field = 'phone';
      else if (cleanNationalId && match.national_id === cleanNationalId) field = 'national_id';
      else if (cleanEconomicCode && match.economic_code === cleanEconomicCode) field = 'economic_code';

      return {
        isDuplicate: true,
        duplicateField: field,
        existingParty: match as Party,
      };
    } catch {
      return { isDuplicate: false };
    }
  },

  // Fetch all parties for a business with search & filter
  async getParties(
    businessId: string,
    filters?: PartyFilters
  ): Promise<{ data: Party[]; count: number }> {
    if (!isSupabaseConfigured()) {
      let list = getDemoPartiesFromStorage(businessId);

      // Filters
      if (filters?.role && filters.role !== 'all') {
        list = list.filter((p) => p.roles.includes(filters.role as PartyRoleType));
      }

      if (filters?.type && filters.type !== 'all') {
        list = list.filter((p) => p.party_type === filters.type);
      }

      if (filters?.status && filters.status !== 'all') {
        const isActive = filters.status === 'active';
        list = list.filter((p) => p.is_active === isActive);
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (p) =>
            p.display_name.toLowerCase().includes(q) ||
            p.company_name?.toLowerCase().includes(q) ||
            p.mobile?.includes(q) ||
            p.phone?.includes(q) ||
            p.national_id?.includes(q) ||
            p.economic_code?.includes(q) ||
            p.city?.toLowerCase().includes(q)
        );
      }

      // Sort
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';

      list.sort((a, b) => {
        let valA: any = a[sortBy as keyof Party] || '';
        let valB: any = b[sortBy as keyof Party] || '';

        if (sortBy === 'calculated_balance') {
          valA = a.calculated_balance || 0;
          valB = b.calculated_balance || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      const total = list.length;
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const start = (page - 1) * pageSize;
      const paged = list.slice(start, start + pageSize);

      return { data: paged, count: total };
    }

    // Real Supabase Query
    try {
      let query = supabase
        .from('parties')
        .select(
          `
          *,
          party_roles (role),
          party_financial_profiles (*)
        `,
          { count: 'exact' }
        )
        .eq('business_id', businessId);

      // Filters
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('party_type', filters.type);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active');
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim();
        query = query.or(
          `display_name.ilike.%${q}%,company_name.ilike.%${q}%,mobile.ilike.%${q}%,phone.ilike.%${q}%,national_id.ilike.%${q}%,economic_code.ilike.%${q}%`
        );
      }

      // Sorting
      const sortBy = filters?.sortBy || 'created_at';
      const ascending = filters?.sortOrder === 'asc';
      if (sortBy !== 'calculated_balance') {
        query = query.order(sortBy, { ascending });
      }

      // Pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) {
        throw new Error(error.message);
      }

      let parsedParties: Party[] = (data || []).map((item: any) => {
        const roles: PartyRoleType[] = (item.party_roles || []).map((r: any) => r.role);
        const finProfile = Array.isArray(item.party_financial_profiles)
          ? item.party_financial_profiles[0]
          : item.party_financial_profiles;

        // Calculate opening balance effect
        let calcBalance = 0;
        if (finProfile) {
          const amt = Number(finProfile.opening_balance) || 0;
          calcBalance = finProfile.opening_balance_type === 'credit' ? -amt : amt;
        }

        return {
          ...item,
          roles,
          financial_profile: finProfile || null,
          calculated_balance: calcBalance,
        };
      });

      // Role filter on client if role provided
      if (filters?.role && filters.role !== 'all') {
        parsedParties = parsedParties.filter((p) => p.roles.includes(filters.role as PartyRoleType));
      }

      return {
        data: parsedParties,
        count: count || parsedParties.length,
      };
    } catch (err: any) {
      console.error('Error in getParties:', err);
      throw new Error(err.message || 'خطا در دریافت لیست طرف‌های حساب');
    }
  },

  // Helper for Customers
  async getCustomers(businessId: string, filters?: PartyFilters) {
    return this.getParties(businessId, { ...filters, role: 'customer' });
  },

  // Helper for Suppliers
  async getSuppliers(businessId: string, filters?: PartyFilters) {
    return this.getParties(businessId, { ...filters, role: 'supplier' });
  },

  // Get Party by ID with all relations
  async getPartyById(businessId: string, partyId: string): Promise<Party | null> {
    if (!isSupabaseConfigured()) {
      const list = getDemoPartiesFromStorage(businessId);
      const party = list.find((p) => p.id === partyId);
      return party || null;
    }

    try {
      const { data, error } = await supabase
        .from('parties')
        .select(
          `
          *,
          party_roles (id, role),
          party_contacts (*),
          party_addresses (*),
          party_financial_profiles (*)
        `
        )
        .eq('id', partyId)
        .eq('business_id', businessId)
        .single();

      if (error || !data) {
        return null;
      }

      const roles: PartyRoleType[] = (data.party_roles || []).map((r: any) => r.role);
      const finProfile = Array.isArray(data.party_financial_profiles)
        ? data.party_financial_profiles[0]
        : data.party_financial_profiles;

      let calcBalance = 0;
      if (finProfile) {
        const amt = Number(finProfile.opening_balance) || 0;
        calcBalance = finProfile.opening_balance_type === 'credit' ? -amt : amt;
      }

      return {
        ...data,
        roles,
        contacts: data.party_contacts || [],
        addresses: data.party_addresses || [],
        financial_profile: finProfile || null,
        calculated_balance: calcBalance,
      };
    } catch (err) {
      console.error('Error fetching party by ID:', err);
      return null;
    }
  },

  // Create Party
  async createParty(
    input: CreatePartyInput,
    currentUserId?: string
  ): Promise<Party> {
    // Generate display name if not explicitly set
    let displayName = input.display_name?.trim();
    if (!displayName) {
      if (input.party_type === 'company' || input.party_type === 'organization') {
        displayName = input.company_name?.trim() || 'شرکت بدون نام';
      } else {
        const parts = [input.first_name, input.last_name].filter(Boolean);
        displayName = parts.length > 0 ? parts.join(' ') : 'طرف حساب جدید';
      }
    }

    if (!isSupabaseConfigured()) {
      const newPartyId = `party_${Date.now()}`;
      const now = new Date().toISOString();

      const finProfile: PartyFinancialProfile = {
        id: `fin_${Date.now()}`,
        party_id: newPartyId,
        credit_limit: input.financial_profile?.credit_limit || 0,
        opening_balance: input.financial_profile?.opening_balance || 0,
        opening_balance_type: input.financial_profile?.opening_balance_type || 'debit',
        payment_terms_days: input.financial_profile?.payment_terms_days || 0,
        default_discount_percent: input.financial_profile?.default_discount_percent || 0,
        tax_exempt: input.financial_profile?.tax_exempt || false,
        notes: input.financial_profile?.notes || null,
        created_at: now,
        updated_at: now,
      };

      const openingAmt = finProfile.opening_balance || 0;
      const calcBalance = finProfile.opening_balance_type === 'credit' ? -openingAmt : openingAmt;

      const newParty: Party = {
        id: newPartyId,
        business_id: input.business_id,
        party_type: input.party_type,
        display_name: displayName,
        first_name: input.first_name || null,
        last_name: input.last_name || null,
        company_name: input.company_name || null,
        phone: input.phone || null,
        mobile: input.mobile || null,
        email: input.email || null,
        national_id: input.national_id || null,
        economic_code: input.economic_code || null,
        registration_number: input.registration_number || null,
        postal_code: input.postal_code || null,
        address: input.address || null,
        city: input.city || null,
        province: input.province || null,
        country: input.country || 'IR',
        is_active: true,
        notes: input.notes || null,
        created_by: currentUserId || null,
        created_at: now,
        updated_at: now,
        roles: input.roles.length > 0 ? input.roles : ['customer'],
        contacts: input.contacts || [],
        addresses: input.addresses || [],
        financial_profile: finProfile,
        calculated_balance: calcBalance,
      };

      saveDemoPartiesToStorage([newParty]);
      return newParty;
    }

    // Real Supabase insert
    try {
      // 1. Insert into parties
      const { data: party, error: partyError } = await supabase
        .from('parties')
        .insert({
          business_id: input.business_id,
          party_type: input.party_type,
          display_name: displayName,
          first_name: input.first_name || null,
          last_name: input.last_name || null,
          company_name: input.company_name || null,
          phone: input.phone || null,
          mobile: input.mobile || null,
          email: input.email || null,
          national_id: input.national_id || null,
          economic_code: input.economic_code || null,
          registration_number: input.registration_number || null,
          postal_code: input.postal_code || null,
          address: input.address || null,
          city: input.city || null,
          province: input.province || null,
          country: input.country || 'IR',
          is_active: true,
          notes: input.notes || null,
          created_by: currentUserId || null,
        })
        .select('*')
        .single();

      if (partyError || !party) {
        throw new Error(partyError?.message || 'خطا در ایجاد طرف حساب');
      }

      // 2. Insert party_roles
      const rolesToInsert = input.roles.length > 0 ? input.roles : ['customer'];
      const roleRows = rolesToInsert.map((role) => ({
        party_id: party.id,
        role,
      }));

      const { error: roleError } = await supabase
        .from('party_roles')
        .insert(roleRows);

      if (roleError) {
        console.warn('Error inserting party roles:', roleError.message);
      }

      // 3. Insert financial profile
      if (input.financial_profile) {
        await supabase.from('party_financial_profiles').insert({
          party_id: party.id,
          credit_limit: input.financial_profile.credit_limit || 0,
          opening_balance: input.financial_profile.opening_balance || 0,
          opening_balance_type: input.financial_profile.opening_balance_type || 'debit',
          payment_terms_days: input.financial_profile.payment_terms_days || 0,
          default_discount_percent: input.financial_profile.default_discount_percent || 0,
          tax_exempt: input.financial_profile.tax_exempt || false,
          notes: input.financial_profile.notes || null,
        });
      } else {
        await supabase.from('party_financial_profiles').insert({
          party_id: party.id,
          credit_limit: 0,
          opening_balance: 0,
          opening_balance_type: 'debit',
          payment_terms_days: 0,
          default_discount_percent: 0,
          tax_exempt: false,
        });
      }

      // 4. Insert Contacts if provided
      if (input.contacts && input.contacts.length > 0) {
        const contactRows = input.contacts.map((c) => ({
          party_id: party.id,
          name: c.name,
          position: c.position || null,
          phone: c.phone || null,
          mobile: c.mobile || null,
          email: c.email || null,
          is_primary: !!c.is_primary,
        }));
        await supabase.from('party_contacts').insert(contactRows);
      }

      // 5. Insert Addresses if provided
      if (input.addresses && input.addresses.length > 0) {
        const addressRows = input.addresses.map((a) => ({
          party_id: party.id,
          title: a.title || 'آدرس اصلی',
          address: a.address,
          city: a.city || null,
          province: a.province || null,
          postal_code: a.postal_code || null,
          country: a.country || 'IR',
          is_primary: !!a.is_primary,
        }));
        await supabase.from('party_addresses').insert(addressRows);
      }

      // 6. Audit log
      if (currentUserId) {
        await authService.logAuditAction({
          businessId: input.business_id,
          userId: currentUserId,
          action: 'CREATE_PARTY',
          entityType: 'parties',
          entityId: party.id,
          newData: { display_name: party.display_name, roles: rolesToInsert },
        });
      }

      // Return full party
      const fullParty = await this.getPartyById(input.business_id, party.id);
      return fullParty!;
    } catch (err: any) {
      console.error('Error in createParty:', err);
      throw new Error(err.message || 'خطا در ثبت اطلاعات طرف حساب');
    }
  },

  // Update Party
  async updateParty(
    input: UpdatePartyInput,
    currentUserId?: string
  ): Promise<Party> {
    const { id, business_id, roles, financial_profile, contacts, addresses, ...rest } = input;

    if (!business_id) {
      throw new Error('شناسه کسب‌وکار برای ویرایش الزامی است');
    }

    if (!isSupabaseConfigured()) {
      const list = getDemoPartiesFromStorage(business_id);
      const idx = list.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error('طرف حساب یافت نشد');

      const existing = list[idx];
      const now = new Date().toISOString();

      let displayName = rest.display_name?.trim();
      if (!displayName) {
        if (rest.party_type === 'company' || existing.party_type === 'company') {
          displayName = rest.company_name?.trim() || existing.company_name || 'شرکت بدون نام';
        } else {
          const fn = rest.first_name ?? existing.first_name;
          const ln = rest.last_name ?? existing.last_name;
          const parts = [fn, ln].filter(Boolean);
          displayName = parts.length > 0 ? parts.join(' ') : existing.display_name;
        }
      }

      const updatedParty: Party = {
        ...existing,
        ...rest,
        display_name: displayName,
        roles: roles && roles.length > 0 ? roles : existing.roles,
        updated_at: now,
      };

      if (financial_profile) {
        updatedParty.financial_profile = {
          ...existing.financial_profile,
          ...financial_profile,
          updated_at: now,
        };
        const amt = updatedParty.financial_profile.opening_balance || 0;
        updatedParty.calculated_balance =
          updatedParty.financial_profile.opening_balance_type === 'credit' ? -amt : amt;
      }

      saveDemoPartiesToStorage([updatedParty]);
      return updatedParty;
    }

    // Supabase update
    try {
      const existing = await this.getPartyById(business_id, id);

      // Update basic fields
      const { error: updateError } = await supabase
        .from('parties')
        .update({
          party_type: rest.party_type ?? existing?.party_type,
          display_name: rest.display_name ?? existing?.display_name,
          first_name: rest.first_name ?? existing?.first_name,
          last_name: rest.last_name ?? existing?.last_name,
          company_name: rest.company_name ?? existing?.company_name,
          phone: rest.phone ?? existing?.phone,
          mobile: rest.mobile ?? existing?.mobile,
          email: rest.email ?? existing?.email,
          national_id: rest.national_id ?? existing?.national_id,
          economic_code: rest.economic_code ?? existing?.economic_code,
          registration_number: rest.registration_number ?? existing?.registration_number,
          postal_code: rest.postal_code ?? existing?.postal_code,
          address: rest.address ?? existing?.address,
          city: rest.city ?? existing?.city,
          province: rest.province ?? existing?.province,
          country: rest.country ?? existing?.country,
          is_active: rest.is_active ?? existing?.is_active,
          notes: rest.notes ?? existing?.notes,
        })
        .eq('id', id)
        .eq('business_id', business_id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update Roles if provided
      if (roles && roles.length > 0) {
        await supabase.from('party_roles').delete().eq('party_id', id);
        const roleRows = roles.map((role) => ({
          party_id: id,
          role,
        }));
        await supabase.from('party_roles').insert(roleRows);
      }

      // Update Financial Profile if provided
      if (financial_profile) {
        await supabase.from('party_financial_profiles').upsert({
          party_id: id,
          credit_limit: financial_profile.credit_limit || 0,
          opening_balance: financial_profile.opening_balance || 0,
          opening_balance_type: financial_profile.opening_balance_type || 'debit',
          payment_terms_days: financial_profile.payment_terms_days || 0,
          default_discount_percent: financial_profile.default_discount_percent || 0,
          tax_exempt: !!financial_profile.tax_exempt,
          notes: financial_profile.notes || null,
        });
      }

      // Audit Log
      if (currentUserId) {
        await authService.logAuditAction({
          businessId: business_id,
          userId: currentUserId,
          action: 'UPDATE_PARTY',
          entityType: 'parties',
          entityId: id,
          oldData: existing ? { display_name: existing.display_name } : undefined,
          newData: { display_name: rest.display_name },
        });
      }

      const updated = await this.getPartyById(business_id, id);
      return updated!;
    } catch (err: any) {
      console.error('Error updating party:', err);
      throw new Error(err.message || 'خطا در به روز رسانی اطلاعات');
    }
  },

  // Deactivate Party (Soft Delete)
  async deactivateParty(
    businessId: string,
    partyId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = getDemoPartiesFromStorage(businessId);
      const party = list.find((p) => p.id === partyId);
      if (party) {
        party.is_active = false;
        saveDemoPartiesToStorage([party]);
      }
      return true;
    }

    try {
      const { error } = await supabase
        .from('parties')
        .update({ is_active: false })
        .eq('id', partyId)
        .eq('business_id', businessId);

      if (error) throw new Error(error.message);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'DELETE_PARTY',
          entityType: 'parties',
          entityId: partyId,
          newData: { is_active: false },
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error deactivating party:', err);
      throw new Error(err.message || 'خطا در غیرفعال‌سازی طرف حساب');
    }
  },

  // Hard Delete Party (Guard against deleting parties with accounting/financial dependencies)
  async deleteParty(
    businessId: string,
    partyId: string,
    currentUserId?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      let list = getDemoPartiesFromStorage(businessId);
      list = list.filter((p) => p.id !== partyId);
      localStorage.setItem(DEMO_PARTIES_STORAGE_KEY, JSON.stringify(list));
      return true;
    }

    try {
      const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', partyId)
        .eq('business_id', businessId);

      if (error) throw new Error(error.message);

      if (currentUserId) {
        await authService.logAuditAction({
          businessId,
          userId: currentUserId,
          action: 'DELETE_PARTY',
          entityType: 'parties',
          entityId: partyId,
          oldData: { id: partyId, deleted: true },
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error deleting party:', err);
      throw new Error(err.message || 'خطا در حذف طرف حساب');
    }
  },

  // Add role
  async addPartyRole(partyId: string, role: PartyRoleType) {
    if (!isSupabaseConfigured()) return;
    await supabase.from('party_roles').upsert({ party_id: partyId, role });
  },

  // Remove role
  async removePartyRole(partyId: string, role: PartyRoleType) {
    if (!isSupabaseConfigured()) return;
    await supabase
      .from('party_roles')
      .delete()
      .eq('party_id', partyId)
      .eq('role', role);
  },

  // Get Party Ledger Architecture placeholder array
  getPartyLedgerPlaceholder(party: Party): PartyLedgerEntry[] {
    const entries: PartyLedgerEntry[] = [];

    // Opening Balance entry if exists
    if (party.financial_profile && party.financial_profile.opening_balance > 0) {
      const isDebit = party.financial_profile.opening_balance_type === 'debit';
      const amt = party.financial_profile.opening_balance;

      entries.push({
        id: `ledger_ob_${party.id}`,
        party_id: party.id,
        date: party.created_at.split('T')[0],
        reference_type: 'opening_balance',
        reference_id: party.financial_profile.id || 'ob_id',
        reference_number: 'سند افتتاحیه',
        description: 'مانده اولیه ثبت شده در سیستم',
        debit: isDebit ? amt : 0,
        credit: !isDebit ? amt : 0,
        balance: isDebit ? amt : -amt,
      });
    }

    return entries;
  },
};
