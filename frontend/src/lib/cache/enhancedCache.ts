/**
 * Enhanced Caching System
 *
 * Multi-tier caching with LRU memory cache and Redis fallback
 * Provides configurable TTL, size limits, and cache analytics.
 */

import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';
import { isBuildTime } from './buildSafeCache';

interface CacheOptions {
  maxSize?: number;
  ttl?: number; // milliseconds
  enableRedis?: boolean;
  redisKeyPrefix?: string;
  enableMetrics?: boolean;
  serialize?: boolean;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  redisHits: number;
  redisMisses: number;
  memorySize: number;
  hitRate: number;
}

interface CacheStats {
  memory: CacheMetrics;
  redis?: {
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
    hitRate: number;
  };
  totalHitRate: number;
  lastReset: Date;
}

class EnhancedCache<T = any> {
  private memoryCache: LRUCache<string, CacheEntry<T>>;
  private redisClient: Redis | null = null;
  private options: Required<CacheOptions>;
  private metrics: CacheMetrics;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: 1000,
      ttl: 5 * 60 * 1000, // 5 minutes
      enableRedis: true,
      redisKeyPrefix: 'polaris_cache:',
      enableMetrics: true,
      serialize: true,
      ...options,
    };

    // Disable Redis and metrics during build time
    if (isBuildTime()) {
      this.options.enableRedis = false;
      this.options.enableMetrics = false;
      console.log('Enhanced cache: Using build-safe mode (memory only)');
    }

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      redisHits: 0,
      redisMisses: 0,
      memorySize: 0,
      hitRate: 0,
    };

    // Initialize LRU memory cache
    this.memoryCache = new LRUCache<string, CacheEntry<T>>({
      max: this.options.maxSize,
      ttl: this.options.ttl,
      updateAgeOnGet: true,
      allowStale: false,
      dispose: (value, key) => {
        if (this.options.enableMetrics) {
          this.metrics.evictions++;
          this.updateMemorySize(-1);
        }
      },
    });

    // Initialize Redis client if enabled and not in build time
    if (this.options.enableRedis && !isBuildTime()) {
      this.initializeRedis();
    }
  }

  /**
   * Initialize Redis client with proper configuration
   */
  private initializeRedis(): void {
    try {
      // Skip Redis initialization during build time
      if (
        process.env.NEXT_PHASE === 'phase-production-build' ||
        (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL)
      ) {
        console.warn('Enhanced cache: Skipping Redis initialization during build time');
        return;
      }

      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 2,
          lazyConnect: true,
          commandTimeout: 5000,
          connectTimeout: 10000,
        });

        this.redisClient.on('connect', () => {
          console.log('Enhanced cache: Redis connected');
        });

        this.redisClient.on('error', (error) => {
          console.warn('Enhanced cache: Redis error, falling back to memory cache', error);
          this.redisClient = null;
        });

        this.redisClient.on('close', () => {
          console.warn('Enhanced cache: Redis connection closed');
        });
      } else {
        console.warn('Enhanced cache: Redis URL not found, using memory cache only');
      }
    } catch (error) {
      console.error('Enhanced cache: Failed to initialize Redis', error);
      this.redisClient = null;
    }
  }

  /**
   * Get value from cache (memory first, Redis fallback)
   */
  async get(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const now = Date.now();

    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(fullKey);

      if (memoryEntry) {
        // Check if entry is still valid
        if (now - memoryEntry.timestamp < memoryEntry.ttl) {
          if (this.options.enableMetrics) {
            memoryEntry.hits++;
            this.metrics.hits++;
            this.updateHitRate();
          }
          return memoryEntry.value;
        } else {
          // Entry expired, remove from memory
          this.memoryCache.delete(fullKey);
        }
      }

      // Try Redis if memory cache miss
      if (this.redisClient) {
        try {
          const redisValue = await this.redisClient.get(fullKey);

          if (redisValue) {
            const parsedValue = this.options.serialize ? JSON.parse(redisValue) : redisValue;

            // Store in memory cache for faster future access
            const cacheEntry: CacheEntry<T> = {
              value: parsedValue,
              timestamp: now,
              ttl: this.options.ttl,
              hits: 1,
            };

            this.memoryCache.set(fullKey, cacheEntry);
            if (this.options.enableMetrics) {
              this.updateMemorySize(1);
              this.metrics.redisHits++;
              this.metrics.hits++;
              this.updateHitRate();
            }

            return parsedValue;
          } else {
            if (this.options.enableMetrics) {
              this.metrics.redisMisses++;
            }
          }
        } catch (redisError) {
          console.warn('Enhanced cache: Redis get failed', redisError);
          this.redisClient = null;
        }
      }

      // Cache miss
      if (this.options.enableMetrics) {
        this.metrics.misses++;
        this.updateHitRate();
      }
      return null;
    } catch (error) {
      console.error('Enhanced cache: Get operation failed', error);
      if (this.options.enableMetrics) {
        this.metrics.misses++;
        this.updateHitRate();
      }
      return null;
    }
  }

  /**
   * Set value in cache (both memory and Redis)
   */
  async set(key: string, value: T, customTtl?: number): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const now = Date.now();
    const ttl = customTtl || this.options.ttl;

    try {
      const cacheEntry: CacheEntry<T> = {
        value,
        timestamp: now,
        ttl,
        hits: 0,
      };

      // Set in memory cache
      const wasInMemory = this.memoryCache.has(fullKey);
      this.memoryCache.set(fullKey, cacheEntry);

      if (!wasInMemory) {
        if (this.options.enableMetrics) {
          this.updateMemorySize(1);
        }
      }

      // Set in Redis if available
      if (this.redisClient) {
        try {
          const serializedValue = this.options.serialize ? JSON.stringify(value) : String(value);

          await this.redisClient.setex(fullKey, Math.ceil(ttl / 1000), serializedValue);
        } catch (redisError) {
          console.warn('Enhanced cache: Redis set failed', redisError);
          // Don't disable Redis for set failures, it might be temporary
        }
      }

      if (this.options.enableMetrics) {
        this.metrics.sets++;
      }
      return true;
    } catch (error) {
      console.error('Enhanced cache: Set operation failed', error);
      return false;
    }
  }

  /**
   * Delete value from cache (both memory and Redis)
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    try {
      const wasInMemory = this.memoryCache.has(fullKey);

      // Delete from memory cache
      this.memoryCache.delete(fullKey);

      if (wasInMemory) {
        if (this.options.enableMetrics) {
          this.updateMemorySize(-1);
        }
      }

      // Delete from Redis if available
      if (this.redisClient) {
        try {
          await this.redisClient.del(fullKey);
        } catch (redisError) {
          console.warn('Enhanced cache: Redis delete failed', redisError);
        }
      }

      if (this.options.enableMetrics) {
        this.metrics.deletes++;
      }
      return true;
    } catch (error) {
      console.error('Enhanced cache: Delete operation failed', error);
      return false;
    }
  }

  /**
   * Clear cache (both memory and Redis)
   */
  async clear(pattern?: string): Promise<boolean> {
    try {
      if (pattern) {
        // Clear matching keys
        const { safeRegExp } = await import('@/lib/utils/safeRegex');
        const regex = safeRegExp(pattern);
        if (!regex) {
          console.warn('Invalid pattern for cache clear, skipping pattern-based clear');
          return false;
        }

        // Clear from memory cache
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }

        // Clear from Redis if available
        if (this.redisClient) {
          try {
            const fullPattern = this.options.redisKeyPrefix + pattern;
            const keys = await this.redisClient.keys(fullPattern);
            if (keys.length > 0) {
              await this.redisClient.del(...keys);
            }
          } catch (redisError) {
            console.warn('Enhanced cache: Redis pattern clear failed', redisError);
          }
        }
      } else {
        // Clear all
        this.memoryCache.clear();
        this.metrics.memorySize = 0;

        if (this.redisClient) {
          try {
            const pattern = this.options.redisKeyPrefix + '*';
            const keys = await this.redisClient.keys(pattern);
            if (keys.length > 0) {
              await this.redisClient.del(...keys);
            }
          } catch (redisError) {
            console.warn('Enhanced cache: Redis clear failed', redisError);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Enhanced cache: Clear operation failed', error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetches from cache or executes function
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
      console.error(`Enhanced cache: Fetch function failed for key ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);

    // Check memory cache first
    if (this.memoryCache.has(fullKey)) {
      return true;
    }

    // Check Redis
    if (this.redisClient) {
      try {
        const exists = await this.redisClient.exists(fullKey);
        return exists === 1;
      } catch (redisError) {
        console.warn('Enhanced cache: Redis exists check failed', redisError);
        return false;
      }
    }

    return false;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const stats: CacheStats = {
      memory: { ...this.metrics },
      totalHitRate: this.metrics.hitRate,
      lastReset: new Date(),
    };

    // Add Redis stats if available
    if (this.redisClient) {
      try {
        const info = await this.redisClient.info('memory');
        const keyCount = await this.redisClient.dbsize();

        const memoryUsage = this.parseRedisMemoryInfo(info);
        const redisHitRate =
          this.metrics.redisHits + this.metrics.redisMisses > 0
            ? (this.metrics.redisHits / (this.metrics.redisHits + this.metrics.redisMisses)) * 100
            : 0;

        stats.redis = {
          connected: this.redisClient.status === 'ready',
          keyCount,
          memoryUsage,
          hitRate: redisHitRate,
        };
      } catch (error) {
        console.warn('Enhanced cache: Failed to get Redis stats', error);
        stats.redis = {
          connected: false,
          keyCount: 0,
          memoryUsage: 'unknown',
          hitRate: 0,
        };
      }
    }

    return stats;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      redisHits: 0,
      redisMisses: 0,
      memorySize: this.memoryCache.size,
      hitRate: 0,
    };
  }

  /**
   * Get memory cache size
   */
  size(): number {
    return this.memoryCache.size;
  }

  /**
   * Get all memory cache keys
   */
  keys(): string[] {
    return this.memoryCache.keys().map((key) => key.replace(this.options.redisKeyPrefix, ''));
  }

  /**
   * Force cleanup of expired entries
   */
  async cleanup(): Promise<void> {
    this.memoryCache.purgeStale();

    // Redis cleanup is handled automatically by TTL
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  // Private helper methods

  private getFullKey(key: string): string {
    return this.options.redisKeyPrefix + key;
  }

  private updateMemorySize(delta: number): void {
    this.metrics.memorySize = Math.max(0, this.metrics.memorySize + delta);
  }

  private updateHitRate(): void {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
  }

  private parseRedisMemoryInfo(info: string): string {
    const lines = info.split('\r\n');
    const memoryLine = lines.find((line) => line.startsWith('used_memory_human:'));

    if (memoryLine) {
      return memoryLine.split(':')[1];
    }

    return 'unknown';
  }
}

// Pre-configured cache instances for different use cases
export const apiCache = new EnhancedCache({
  maxSize: 500,
  ttl: 5 * 60 * 1000, // 5 minutes
  enableRedis: true,
  redisKeyPrefix: 'api_cache:',
  enableMetrics: true,
});

export const userCache = new EnhancedCache({
  maxSize: 1000,
  ttl: 15 * 60 * 1000, // 15 minutes
  enableRedis: true,
  redisKeyPrefix: 'user_cache:',
  enableMetrics: true,
});

export const blueprintCache = new EnhancedCache({
  maxSize: 100,
  ttl: 30 * 60 * 1000, // 30 minutes
  enableRedis: true,
  redisKeyPrefix: 'blueprint_cache:',
  enableMetrics: true,
});

export const questionCache = new EnhancedCache({
  maxSize: 200,
  ttl: 60 * 60 * 1000, // 1 hour
  enableRedis: true,
  redisKeyPrefix: 'question_cache:',
  enableMetrics: true,
});

// Utility functions
export function createCache<T>(options?: CacheOptions): EnhancedCache<T> {
  return new EnhancedCache<T>(options);
}

export async function getCachesStats(): Promise<Record<string, CacheStats>> {
  const [api, user, blueprint, question] = await Promise.all([
    apiCache.getStats(),
    userCache.getStats(),
    blueprintCache.getStats(),
    questionCache.getStats(),
  ]);

  return {
    api,
    user,
    blueprint,
    question,
  };
}

export async function clearAllCaches(): Promise<boolean> {
  try {
    await Promise.all([
      apiCache.clear(),
      userCache.clear(),
      blueprintCache.clear(),
      questionCache.clear(),
    ]);
    return true;
  } catch (error) {
    console.error('Failed to clear all caches:', error);
    return false;
  }
}

export default EnhancedCache;
