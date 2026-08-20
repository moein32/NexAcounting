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
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.isValid === 'boolean') {
          return parsed;
        }
      } catch (e) {
        // Fallback to default free tier
      }
    }

    // Default license profile if none exists is strictly Free tier (not unvalidated Pro)
    const defaultLicense: LicenseStatus = {
      isValid: true,
      tier: 'free',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days initial trial/free
      activeDevicesCount: 1,
      maxDevices: 1,
      features: ['sales', 'purchases', 'inventory', 'parties', 'catalog'],
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
      // Offline fallback: return current validated or free tier cached state
      return current;
    }

    try {
      // Connect to Central Supabase License Server
      const { data, error } = await supabase
        .from('license_activations')
        .select(`
          *,
          license:licenses (
            tier,
            max_devices,
            valid_until,
            is_active
          )
        `)
        .eq('device_id', deviceId)
        .single();

      if (error || !data || !data.license) {
        console.warn('License server verification: Device unregistered or license inactive.');
        return current;
      }

      const lic = data.license;
      const planFeatures: Record<string, string[]> = {
        free: ['sales', 'purchases', 'inventory', 'parties', 'catalog'],
        professional: ['sales', 'purchases', 'inventory', 'parties', 'catalog', 'treasury', 'reports', 'backup'],
        enterprise: ['sales', 'purchases', 'inventory', 'parties', 'catalog', 'treasury', 'reports', 'backup', 'multi_user', 'audit_logs'],
      };

      const tier = (lic.tier as 'free' | 'professional' | 'enterprise') || 'free';
      const updatedStatus: LicenseStatus = {
        isValid: data.is_active && lic.is_active,
        tier: tier,
        expiresAt: lic.valid_until || current.expiresAt,
        activeDevicesCount: 1,
        maxDevices: lic.max_devices || 1,
        features: planFeatures[tier] || planFeatures.free,
      };

      this.cacheLicense(updatedStatus);
      return updatedStatus;
    } catch (e) {
      console.error('License verification failed. Utilizing offline state.');
      return current;
    }
  },

  // Check if a specific feature flag is unlocked based on active subscription
  isFeatureUnlocked(featureKey: string): boolean {
    const license = this.getCachedLicense();
    return license.isValid && license.features.includes(featureKey);
  },
};
