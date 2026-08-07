/**
 * NexAccounting Barcode & QR Code Scanner Service Abstraction
 */

export interface BarcodeScanResult {
  code: string;
  format: string;
  timestamp: string;
}

export class BarcodeScannerService {
  private static isScanning = false;

  /**
   * Mock or camera-based barcode scanner wrapper
   * Reads standard barcodes (EAN-13, EAN-8, Code-128, QR)
   */
  public static async scanBarcode(): Promise<BarcodeScanResult | null> {
    if (this.isScanning) return null;
    this.isScanning = true;

    try {
      // Check if native Android bridge exists
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.scanBarcode) {
        const code = await (window as any).AndroidBridge.scanBarcode();
        this.isScanning = false;
        if (code) {
          return {
            code,
            format: 'EAN_13',
            timestamp: new Date().toISOString(),
          };
        }
        return null;
      }

      // Web/Mobile Fallback: Simulate camera barcode scan or prompt for barcode entry
      const promptResult = window.prompt('بارکد کالا را وارد کنید یا اسکن کنید:', '');
      this.isScanning = false;

      if (promptResult && promptResult.trim()) {
        return {
          code: promptResult.trim(),
          format: 'CODE_128',
          timestamp: new Date().toISOString(),
        };
      }

      return null;
    } catch (err) {
      console.error('Barcode scan error:', err);
      this.isScanning = false;
      return null;
    }
  }

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      !!(window as any).AndroidBridge?.scanBarcode ||
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }
}
