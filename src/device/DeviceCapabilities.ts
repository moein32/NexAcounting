/**
 * NexAccounting Device Capabilities Detection Utility
 */

export interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isNativeApp: boolean;
  hasCamera: boolean;
  hasBarcodeScanner: boolean;
  hasTouch: boolean;
  hasNotificationSupport: boolean;
  hasVibration: boolean;
}

export class DeviceCapabilities {
  public static getInfo(): DeviceInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isAndroid: false,
        isIOS: false,
        isNativeApp: false,
        hasCamera: false,
        hasBarcodeScanner: false,
        hasTouch: false,
        hasNotificationSupport: false,
        hasVibration: false,
      };
    }

    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isNativeApp = !!(window as any).AndroidBridge || !!(window as any).webkit;

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasNotificationSupport = 'Notification' in window;
    const hasVibration = 'vibrate' in navigator;

    return {
      isAndroid,
      isIOS,
      isNativeApp,
      hasCamera,
      hasBarcodeScanner: hasCamera, // WebRTC camera-based scanner support
      hasTouch,
      hasNotificationSupport,
      hasVibration,
    };
  }

  public static triggerHapticFeedback(pattern: number | number[] = 50): void {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }

  public static requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }
}
