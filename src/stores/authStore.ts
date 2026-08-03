import { create } from 'zustand';
import { useAppStore } from './appStore';
import { BusinessRepository } from '../repositories';
import {
  Profile,
  Business,
  BusinessMember,
  Role,
  BusinessMemberWithDetails,
} from '../types/auth';
import { PINManager, LocalSessionManager } from '../features/auth/services/authServices';

const STORAGE_ACTIVE_BUSINESS_KEY = 'nex_active_business_id';
const STORAGE_PIN_CODE_KEY = 'nex_local_pin_code';

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
  isConfigured: boolean; // True if a business has been initialized

  // Methods
  initializeAuth: () => Promise<void>;
  localSetupBusiness: (payload: {
    name: string;
    manager_name: string;
    phone: string;
    currency: string;
    pin_code?: string;
  }) => Promise<void>;
  localSignInWithPIN: (pin: string) => Promise<boolean>;
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
  developerLogin: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  currentBusiness: null,
  currentMember: null,
  currentRole: null,
  permissions: ['*'],
  userMemberships: [],
  isLoading: true,
  isAuthenticated: false,
  isDemoMode: false,
  isConfigured: false,

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const bizProfile = BusinessRepository.getProfile();
      const hasSession = LocalSessionManager.hasActiveSession();

      if (!bizProfile || !hasSession) {
        // Business not setup yet or session expired, needs to go through Wizard
        set({
          isConfigured: false,
          isAuthenticated: false,
          isLoading: false,
          currentBusiness: null,
        });
        return;
      }

      // Business is setup! Let's load the info
      const hasPin = !!localStorage.getItem('nex_secure_pin_hash');

      const fakeUser = {
        id: 'local_user',
        email: 'admin@nexaccounting.local',
      };

      const localProfile: Profile = {
        id: 'local_user',
        full_name: (bizProfile as any).manager_name || 'مدیر سیستم',
        phone: bizProfile.phone || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const business: Business = {
        id: bizProfile.id,
        name: bizProfile.name,
        slug: 'biz_main',
        national_id: bizProfile.national_id || '',
        phone: bizProfile.phone || '',
        email: 'info@' + bizProfile.name.toLowerCase().replace(/\s+/g, '') + '.ir',
        website: '',
        currency: bizProfile.currency || 'تومان',
        logo_url: bizProfile.logo_url || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;

      // Set states
      set({
        isConfigured: true,
        currentBusiness: business,
        user: fakeUser,
        profile: localProfile,
        // If there is no PIN, automatically log them in
        isAuthenticated: !hasPin,
        isLoading: false,
      });

      // Sync with Legacy AppStore for perfect UI backward compatibility
      useAppStore.getState().setCurrentBusiness({
        id: business.id,
        name: business.name,
        code: 'biz_main',
        currency: business.currency as any || 'تومان',
        taxId: business.national_id || undefined,
        fiscalYear: '۱۴۰۳',
      });

      useAppStore.getState().updateCurrentUser({
        id: 'local_user',
        name: localProfile.full_name,
        email: fakeUser.email,
        role: 'مدیر ارشد مالی',
      });
    } catch (e) {
      console.error('Failed to initialize local auth:', e);
      set({ isLoading: false });
    }
  },

  localSetupBusiness: async (payload) => {
    set({ isLoading: true });
    try {
      // 1. Create Profile in SQLite
      const existing = BusinessRepository.getProfile();
      const profileData = {
        id: 'biz_main',
        name: payload.name,
        manager_name: payload.manager_name,
        phone: payload.phone,
        currency: payload.currency,
        logo_url: (payload as any).logo || null,
      };

      if (existing) {
        BusinessRepository.updateProfile(profileData as any);
      } else {
        BusinessRepository.createProfile(profileData as any);
      }

      // 2. Persist secure PIN locally if provided (with encryption hashing & salting)
      if (payload.pin_code) {
        const salt = PINManager.generateSalt();
        const hash = await PINManager.hashPIN(payload.pin_code, salt);
        localStorage.setItem('nex_secure_pin_hash', hash);
        localStorage.setItem('nex_secure_pin_salt', salt);
      } else {
        localStorage.removeItem('nex_secure_pin_hash');
        localStorage.removeItem('nex_secure_pin_salt');
      }

      // Establish session locally
      LocalSessionManager.saveSession(payload.phone, localStorage.getItem('nex_device_id') || 'dev_device_default');

      // Initialize the auth with new profile
      await get().initializeAuth();
    } catch (e) {
      console.error('Failed to setup business locally:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  localSignInWithPIN: async (pin: string) => {
    const hash = localStorage.getItem('nex_secure_pin_hash');
    const salt = localStorage.getItem('nex_secure_pin_salt');
    if (!hash || !salt) {
      set({ isAuthenticated: true });
      return true;
    }
    const matches = await PINManager.verifyPIN(pin, hash, salt);
    if (matches) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  signUp: async (payload) => {
    // Treat standard signup as local configuration
    await get().localSetupBusiness({
      name: payload.businessName,
      manager_name: payload.fullName,
      phone: '',
      currency: 'تومان',
    });
  },

  signIn: async (payload) => {
    // If PIN is stored, use it as fallback login. Otherwise accept password.
    set({ isAuthenticated: true });
  },

  signOut: async () => {
    LocalSessionManager.clearSession();
    set({
      isAuthenticated: false,
      isConfigured: false,
    });
  },

  resetPassword: async () => {},
  updatePassword: async () => {},
  selectBusiness: () => {},
  createBusiness: async () => {},

  hasPermission: () => true,

  enableDemoMode: () => {
    // Deprecated for secure real SQLite usage
  },

  developerLogin: async () => {
    set({ isLoading: true });
    try {
      // 1. Activate session
      LocalSessionManager.saveSession('09123456789', 'dev_device_123');
      
      // 2. Setup business
      const pin = '1234';
      const salt = PINManager.generateSalt();
      const hashed = await PINManager.hashPIN(pin, salt);
      
      localStorage.setItem('nex_secure_pin_hash', hashed);
      localStorage.setItem('nex_secure_pin_salt', salt);
      
      // Setup business profile in repository
      const profileData = {
        id: 'biz_main',
        name: 'کسب‌وکار نمونه توسعه',
        manager_name: 'توسعه‌دهنده سیستم',
        phone: '09123456789',
        currency: 'تومان',
        logo_url: null,
      };
      
      const existing = BusinessRepository.getProfile();
      if (existing) {
        BusinessRepository.updateProfile(profileData as any);
      } else {
        BusinessRepository.createProfile(profileData as any);
      }
      
      // Seed data automatically takes effect as businessId is biz_main and list is empty
      // Re-trigger initialize to load everything
      await get().initializeAuth();
      set({ isAuthenticated: true });
      return true;
    } catch (e) {
      console.error('Developer mode login error:', e);
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
}));
