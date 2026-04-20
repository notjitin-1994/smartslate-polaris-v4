/**
 * Redis Client Configuration for Production
 *
 * Handles Redis connection setup with proper fallbacks and error handling
 * Supports both Vercel KV and traditional Redis instances
 */

import Redis from 'ioredis';

// Types
interface RedisConfig {
  url: string;
  token?: string;
  maxRetries: number;
  retryDelayOnFailover: number;
  lazyConnect: boolean;
  commandTimeout: number;
  connectTimeout: number;
}

interface CacheResult<T> {
  data: T | null;
  cached: boolean;
  error?: string;
}

// Singleton Redis client instance
let redisClient: Redis | null = null;
let isInitializing = false;

/**
 * Get Redis configuration from environment variables
 * Supports multiple Redis providers (Vercel KV, Upstash, Redis.com, etc.)
 */
function getRedisConfig(): RedisConfig | null {
  // Skip Redis during build time
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build'
  ) {
    console.warn('[Redis] Skipping Redis configuration during build time');
    return null;
  }

  // Try different environment variable naming conventions
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_ENDPOINT_URL;

  const redisToken =
    process.env.REDIS_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_PASSWORD;

  if (!redisUrl) {
    // Silently fall back to memory cache in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    console.warn('[Redis] No Redis URL found in environment variables');
    console.warn(
      '[Redis] Tried: REDIS_URL, UPSTASH_REDIS_REST_URL, KV_REST_API_URL, REDIS_ENDPOINT_URL'
    );
    return null;
  }

  return {
    url: redisUrl,
    token: redisToken,
    maxRetries: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
    commandTimeout: 5000,
    connectTimeout: 10000,
  };
}

/**
 * Initialize Redis client with proper configuration
 */
export async function initializeRedisClient(): Promise<Redis | null> {
  // Return existing client if already initialized
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  // Prevent multiple initialization attempts
  if (isInitializing) {
    console.log('[Redis] Initialization already in progress');
    return null;
  }

  const config = getRedisConfig();
  if (!config) {
    return null;
  }

  isInitializing = true;

  try {
    console.log('[Redis] Initializing Redis client...');

    // Create Redis client with configuration
    const client = new Redis(config.url, {
      maxRetries: config.maxRetries,
      retryDelayOnFailover: config.retryDelayOnFailover,
      lazyConnect: config.lazyConnect,
      commandTimeout: config.commandTimeout,
      connectTimeout: config.connectTimeout,
      // Add headers for Vercel KV if token is provided
      ...(config.token && {
        auth: {
          password: config.token,
        },
      }),
    });

    // Set up event handlers
    client.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    client.on('ready', () => {
      console.log('[Redis] Client ready');
    });

    client.on('error', (error) => {
      console.error('[Redis] Connection error:', error);
    });

    client.on('close', () => {
      console.log('[Redis] Connection closed');
    });

    client.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    // Test the connection
    await client.ping();

    redisClient = client;
    console.log('[Redis] Client initialized successfully');
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize client:', error);
    isInitializing = false;
    return null;
  } finally {
    isInitializing = false;
  }
}

/**
 * Get Redis client (initialize if needed)
 */
export async function getRedisClient(): Promise<Redis | null> {
  if (!redisClient || redisClient.status !== 'ready') {
    return await initializeRedisClient();
  }
  return redisClient;
}

/**
 * Generic cache operations
 */
export class RedisCache {
  /**
   * Set a value in cache with TTL
   */
  static async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await client.setex(key, ttlSeconds, serializedValue);
      return true;
    } catch (error) {
      console.error('[Redis] Set operation failed:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  static async get<T>(key: string): Promise<CacheResult<T>> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return { data: null, cached: false, error: 'Redis not available' };
      }

      const value = await client.get(key);
      if (value === null) {
        return { data: null, cached: false };
      }

      const parsedValue = JSON.parse(value) as T;
      return { data: parsedValue, cached: true };
    } catch (error) {
      console.error('[Redis] Get operation failed:', error);
      return {
        data: null,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a key from cache
   */
  static async del(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      await client.del(key);
      return true;
    } catch (error) {
      console.error('[Redis] Delete operation failed:', error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('[Redis] Exists operation failed:', error);
      return false;
    }
  }

  /**
   * Set key expiration
   */
  static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return false;
      }

      const result = await client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error('[Redis] Expire operation failed:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  static async ttl(key: string): Promise<number> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return -1;
      }

      return await client.ttl(key);
    } catch (error) {
      console.error('[Redis] TTL operation failed:', error);
      return -1;
    }
  }

  /**
   * Increment a numeric value
   */
  static async incr(key: string, amount: number = 1): Promise<number | null> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return null;
      }

      if (amount === 1) {
        return await client.incr(key);
      } else {
        return await client.incrby(key, amount);
      }
    } catch (error) {
      console.error('[Redis] Increment operation failed:', error);
      return null;
    }
  }

  /**
   * Clear all keys with a specific pattern
   */
  static async clearPattern(pattern: string): Promise<number> {
    try {
      const client = await getRedisClient();
      if (!client) {
        return 0;
      }

      const keys = await client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await client.del(...keys);
      return result;
    } catch (error) {
      console.error('[Redis] Clear pattern operation failed:', error);
      return 0;
    }
  }
}

/**
 * Cache health check
 */
export async function checkRedisHealth(): Promise<{
  connected: boolean;
  error?: string;
  latency?: number;
}> {
  try {
    const client = await getRedisClient();
    if (!client) {
      return { connected: false, error: 'Redis client not available' };
    }

    const startTime = Date.now();
    await client.ping();
    const latency = Date.now() - startTime;

    return { connected: true, latency };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Graceful shutdown
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('[Redis] Client closed gracefully');
    } catch (error) {
      console.error('[Redis] Error closing client:', error);
    }
  }
}

// Export the cache class as default
export default RedisCache;
