
/**
 * 💾 In-Memory Cache Helper
 * Lightweight caching solution without Redis dependency
 * Cache có thời gian sống (TTL) và tự động làm sạch
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Tự động dọn dẹp cache mỗi 5 phút
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Lấy giá trị từ cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Kiểm tra hết hạn
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Lưu giá trị vào cache
   * @param key - Cache key
   * @param value - Giá trị cần cache
   * @param ttl - Thời gian sống (giây), mặc định 5 phút
   */
  set<T>(key: string, value: T, ttl: number = 300): void {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Xóa cache theo key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Xóa toàn bộ cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Xóa các entry đã hết hạn
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: Removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Lấy thông tin cache
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Dọn dẹp interval khi shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
const cache = new SimpleCache();

/**
 * Helper function: Lấy hoặc tính toán giá trị
 * @param key - Cache key
 * @param fetcher - Hàm để tính toán giá trị nếu không có trong cache
 * @param ttl - Thời gian sống (giây)
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Thử lấy từ cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`✅ Cache hit: ${key}`);
    return cached;
  }

  // Không có trong cache, tính toán
  console.log(`⏳ Cache miss: ${key} - Fetching...`);
  const value = await fetcher();
  cache.set(key, value, ttl);
  
  return value;
}

/**
 * Xóa cache theo pattern
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    console.log('🗑️  Cleared all cache');
    return;
  }

  const stats = cache.stats();
  const keysToDelete = stats.keys.filter(key => key.includes(pattern));
  keysToDelete.forEach(key => cache.delete(key));
  
  console.log(`🗑️  Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`);
}

/**
 * Lấy thông tin cache
 */
export function getCacheStats() {
  return cache.stats();
}

export default cache;

