/**
 * NexAccounting Camera Capture & Document Attachment Service
 */

export interface CapturedDocument {
  id: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  fileName: string;
  capturedAt: string;
}

export class CameraService {
  /**
   * Triggers native camera / photo selection file picker
   */
  public static selectOrCapturePhoto(): Promise<CapturedDocument | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Prefer rear camera on Android

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) {
          resolve(null);
          return;
        }

        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
          const doc: CapturedDocument = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: reader.result as string,
            mimeType: file.type || 'image/jpeg',
            size: file.size,
            fileName: file.name || `invoice_scan_${Date.now()}.jpg`,
            capturedAt: new Date().toISOString(),
          };
          resolve(doc);
        };

        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  /**
   * Direct WebRTC video stream capture interface for inline modal camera view
   */
  public static async getCameraStream(): Promise<MediaStream | null> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return null;
      }
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (err) {
      console.warn('Camera access error:', err);
      return null;
    }
  }

  public static stopStream(stream: MediaStream | null): void {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
}
