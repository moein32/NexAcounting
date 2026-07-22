import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';
import { useAppStore } from './appStore';
import {
  Profile,
  Business,
  BusinessMember,
  Role,
  BusinessMemberWithDetails,
} from '../types/auth';

const STORAGE_ACTIVE_BUSINESS_KEY = 'nex_active_business_id';

interface AuthState {
  user: any | null;
  profile: Profile | null;
  session: any | null;
  currentBusiness: Business | null;
  currentMember: BusinessMember | null;
  currentRole: Role | null;
  permissions: string[];
  userMemberships: BusinessMemberWithDetails[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;

  // Methods
  initializeAuth: () => Promise<void>;
  signUp: (payload: {
    fullName: string;
    email: string;
    password: string;
    businessName: string;
  }) => Promise<void>;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  selectBusiness: (businessId: string) => void;
  createBusiness: (payload: {
    name: string;
    phone?: string;
    nationalId?: string;
    currency?: string;
  }) => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
  enableDemoMode: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  currentBusiness: null,
  currentMember: null,
  currentRole: null,
  permissions: [],
  userMemberships: [],
  isLoading: true,
  isAuthenticated: false,
  isDemoMode: !isSupabaseConfigured(),

  initializeAuth: async () => {
    set({ isLoading: true });

    if (!isSupabaseConfigured()) {
      console.info('Supabase credentials not set. Enabling Demo Mode fallback.');
      get().enableDemoMode();
      set({ isLoading: false });
      return;
    }

    try {
      const session = await authService.getSession();
      if (!session || !session.user) {
        set({
          user: null,
          profile: null,
          session: null,
          currentBusiness: null,
          currentMember: null,
          currentRole: null,
          permissions: [],
          userMemberships: [],
          isAuthenticated: false,
          isLoading: false,
          isDemoMode: false,
        });
        return;
      }

      const user = session.user;
      const profile = await authService.getProfile(user.id);
      const memberships = await authService.getUserMemberships(user.id);

      // Determine active business
      const savedBusinessId = localStorage.getItem(STORAGE_ACTIVE_BUSINESS_KEY);
      let activeMembership = memberships.find(
        (m) => m.business_id === savedBusinessId
      );

      if (!activeMembership && memberships.length > 0) {
        activeMembership = memberships[0];
      }

      const activeBusiness = activeMembership ? activeMembership.business : null;
      const activeRole = activeMembership ? activeMembership.role || null : null;
      const activePermissions = activeMembership ? activeMembership.permissions || [] : [];

      if (activeBusiness) {
        localStorage.setItem(STORAGE_ACTIVE_BUSINESS_KEY, activeBusiness.id);
      }

      set({
        user,
        profile: profile || {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'کاربر سیستم',
          phone: user.user_metadata?.phone || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        session,
        currentBusiness: activeBusiness,
        currentMember: activeMembership || null,
        currentRole: activeRole,
        permissions: activePermissions,
        userMemberships: memberships,
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false,
      });

      // Sync with Legacy AppStore for seamless UI compatibility
      if (activeBusiness) {
        useAppStore.getState().setCurrentBusiness({
          id: activeBusiness.id,
          name: activeBusiness.name,
          code: activeBusiness.slug || 'NX-1001',
          currency: activeBusiness.currency as any || 'تومان',
          taxId: activeBusiness.national_id || undefined,
          fiscalYear: '۱۴۰۳',
        });
      }
      if (profile || user) {
        useAppStore.getState().updateCurrentUser({
          id: user.id,
          name: profile?.full_name || user.email || 'کاربر سیستم',
          email: user.email || '',
          role: activeRole?.name || 'مدیر کسب‌وکار',
        });
      }

      // Set up real-time listener for Auth State changes
      supabase.auth.onAuthStateChange((event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          localStorage.removeItem(STORAGE_ACTIVE_BUSINESS_KEY);
          set({
            user: null,
            profile: null,
            session: null,
            currentBusiness: null,
            currentMember: null,
            currentRole: null,
            permissions: [],
            userMemberships: [],
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });
    } catch (error) {
      console.error('Error initializing Auth:', error);
      set({ isLoading: false });
    }
  },

  signUp: async ({ fullName, email, password, businessName }) => {
    set({ isLoading: true });

    if (!isSupabaseConfigured()) {
      // In demo mode, simulate signup
      get().enableDemoMode();
      set({ isLoading: false });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError || !authData.user) {
      set({ isLoading: false });
      throw new Error(authError?.message || 'خطا در ثبت‌نام کاربر');
    }

    const userId = authData.user.id;

    // Create Business and assign ownership
    try {
      const newMembership = await authService.createBusiness(userId, {
        name: businessName,
      });

      // Reload state after signup
      await get().initializeAuth();
    } catch (e: any) {
      set({ isLoading: false });
      throw new Error(e.message || 'ثبت‌نام انجام شد اما خطا در تعریف کسب‌وکار رخ داد');
    }
  },

  signIn: async ({ email, password }) => {
    set({ isLoading: true });

    if (!isSupabaseConfigured()) {
      get().enableDemoMode();
      set({ isLoading: false });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false });
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('نام کاربری یا رمز عبور اشتباه است.');
      }
      throw new Error(error.message || 'ورود ناموفق بود.');
    }

    await get().initializeAuth();
  },

  signOut: async () => {
    set({ isLoading: true });
    localStorage.removeItem(STORAGE_ACTIVE_BUSINESS_KEY);

    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }

    set({
      user: null,
      profile: null,
      session: null,
      currentBusiness: null,
      currentMember: null,
      currentRole: null,
      permissions: [],
      userMemberships: [],
      isAuthenticated: false,
      isLoading: false,
      isDemoMode: false,
    });
  },

  resetPassword: async (email: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw new Error(error.message || 'خطا در ارسال ایمیل بازیابی رمز عبور');
    }
  },

  updatePassword: async (password: string) => {
    if (!isSupabaseConfigured()) {
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw new Error(error.message || 'خطا در تغییر رمز عبور');
    }
  },

  selectBusiness: (businessId: string) => {
    const { userMemberships } = get();
    const targetMembership = userMemberships.find((m) => m.business_id === businessId);

    if (!targetMembership) {
      console.warn('Selected business membership not found');
      return;
    }

    localStorage.setItem(STORAGE_ACTIVE_BUSINESS_KEY, businessId);

    const activeBusiness = targetMembership.business;
    const activeRole = targetMembership.role || null;
    const activePermissions = targetMembership.permissions || [];

    set({
      currentBusiness: activeBusiness,
      currentMember: targetMembership,
      currentRole: activeRole,
      permissions: activePermissions,
    });

    // Sync appStore
    useAppStore.getState().setCurrentBusiness({
      id: activeBusiness.id,
      name: activeBusiness.name,
      code: activeBusiness.slug || 'NX-1001',
      currency: activeBusiness.currency as any || 'تومان',
      taxId: activeBusiness.national_id || undefined,
      fiscalYear: '۱۴۰۳',
    });

    if (activeRole) {
      useAppStore.getState().updateCurrentUser({
        role: activeRole.name,
      });
    }
  },

  createBusiness: async (payload) => {
    const { user } = get();
    if (!user) throw new Error('کاربر وارد نشده است');

    set({ isLoading: true });
    try {
      const newMembership = await authService.createBusiness(user.id, payload);
      await get().initializeAuth();
      get().selectBusiness(newMembership.business_id);
    } catch (e: any) {
      set({ isLoading: false });
      throw e;
    }
  },

  hasPermission: (permissionKey: string) => {
    const { permissions, currentRole } = get();
    // System owner or wildcard permissions
    if (currentRole?.slug === 'owner' || permissions.includes('*')) {
      return true;
    }
    return permissions.includes(permissionKey);
  },

  enableDemoMode: () => {
    const demoUser = {
      id: 'demo_user_1',
      email: 'demo@nexaccounting.io',
    };
    const demoProfile: Profile = {
      id: 'demo_user_1',
      full_name: 'علی محمدی (دمو)',
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const demoBusiness: Business = {
      id: 'demo_biz_1',
      name: 'شرکت فناوری نوین پرداز (سهامی خاص)',
      slug: 'nx-9042',
      logo_url: null,
      phone: '۰۲۱-۸۸۹۹۰۰۱۱',
      email: 'info@novin.io',
      address: 'تهران، خیابان ولیعصر، پلاک ۱۰۲',
      postal_code: '۱۹۳۹۵۱۱',
      national_id: '۱۰۳۲۰۸۴۷۱۲۰',
      economic_code: '۴۱۱۸۹۰',
      currency: 'تومان',
      timezone: 'Asia/Tehran',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const demoBusiness2: Business = {
      id: 'demo_biz_2',
      name: 'بازرگانی پارس گستر',
      slug: 'nx-1102',
      logo_url: null,
      phone: '۰۲۱-۴۴۲۲۱۱۰۰',
      email: 'sales@parsgostar.ir',
      address: 'تهران، میدان ونک، برج نگار',
      postal_code: '۱۴۱۵۵۳',
      national_id: '۱۰۱۰۴۵۶۲۸',
      economic_code: '۸۸۹۹۱۲',
      currency: 'تومان',
      timezone: 'Asia/Tehran',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const demoRole: Role = {
      id: 'role_owner',
      business_id: demoBusiness.id,
      name: 'مالک کسب‌وکار',
      slug: 'owner',
      description: 'دسترسی کامل به تمام امکانات سیستم',
      is_system: true,
      created_at: new Date().toISOString(),
    };

    const demoMemberships: BusinessMemberWithDetails[] = [
      {
        id: 'mem_1',
        business_id: demoBusiness.id,
        user_id: demoUser.id,
        role_id: demoRole.id,
        is_active: true,
        joined_at: new Date().toISOString(),
        business: demoBusiness,
        role: demoRole,
        permissions: ['*'],
      },
      {
        id: 'mem_2',
        business_id: demoBusiness2.id,
        user_id: demoUser.id,
        role_id: demoRole.id,
        is_active: true,
        joined_at: new Date().toISOString(),
        business: demoBusiness2,
        role: demoRole,
        permissions: ['*'],
      },
    ];

    set({
      user: demoUser,
      profile: demoProfile,
      session: { access_token: 'demo-token' },
      currentBusiness: demoBusiness,
      currentMember: demoMemberships[0],
      currentRole: demoRole,
      permissions: ['*'],
      userMemberships: demoMemberships,
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
    });

    // Sync legacy store
    useAppStore.getState().setCurrentBusiness({
      id: demoBusiness.id,
      name: demoBusiness.name,
      code: demoBusiness.slug || 'NX-9042',
      currency: demoBusiness.currency as any || 'تومان',
      taxId: demoBusiness.national_id || undefined,
      fiscalYear: '۱۴۰۳',
    });
    useAppStore.getState().updateCurrentUser({
      id: demoUser.id,
      name: demoProfile.full_name || 'کاربر سیستم',
      email: demoUser.email,
      role: demoRole.name,
    });
  },
}));
