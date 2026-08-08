import { biService } from './biService';

interface CacheEntry {
  timestamp: number;
  data: any;
}

const cacheMap = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 seconds TTL

export const DashboardDataService = {
  async getMetrics(businessId: string, forceRefresh: boolean = false) {
    const now = Date.now();
    const cached = cacheMap.get(businessId);

    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const freshData = await biService.getDashboardMetrics(businessId);
    cacheMap.set(businessId, {
      timestamp: now,
      data: freshData,
    });

    return freshData;
  },

  invalidateCache(businessId?: string) {
    if (businessId) {
      cacheMap.delete(businessId);
    } else {
      cacheMap.clear();
    }
  },
};
