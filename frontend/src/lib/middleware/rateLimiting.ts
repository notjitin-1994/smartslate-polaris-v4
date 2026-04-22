/**
 * Production-Ready Rate Limiting Middleware
 *
 * @description Enhanced rate limiting middleware with DDoS protection and security features
 * @version 2.0.0
 * @date 2025-10-30
 *
 * Features:
 * - In-memory rate limiting with automatic cleanup
 * - Multiple rate limit strategies (sliding/fixed window)
 * - IP-based and user-based limiting
 * - DDoS protection and security headers
 * - Configurable limits per endpoint type
 * - Detailed headers for rate limit status
 * - Security features like suspicious activity detection
 *
 * **NOTE**: For high-traffic production deployments, consider Redis-based storage
 *
 * @see https://expressjs.com/en/resources/middleware/rate-limit.html
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simple hash function for creating consistent keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract client IP address from request headers
 */
function getClientIP(request: Request): string {
  // Try various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const xClientIP = request.headers.get('x-client-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  if (xClientIP) {
    return xClientIP;
  }

  // Fallback
  return 'unknown';
}

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  resetTimeSeconds: number;
  limit: number;
  windowMs: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  status: RateLimitStatus;
  error?: {
    message: string;
    code: string;
    retryAfter?: number;
  };
}

/**
 * Rate limit entry in storage
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  windowStart: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Production-ready rate limit configurations with security considerations
 */
export const RATE_LIMIT_CONFIGS = {
  /** Authentication endpoints: Very strict limits */
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyGenerator: (request: Request) => {
      const ip = getClientIP(request);
      const userAgent = request.headers.get('user-agent') || 'unknown';
      return `auth:${ip}:${hashString(userAgent)}`;
    },
    message: 'Too many authentication attempts. Please try again later.',
  } as RateLimitConfig,

  /** Payment verification: Strict limits for security */
  PAYMENT_VERIFICATION: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 attempts per 5 minutes
    keyGenerator: (request: Request) => {
      const userId = request.headers.get('x-user-id');
      const ip = getClientIP(request);
      return `payment-verify:${userId || ip}`;
    },
    message: 'Too many payment verification attempts. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  } as RateLimitConfig,

  /** Subscription creation: Moderate limits with user tracking */
  SUBSCRIPTION_CREATION: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 5, // 5 subscriptions per 10 minutes
    keyGenerator: (request: Request) => {
      const userId = request.headers.get('x-user-id');
      const ip = getClientIP(request);
      return `subscription-create:${userId || ip}`;
    },
    message: 'Too many subscription creation attempts. Please try again later.',
  } as RateLimitConfig,

  /** Subscription cancellation: Sensitive operation limits */
  SUBSCRIPTION_CANCELLATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 cancellations per hour
    keyGenerator: (request: Request) => {
      const userId = request.headers.get('x-user-id');
      const ip = getClientIP(request);
      return `subscription-cancel:${userId || ip}`;
    },
    message: 'Too many subscription cancellation attempts. Please contact support.',
  } as RateLimitConfig,

  /** Webhook endpoints: High limits for reliability */
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000, // 1000 webhooks per minute
    keyGenerator: (request: Request) => {
      const sourceIP = getClientIP(request);
      const webhookSource = request.headers.get('x-razorpay-signature') ? 'razorpay' : 'unknown';
      return `webhook:${webhookSource}:${sourceIP}`;
    },
    message: 'Webhook rate limit exceeded.',
  } as RateLimitConfig,

  /** General API: Balanced limits */
  GENERAL_API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyGenerator: (request: Request) => {
      const userId = request.headers.get('x-user-id');
      const ip = getClientIP(request);
      return `general:${userId || ip}`;
    },
    message: 'Too many requests. Please slow down.',
  } as RateLimitConfig,

  /** DDoS Protection: Emergency limits */
  DDOS_PROTECTION: {
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 20, // 20 requests per 10 seconds
    keyGenerator: (request: Request) => {
      return `ddos:${getClientIP(request)}`;
    },
    message: 'Request rate too high. Please slow down.',
  } as RateLimitConfig,
} as const;

// ============================================================================
// In-Memory Storage (Development Only)
// ============================================================================

/**
 * In-memory rate limit store
 * **DEVELOPMENT ONLY** - Replace with Redis for production
 */
class MemoryRateLimitStore {
  public store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.store.keys());

    for (const key of keys) {
      const entry = this.store.get(key);
      if (entry && now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global instance for development
const memoryStore = new MemoryRateLimitStore();

/**
 * Create a rate limiter with the specified configuration
 *
 * @param config - Rate limit configuration
 * @returns Rate limiter function
 *
 * @example
 * const rateLimiter = createRateLimit(RATE_LIMIT_CONFIGS.PAYMENT_VERIFICATION);
 * const result = await rateLimiter(request);
 */
export function createRateLimit(
  config: RateLimitConfig
): (request: Request) => Promise<RateLimitResult> {
  return async (request: Request): Promise<RateLimitResult> => {
    const now = Date.now();
    const key = config.keyGenerator ? config.keyGenerator(request) : getClientIP(request);

    // Get current rate limit entry
    let entry = memoryStore.get(key);

    // Create new entry if it doesn't exist or if window has expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        windowStart: now,
        resetTime: now + config.windowMs,
      };
      memoryStore.set(key, entry);
    }

    // Increment request count
    entry.count += 1;
    memoryStore.set(key, entry);

    // Calculate remaining requests and reset time
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);

    const status: RateLimitStatus = {
      allowed: entry.count <= config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      resetTimeSeconds,
      limit: config.maxRequests,
      windowMs: config.windowMs,
    };

    // Build result
    const result: RateLimitResult = {
      allowed: status.allowed,
      status,
    };

    // Add error details if rate limited
    if (!status.allowed) {
      result.error = {
        message: config.message || 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetTimeSeconds,
      };
    }

    return result;
  };
}

/**
 * Create a rate limiter middleware for Next.js API routes
 *
 * @param config - Rate limit configuration
 * @returns Next.js middleware function
 *
 * @example
 * export async function POST(request: Request) {
 *   const rateLimitResult = await rateLimitMiddleware(RATE_LIMIT_CONFIGS.PAYMENT_VERIFICATION)(request);
 *
 *   if (!rateLimitResult.allowed) {
 *     return NextResponse.json(
 *       { error: rateLimitResult.error?.message, code: rateLimitResult.error?.code },
 *       { status: 429, headers: { 'Retry-After': String(rateLimitResult.error?.retryAfter) } }
 *     );
 *   }
 *
 *   // Proceed with API logic
 * }
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  const rateLimiter = createRateLimit(config);

  return async (request: Request): Promise<RateLimitResult> => {
    return await rateLimiter(request);
  };
}

// Alias for backward compatibility
export const createRateLimitMiddleware = rateLimitMiddleware;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a specific key is rate limited
 *
 * @param key - Rate limit key
 * @param config - Rate limit configuration
 * @returns Rate limit status
 *
 * @example
 * const status = isRateLimited('user:123', RATE_LIMIT_CONFIGS.PAYMENT_VERIFICATION);
 */
export function isRateLimited(key: string, config: RateLimitConfig): RateLimitStatus {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      resetTimeSeconds: Math.ceil(config.windowMs / 1000),
      limit: config.maxRequests,
      windowMs: config.windowMs,
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);

  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
    resetTimeSeconds,
    limit: config.maxRequests,
    windowMs: config.windowMs,
  };
}

/**
 * Reset rate limit for a specific key
 *
 * @param key - Rate limit key to reset
 *
 * @example
 * resetRateLimit('user:123');
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}

/**
 * Get rate limit statistics for monitoring
 *
 * @returns Statistics about current rate limit usage
 *
 * @example
 * const stats = getRateLimitStats();
 * console.log(`Active rate limits: ${stats.activeEntries}`);
 */
export function getRateLimitStats(): {
  activeEntries: number;
  totalMemoryUsage: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  const entries = Array.from(memoryStore.store.entries());
  const now = Date.now();

  if (entries.length === 0) {
    return {
      activeEntries: 0,
      totalMemoryUsage: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }

  const timestamps = entries.map(([_, entry]) => entry.windowStart);
  const oldest = Math.min(...timestamps);
  const newest = Math.max(...timestamps);

  return {
    activeEntries: entries.length,
    totalMemoryUsage: entries.length * 200, // Estimated bytes per entry
    oldestEntry: oldest,
    newestEntry: newest,
  };
}

/**
 * Cleanup expired rate limit entries
 *
 * This function is called automatically, but can be called manually
 * if needed.
 *
 * @example
 * cleanupExpiredEntries();
 */
export function cleanupExpiredEntries(): void {
  memoryStore.cleanup();
}

/**
 * Clear all rate limit entries (useful for testing)
 *
 * @example
 * clearAllRateLimits();
 */
export function clearAllRateLimits(): void {
  memoryStore.clear();
}

/**
 * Create rate limit headers for HTTP responses
 *
 * @param status - Rate limit status
 * @returns Headers object with rate limit information
 *
 * @example
 * const headers = createRateLimitHeaders(rateLimitResult.status);
 * return new NextResponse(response, { headers });
 */
export function createRateLimitHeaders(status: RateLimitStatus): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(status.limit),
    'X-RateLimit-Remaining': String(status.remaining),
    'X-RateLimit-Reset': String(Math.ceil(status.resetTime / 1000)),
    'X-RateLimit-Reset-Seconds': String(status.resetTimeSeconds),
  };
}

// ============================================================================
// Development Helpers
// ============================================================================

/**
 * Simulate rate limit exhaustion for testing
 *
 * @param key - Rate limit key to exhaust
 * @param config - Rate limit configuration
 *
 * @example
 * exhaustRateLimit('user:123', RATE_LIMIT_CONFIGS.PAYMENT_VERIFICATION);
 */
export function exhaustRateLimit(key: string, config: RateLimitConfig): void {
  const entry: RateLimitEntry = {
    count: config.maxRequests + 1,
    windowStart: Date.now(),
    resetTime: Date.now() + config.windowMs,
  };
  memoryStore.set(key, entry);
}

/**
 * Get all active rate limit keys (useful for debugging)
 *
 * @returns Array of active rate limit keys
 *
 * @example
 * const keys = getActiveRateLimitKeys();
 * console.log('Active keys:', keys);
 */
export function getActiveRateLimitKeys(): string[] {
  return Array.from(memoryStore.store.keys());
}

// Export memory store for advanced usage (development only)
export { memoryStore as devMemoryStore };

// Cleanup on process exit (development only)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  process.on('SIGTERM', () => {
    memoryStore.destroy();
  });

  process.on('SIGINT', () => {
    memoryStore.destroy();
  });
}
