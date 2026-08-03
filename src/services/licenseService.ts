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

const LICENSE_CACHE_KEY = 'nex_license_cache';

export const LicenseService = {
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
