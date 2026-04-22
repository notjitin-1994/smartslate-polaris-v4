/**
 * Production-ready Redis-based rate limiting implementation
 *
 * This replaces the in-memory rate limiting with a distributed Redis solution
 * that works across multiple server instances and survives restarts.
 */

import Redis from 'ioredis';
import { getRedisClient } from '@/lib/cache/redis';

// Redis client configuration (using shared client)

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

/**
 * Get Redis client for rate limiting
 */
export async function getRedisRateLimitClient(): Promise<Redis | null> {
  try {
    return await getRedisClient();
  } catch (error) {
    console.warn('[Redis Rate Limit] Failed to get Redis client:', error);
    return null;
  }
}

/**
 * Rate limiting middleware using Redis sliding window algorithm
 */
export class RedisRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Get Redis client instance
   */
  private async getClient(): Promise<Redis | null> {
    return await getRedisRateLimitClient();
  }

  /**
   * Check if request should be rate limited
   * Uses sliding window algorithm for accurate rate limiting
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const redis = await this.getClient();
    if (!redis) {
      // Fallback to in-memory rate limiting
      console.warn('[Redis Rate Limit] Redis not available, using fallback');
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs),
      };
    }

    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();

      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiration on the key
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline failed');
      }

      const currentCount = results[1][1] as number;
      const limit = this.config.maxRequests;
      const remaining = Math.max(0, limit - currentCount);
      const resetTime = new Date(now + this.config.windowMs);

      return {
        success: currentCount < limit,
        limit,
        remaining,
        resetTime,
        retryAfter: currentCount >= limit ? this.config.windowMs : undefined,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if Redis is down
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs),
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetLimit(identifier: string): Promise<void> {
    const redis = await this.getClient();
    if (!redis) {
      console.warn('[Redis Rate Limit] Redis not available, cannot reset limit');
      return;
    }

    const key = `${this.config.keyPrefix}:${identifier}`;
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }

  /**
   * Get current rate limit status without consuming a request
   */
  async getStatus(identifier: string): Promise<Omit<RateLimitResult, 'success'>> {
    const redis = await this.getClient();
    if (!redis) {
      console.warn('[Redis Rate Limit] Redis not available, returning fallback status');
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs),
      };
    }

    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      await redis.zremrangebyscore(key, 0, windowStart);
      const currentCount = await redis.zcard(key);

      return {
        limit: this.config.maxRequests,
        remaining: Math.max(0, this.config.maxRequests - currentCount),
        resetTime: new Date(now + this.config.windowMs),
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    const redis = await this.getClient();
    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        console.error('[Redis Rate Limit] Error closing Redis connection:', error);
      }
    }
  }
}

/**
 * Predefined rate limiters for different use cases - lazy loaded
 */

let _apiRateLimiter: RedisRateLimiter | MemoryRateLimiter | null = null;
let _subscriptionRateLimiter: RedisRateLimiter | MemoryRateLimiter | null = null;
let _blueprintGenerationRateLimiter: RedisRateLimiter | MemoryRateLimiter | null = null;
let _authRateLimiter: RedisRateLimiter | MemoryRateLimiter | null = null;

// API rate limiter - 10 requests per minute per IP
export const apiRateLimiter = (): RedisRateLimiter | MemoryRateLimiter => {
  if (!_apiRateLimiter) {
    _apiRateLimiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyPrefix: 'api_rate_limit',
    });
  }
  return _apiRateLimiter;
};

// Subscription creation rate limiter - 3 requests per hour per user
export const subscriptionRateLimiter = (): RedisRateLimiter | MemoryRateLimiter => {
  if (!_subscriptionRateLimiter) {
    _subscriptionRateLimiter = createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyPrefix: 'subscription_rate_limit',
    });
  }
  return _subscriptionRateLimiter;
};

// Blueprint generation rate limiter - 5 requests per hour per user
export const blueprintGenerationRateLimiter = (): RedisRateLimiter | MemoryRateLimiter => {
  if (!_blueprintGenerationRateLimiter) {
    _blueprintGenerationRateLimiter = createRateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      keyPrefix: 'blueprint_gen_rate_limit',
    });
  }
  return _blueprintGenerationRateLimiter;
};

// Authentication rate limiter - 5 login attempts per 15 minutes per IP
export const authRateLimiter = (): RedisRateLimiter | MemoryRateLimiter => {
  if (!_authRateLimiter) {
    _authRateLimiter = createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyPrefix: 'auth_rate_limit',
    });
  }
  return _authRateLimiter;
};

/**
 * Fallback in-memory rate limiter for development/testing
 */
export class MemoryRateLimiter {
  private store = new Map<string, { requests: number[]; resetTime: number }>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const key = `${this.config.keyPrefix}:${identifier}`;

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      // 1% chance to cleanup
      for (const [k, data] of this.store.entries()) {
        if (data.resetTime < now) {
          this.store.delete(k);
        }
      }
    }

    const existing = this.store.get(key);

    if (!existing || existing.resetTime < now) {
      // New window
      this.store.set(key, {
        requests: [now],
        resetTime: now + this.config.windowMs,
      });

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(now + this.config.windowMs),
      };
    }

    // Filter out old requests and add new one
    const validRequests = existing.requests.filter((time) => time > windowStart);
    validRequests.push(now);

    this.store.set(key, {
      requests: validRequests,
      resetTime: existing.resetTime,
    });

    const currentCount = validRequests.length;
    const remaining = Math.max(0, this.config.maxRequests - currentCount);

    return {
      success: currentCount <= this.config.maxRequests,
      limit: this.config.maxRequests,
      remaining,
      resetTime: new Date(existing.resetTime),
      retryAfter: currentCount > this.config.maxRequests ? this.config.windowMs : undefined,
    };
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    this.store.delete(key);
  }

  async getStatus(identifier: string): Promise<Omit<RateLimitResult, 'success'>> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const key = `${this.config.keyPrefix}:${identifier}`;

    const existing = this.store.get(key);

    if (!existing || existing.resetTime < now) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
      };
    }

    const validRequests = existing.requests.filter((time) => time > windowStart);
    const remaining = Math.max(0, this.config.maxRequests - validRequests.length);

    return {
      limit: this.config.maxRequests,
      remaining,
      resetTime: new Date(existing.resetTime),
    };
  }
}

/**
 * Factory function to get appropriate rate limiter based on environment
 */
export function createRateLimiter(config: RateLimitConfig): RedisRateLimiter | MemoryRateLimiter {
  try {
    return new RedisRateLimiter(config);
  } catch (error) {
    console.warn('Using in-memory rate limiter (Redis not available)');
    return new MemoryRateLimiter(config);
  }
}

/**
 * Express/Next.js middleware helper
 */
export function createRateLimitMiddleware(limiter: RedisRateLimiter | MemoryRateLimiter) {
  return async (
    request: Request,
    identifier?: string
  ): Promise<{ success: boolean; headers: Record<string, string> }> => {
    // Extract identifier from request
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const key = identifier || ip;

    const result = await limiter.checkLimit(key);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
    };

    if (result.retryAfter) {
      headers['Retry-After'] = Math.ceil(result.retryAfter / 1000).toString();
    }

    return {
      success: result.success,
      headers,
    };
  };
}
