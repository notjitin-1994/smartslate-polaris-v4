/**
 * Build-safe cache factory
 *
 * Provides memory-only cache during build time to prevent Redis connection errors
 */

import { LRUCache } from 'lru-cache';
import type { CacheOptions } from './enhancedCache';

interface BuildSafeCacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class BuildSafeCache<T = any> {
  private memoryCache: LRUCache<string, BuildSafeCacheEntry<T>>;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: 1000,
      ttl: 5 * 60 * 1000, // 5 minutes
      enableRedis: false, // Always disabled during build
      redisKeyPrefix: 'polaris_cache:',
      enableMetrics: false, // Disable metrics during build
      serialize: true,
      ...options,
    };

    // Initialize LRU memory cache only
    this.memoryCache = new LRUCache<string, BuildSafeCacheEntry<T>>({
      max: this.options.maxSize,
      ttl: this.options.ttl,
      updateAgeOnGet: true,
      allowStale: false,
    });
  }

  /**
   * Get value from memory cache
   */
  async get(key: string): Promise<T | null> {
    const fullKey = this.options.redisKeyPrefix + key;
    const now = Date.now();

    try {
      const entry = this.memoryCache.get(fullKey);

      if (entry) {
        // Check if entry is still valid
        if (now - entry.timestamp < entry.ttl) {
          return entry.value;
        } else {
          // Entry expired, remove from memory
          this.memoryCache.delete(fullKey);
        }
      }

      return null;
    } catch (error) {
      console.error('Build-safe cache: Get operation failed', error);
      return null;
    }
  }

  /**
   * Set value in memory cache
   */
  async set(key: string, value: T, customTtl?: number): Promise<boolean> {
    const fullKey = this.options.redisKeyPrefix + key;
    const now = Date.now();
    const ttl = customTtl || this.options.ttl;

    try {
      const cacheEntry: BuildSafeCacheEntry<T> = {
        value,
        timestamp: now,
        ttl,
      };

      this.memoryCache.set(fullKey, cacheEntry);
      return true;
    } catch (error) {
      console.error('Build-safe cache: Set operation failed', error);
      return false;
    }
  }

  /**
   * Delete value from memory cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.options.redisKeyPrefix + key;

    try {
      this.memoryCache.delete(fullKey);
      return true;
    } catch (error) {
      console.error('Build-safe cache: Delete operation failed', error);
      return false;
    }
  }

  /**
   * Clear memory cache
   */
  async clear(): Promise<boolean> {
    try {
      this.memoryCache.clear();
      return true;
    } catch (error) {
      console.error('Build-safe cache: Clear operation failed', error);
      return false;
    }
  }

  /**
   * Get or set pattern
   */
  async getOrSet(key: string, fetchFn: () => Promise<T> | T, customTtl?: number): Promise<T> {
    const cached = await this.get(key);

    if (cached !== null) {
      return cached;
    }

    try {
      const value = await fetchFn();
      await this.set(key, value, customTtl);
      return value;
    } catch (error) {
      console.error(`Build-safe cache: Fetch function failed for key ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.options.redisKeyPrefix + key;
    return this.memoryCache.has(fullKey);
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.memoryCache.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return this.memoryCache.keys().map((key) => key.replace(this.options.redisKeyPrefix, ''));
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    this.memoryCache.purgeStale();
  }

  /**
   * No-op disconnect for compatibility
   */
  async disconnect(): Promise<void> {
    // No-op for memory-only cache
  }
}

/**
 * Check if we're in build time
 */
function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build' ||
    (process.env.VERCEL === '1' && process.env.NODE_ENV === 'production' && !process.env.REDIS_URL)
  );
}

/**
 * Factory function that returns appropriate cache instance
 */
export function createBuildSafeCache<T>(options?: CacheOptions): BuildSafeCache<T> {
  return new BuildSafeCache<T>(options);
}

/**
 * Export build-safe cache as default for use during build time
 */
export default BuildSafeCache;
export { isBuildTime };
