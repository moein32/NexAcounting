import { SettingsRepository } from '../repositories';
import { PrintSettings, DEFAULT_PRINT_SETTINGS } from '../types/print';

export const printService = {
  getPrintSettings(businessId: string): PrintSettings {
    try {
      const stored = SettingsRepository.get(`print_settings_${businessId}`);
      if (stored) {
        return { ...DEFAULT_PRINT_SETTINGS, ...stored };
      }
    } catch (e) {
      console.error('Error fetching print settings:', e);
    }
    return DEFAULT_PRINT_SETTINGS;
  },

  savePrintSettings(businessId: string, settings: PrintSettings): void {
    try {
      SettingsRepository.set(`print_settings_${businessId}`, settings);
    } catch (e) {
      console.error('Error saving print settings:', e);
    }
  },
};
