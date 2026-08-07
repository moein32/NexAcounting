/**
 * NexAccounting - Automatic Notification Scheduler
 * Handles startup initialization, periodic background checks, and lifecycle events.
 */

import { NotificationManager } from './NotificationManager';

export class NotificationScheduler {
  private static timerId: any = null;
  private static activeBusinessId: string | null = null;

  /**
   * Initialize scheduler for current business.
   */
  public static init(businessId: string): void {
    if (!businessId) return;

    this.activeBusinessId = businessId;

    // Run immediate check at startup / login / business switch
    NotificationManager.refreshScheduledChecks(businessId);

    // Clear previous timer if exists
    if (this.timerId) {
      clearInterval(this.timerId);
    }

    // Set hourly periodic check
    this.timerId = setInterval(() => {
      if (this.activeBusinessId) {
        NotificationManager.refreshScheduledChecks(this.activeBusinessId);
      }
    }, 60 * 60 * 1000); // Every 1 hour
  }

  /**
   * Stop scheduler background timer.
   */
  public static stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Trigger immediate check (e.g. after transaction, invoice creation, check entry).
   */
  public static triggerImmediate(businessId?: string): void {
    const targetId = businessId || this.activeBusinessId;
    if (targetId) {
      NotificationManager.refreshScheduledChecks(targetId);
    }
  }
}
