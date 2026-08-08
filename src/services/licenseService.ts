import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SettingsRepository } from '../repositories';

export interface LicenseStatus {
  isValid: boolean;
  tier: 'free' | 'professional' | 'enterprise';
  expiresAt: string;
  activeDevicesCount: number;
  maxDevices: number;
  features: string[];
}

export interface LicensePlan {
  id: string;
  name: string;
  code: 'free' | 'professional' | 'enterprise';
  max_devices: number;
  max_businesses: number;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

export interface SubscriptionRecord {
  id: string;
  business_id: string;
  user_id: string;
  plan_code: 'free' | 'professional' | 'enterprise';
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
}

export interface BusinessAccessControl {
  business_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'accountant' | 'viewer';
  permissions: string[];
  is_active: boolean;
}

const LICENSE_CACHE_KEY = 'nex_license_cache';

export const LicenseService = {
  // Available Subscription Plans
  getPlans(): LicensePlan[] {
    return [
      {
        id: 'plan_free',
        name: 'نسخه پایه (رایگان)',
        code: 'free',
        max_devices: 1,
        max_businesses: 1,
        price_monthly: 0,
        price_yearly: 0,
        features: ['sales', 'purchases', 'inventory'],
      },
      {
        id: 'plan_pro',
        name: 'نسخه حرفه‌ای (Professional)',
        code: 'professional',
        max_devices: 3,
        max_businesses: 3,
        price_monthly: 290000,
        price_yearly: 2900000,
        features: ['sales', 'purchases', 'inventory', 'treasury', 'reports', 'backup'],
      },
      {
        id: 'plan_ent',
        name: 'نسخه سازمانی (Enterprise)',
        code: 'enterprise',
        max_devices: 10,
        max_businesses: 10,
        price_monthly: 790000,
        price_yearly: 7900000,
        features: ['sales', 'purchases', 'inventory', 'treasury', 'reports', 'backup', 'multi_user', 'audit_logs'],
      },
    ];
  },

  // Read local cached status (Offline Cache)
  getCachedLicense(): LicenseStatus {
    const cached = localStorage.getItem(LICENSE_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }

    // Default license profile if none exists
    const defaultLicense: LicenseStatus = {
      isValid: true,
      tier: 'professional',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
      activeDevicesCount: 1,
      maxDevices: 3,
      features: ['sales', 'purchases', 'inventory', 'treasury', 'reports', 'backup'],
    };
    this.cacheLicense(defaultLicense);
    return defaultLicense;
  },

  // Update cached status
  cacheLicense(status: LicenseStatus) {
    localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify(status));
  },

  // Perform License Validation with Supabase License Server
  async validateLicenseOnline(deviceId: string): Promise<LicenseStatus> {
    const current = this.getCachedLicense();
    if (!isSupabaseConfigured()) {
      // Offline fallback
      return current;
    }

    try {
      // Connect to Central Supabase License Server
      const { data, error } = await supabase
        .from('license_activations')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (error || !data) {
        // Device not activated or subscription expired, keep using cached offline state for smooth operation
        console.warn('License server unavailable or device unregistered. Using secure offline cached license.');
        return current;
      }

      const updatedStatus: LicenseStatus = {
        isValid: data.is_active,
        tier: data.tier || 'professional',
        expiresAt: data.expires_at || current.expiresAt,
        activeDevicesCount: data.devices_count || 1,
        maxDevices: data.max_devices || 3,
        features: data.enabled_features || current.features,
      };

      this.cacheLicense(updatedStatus);
      return updatedStatus;
    } catch (e) {
      console.error('License verification failed. Utilizing offline fallback state.');
      return current;
    }
  },

  // Check if a specific feature flag is unlocked based on active subscription
  isFeatureUnlocked(featureKey: string): boolean {
    const license = this.getCachedLicense();
    return license.isValid && license.features.includes(featureKey);
  },
};
