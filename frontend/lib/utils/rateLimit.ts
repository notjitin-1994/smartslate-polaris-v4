/**
 * Rate Limiting Utility
 * Simple in-memory rate limiter for API endpoints
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store for rate limits
// In production, use Redis or similar for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number;

  /**
   * Time window in milliseconds
   * Default: 60000 (1 minute)
   */
  windowMs?: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Current request count
   */
  count: number;

  /**
   * Maximum allowed requests
   */
  limit: number;

  /**
   * When the rate limit resets (Unix timestamp)
   */
  resetAt: number;

  /**
   * Time until reset in milliseconds
   */
  resetIn: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * ```ts
 * const result = checkRateLimit(userId, { limit: 100, windowMs: 60000 });
 * if (!result.allowed) {
 *   return NextResponse.json(
 *     { error: 'Rate limit exceeded', resetIn: result.resetIn },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowMs || 60000;
  const limit = config.limit;

  // Get or create rate limit record
  let record = rateLimitStore.get(key);

  // If no record or window expired, create new record
  if (!record || record.resetAt < now) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, record);

    return {
      allowed: true,
      count: 1,
      limit,
      resetAt: record.resetAt,
      resetIn: windowMs,
    };
  }

  // Increment count
  record.count++;

  // Check if limit exceeded
  const allowed = record.count <= limit;

  return {
    allowed,
    count: record.count,
    limit,
    resetAt: record.resetAt,
    resetIn: record.resetAt - now,
  };
}

/**
 * Reset rate limit for a specific key
 *
 * @param key - Unique identifier to reset
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limit records
 * Useful for testing or system maintenance
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status without incrementing
 *
 * @param key - Unique identifier to check
 * @param config - Rate limit configuration
 * @returns Current status or null if no record exists
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60000 }
): RateLimitResult | null {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    return null;
  }

  return {
    allowed: record.count < config.limit,
    count: record.count,
    limit: config.limit,
    resetAt: record.resetAt,
    resetIn: record.resetAt - now,
  };
}

/**
 * Rate limit middleware for API routes
 *
 * @param key - Unique identifier
 * @param config - Rate limit configuration
 * @returns NextResponse with 429 if rate limited, null if allowed
 *
 * @example
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const adminUser = await requireAdmin();
 *   const rateLimitResponse = rateLimitMiddleware(adminUser.id, { limit: 100 });
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // Process request...
 * }
 * ```
 */
export function rateLimitMiddleware(key: string, config?: RateLimitConfig): Response | null {
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${Math.ceil(result.resetIn / 1000)} seconds.`,
        limit: result.limit,
        current: result.count,
        resetAt: new Date(result.resetAt).toISOString(),
        resetIn: result.resetIn,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(Math.max(0, result.limit - result.count)),
          'X-RateLimit-Reset': String(result.resetAt),
          'Retry-After': String(Math.ceil(result.resetIn / 1000)),
        },
      }
    );
  }

  return null;
}
