import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitStatus,
  rateLimitMiddleware,
  type RateLimitConfig,
  type RateLimitResult,
} from '../rateLimit';

describe('rateLimit utilities', () => {
  // Mock Date.now() for predictable time-based testing
  let mockNow = 1000000000;
  const originalDateNow = Date.now;

  beforeEach(() => {
    // Mock Date.now
    mockNow = 1000000000;
    global.Date.now = vi.fn(() => mockNow);

    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  afterEach(() => {
    // Restore Date.now
    global.Date.now = originalDateNow;

    // Clean up
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    describe('Basic Functionality', () => {
      it('should allow first request within limit', () => {
        const result = checkRateLimit('user-1', { limit: 10, windowMs: 60000 });

        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.resetAt).toBe(mockNow + 60000);
        expect(result.resetIn).toBe(60000);
      });

      it('should allow multiple requests within limit', () => {
        const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

        // Make 5 requests
        for (let i = 1; i <= 5; i++) {
          const result = checkRateLimit('user-1', config);
          expect(result.allowed).toBe(true);
          expect(result.count).toBe(i);
        }
      });

      it('should deny requests exceeding limit', () => {
        const config: RateLimitConfig = { limit: 3, windowMs: 60000 };

        // Make 3 allowed requests
        checkRateLimit('user-1', config);
        checkRateLimit('user-1', config);
        checkRateLimit('user-1', config);

        // 4th request should be denied
        const result = checkRateLimit('user-1', config);
        expect(result.allowed).toBe(false);
        expect(result.count).toBe(4);
        expect(result.limit).toBe(3);
      });

      it('should use default config when not provided', () => {
        const result = checkRateLimit('user-1');

        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
        expect(result.limit).toBe(100); // Default limit
        expect(result.resetIn).toBe(60000); // Default windowMs
      });
    });

    describe('Time Window Expiration', () => {
      it('should reset count after window expires', () => {
        const config: RateLimitConfig = { limit: 3, windowMs: 60000 };

        // Make 3 requests at t=0
        checkRateLimit('user-1', config);
        checkRateLimit('user-1', config);
        checkRateLimit('user-1', config);

        // Advance time past the window
        mockNow += 60001;

        // Next request should be allowed (new window)
        const result = checkRateLimit('user-1', config);
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
      });

      it('should maintain count within same window', () => {
        const config: RateLimitConfig = { limit: 10, windowMs: 60000 };

        checkRateLimit('user-1', config);
        checkRateLimit('user-1', config);

        // Advance time but stay within window
        mockNow += 30000;

        const result = checkRateLimit('user-1', config);
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(3);
        expect(result.resetIn).toBe(30000); // 30s remaining
      });

      it('should calculate resetIn correctly as time progresses', () => {
        const config: RateLimitConfig = { limit: 10, windowMs: 60000 };

        const firstResult = checkRateLimit('user-1', config);
        expect(firstResult.resetIn).toBe(60000);

        // Advance 10 seconds
        mockNow += 10000;
        const secondResult = checkRateLimit('user-1', config);
        expect(secondResult.resetIn).toBe(50000);

        // Advance another 25 seconds
        mockNow += 25000;
        const thirdResult = checkRateLimit('user-1', config);
        expect(thirdResult.resetIn).toBe(25000);
      });
    });

    describe('Multiple Keys (Isolation)', () => {
      it('should track different keys independently', () => {
        const config: RateLimitConfig = { limit: 2, windowMs: 60000 };

        // User 1 makes 2 requests
        checkRateLimit('user-1', config);
        checkRateLimit('user-1', config);

        // User 2 should still be allowed
        const user2Result = checkRateLimit('user-2', config);
        expect(user2Result.allowed).toBe(true);
        expect(user2Result.count).toBe(1);

        // User 1 should be at limit
        const user1Result = checkRateLimit('user-1', config);
        expect(user1Result.allowed).toBe(false);
        expect(user1Result.count).toBe(3);
      });

      it('should handle many concurrent keys', () => {
        const config: RateLimitConfig = { limit: 1, windowMs: 60000 };

        // Create rate limits for 100 different users
        for (let i = 0; i < 100; i++) {
          const result = checkRateLimit(`user-${i}`, config);
          expect(result.allowed).toBe(true);
          expect(result.count).toBe(1);
        }

        // Each user's second request should be denied
        for (let i = 0; i < 100; i++) {
          const result = checkRateLimit(`user-${i}`, config);
          expect(result.allowed).toBe(false);
          expect(result.count).toBe(2);
        }
      });
    });

    describe('Different Window Sizes', () => {
      it('should work with short windows (1 second)', () => {
        const config: RateLimitConfig = { limit: 5, windowMs: 1000 };

        const result = checkRateLimit('user-1', config);
        expect(result.allowed).toBe(true);
        expect(result.resetIn).toBe(1000);
      });

      it('should work with long windows (1 hour)', () => {
        const config: RateLimitConfig = { limit: 100, windowMs: 3600000 };

        const result = checkRateLimit('user-1', config);
        expect(result.allowed).toBe(true);
        expect(result.resetIn).toBe(3600000);
      });

      it('should work with very large limits', () => {
        const config: RateLimitConfig = { limit: 10000, windowMs: 60000 };

        // Make 1000 requests
        for (let i = 0; i < 1000; i++) {
          const result = checkRateLimit('user-1', config);
          expect(result.allowed).toBe(true);
        }

        const finalResult = checkRateLimit('user-1', config);
        expect(finalResult.count).toBe(1001);
        expect(finalResult.allowed).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle limit of 1', () => {
        const config: RateLimitConfig = { limit: 1, windowMs: 60000 };

        const first = checkRateLimit('user-1', config);
        expect(first.allowed).toBe(true);

        const second = checkRateLimit('user-1', config);
        expect(second.allowed).toBe(false);
      });

      it('should handle limit of 0 (first request always allowed)', () => {
        const config: RateLimitConfig = { limit: 0, windowMs: 60000 };

        // First request is always allowed (establishes rate limit record)
        const first = checkRateLimit('user-1', config);
        expect(first.allowed).toBe(true);
        expect(first.count).toBe(1);
        expect(first.limit).toBe(0);

        // Second request with limit=0 should be denied
        const second = checkRateLimit('user-1', config);
        expect(second.allowed).toBe(false);
        expect(second.count).toBe(2);
      });

      it('should handle empty string key', () => {
        const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

        const result = checkRateLimit('', config);
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
      });

      it('should handle special characters in key', () => {
        const config: RateLimitConfig = { limit: 5, windowMs: 60000 };
        const specialKey = 'user@example.com:192.168.1.1';

        const result = checkRateLimit(specialKey, config);
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
      });

      it('should handle very long keys', () => {
        const config: RateLimitConfig = { limit: 5, windowMs: 60000 };
        const longKey = 'a'.repeat(1000);

        const result = checkRateLimit(longKey, config);
        expect(result.allowed).toBe(true);
      });
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for specific key', () => {
      const config: RateLimitConfig = { limit: 3, windowMs: 60000 };

      // Make 3 requests
      checkRateLimit('user-1', config);
      checkRateLimit('user-1', config);
      checkRateLimit('user-1', config);

      // Reset
      resetRateLimit('user-1');

      // Should be allowed again
      const result = checkRateLimit('user-1', config);
      expect(result.allowed).toBe(true);
      expect(result.count).toBe(1);
    });

    it('should not affect other keys', () => {
      const config: RateLimitConfig = { limit: 2, windowMs: 60000 };

      // User 1 and User 2 make requests
      checkRateLimit('user-1', config);
      checkRateLimit('user-2', config);

      // Reset only user 1
      resetRateLimit('user-1');

      // User 1 should be reset
      const user1Result = checkRateLimit('user-1', config);
      expect(user1Result.count).toBe(1);

      // User 2 should still have count
      const user2Result = checkRateLimit('user-2', config);
      expect(user2Result.count).toBe(2);
    });

    it('should handle non-existent keys gracefully', () => {
      expect(() => resetRateLimit('non-existent-key')).not.toThrow();
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limit records', () => {
      const config: RateLimitConfig = { limit: 2, windowMs: 60000 };

      // Create rate limits for multiple users
      checkRateLimit('user-1', config);
      checkRateLimit('user-2', config);
      checkRateLimit('user-3', config);

      // Clear all
      clearAllRateLimits();

      // All users should be reset
      const user1Result = checkRateLimit('user-1', config);
      expect(user1Result.count).toBe(1);

      const user2Result = checkRateLimit('user-2', config);
      expect(user2Result.count).toBe(1);

      const user3Result = checkRateLimit('user-3', config);
      expect(user3Result.count).toBe(1);
    });

    it('should work when called on empty store', () => {
      expect(() => clearAllRateLimits()).not.toThrow();
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return current status without incrementing', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

      // Make 2 requests
      checkRateLimit('user-1', config);
      checkRateLimit('user-1', config);

      // Check status (should not increment)
      const status = getRateLimitStatus('user-1', config);
      expect(status).not.toBeNull();
      expect(status!.count).toBe(2);
      expect(status!.allowed).toBe(true);

      // Verify count didn't increment
      const nextStatus = getRateLimitStatus('user-1', config);
      expect(nextStatus!.count).toBe(2);
    });

    it('should return null for non-existent key', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

      const status = getRateLimitStatus('non-existent', config);
      expect(status).toBeNull();
    });

    it('should return null for expired window', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

      // Create rate limit
      checkRateLimit('user-1', config);

      // Advance time past window
      mockNow += 60001;

      // Should return null (expired)
      const status = getRateLimitStatus('user-1', config);
      expect(status).toBeNull();
    });

    it('should show allowed=false when at limit', () => {
      const config: RateLimitConfig = { limit: 3, windowMs: 60000 };

      // Make 3 requests (at limit)
      checkRateLimit('user-1', config);
      checkRateLimit('user-1', config);
      checkRateLimit('user-1', config);

      // Status should show not allowed
      const status = getRateLimitStatus('user-1', config);
      expect(status).not.toBeNull();
      expect(status!.count).toBe(3);
      expect(status!.allowed).toBe(false); // count >= limit
    });

    it('should calculate resetIn correctly', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

      checkRateLimit('user-1', config);

      // Advance 20 seconds
      mockNow += 20000;

      const status = getRateLimitStatus('user-1', config);
      expect(status!.resetIn).toBe(40000); // 40s remaining
    });
  });

  describe('rateLimitMiddleware', () => {
    it('should return null when request is allowed', () => {
      const config: RateLimitConfig = { limit: 10, windowMs: 60000 };

      const response = rateLimitMiddleware('user-1', config);
      expect(response).toBeNull();
    });

    it('should return 429 Response when rate limited', () => {
      const config: RateLimitConfig = { limit: 2, windowMs: 60000 };

      // Make 2 allowed requests
      rateLimitMiddleware('user-1', config);
      rateLimitMiddleware('user-1', config);

      // 3rd request should return 429
      const response = rateLimitMiddleware('user-1', config);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(429);
    });

    it('should include proper error message in response body', async () => {
      const config: RateLimitConfig = { limit: 1, windowMs: 60000 };

      rateLimitMiddleware('user-1', config);
      const response = rateLimitMiddleware('user-1', config);

      expect(response).not.toBeNull();
      const body = await response!.json();

      expect(body.error).toBe('Rate limit exceeded');
      expect(body.message).toContain('Too many requests');
      expect(body.limit).toBe(1);
      expect(body.current).toBe(2);
      expect(body.resetAt).toBeDefined();
      expect(body.resetIn).toBeDefined();
    });

    it('should include rate limit headers', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        rateLimitMiddleware('user-1', config);
      }

      // 6th request should have headers
      const response = rateLimitMiddleware('user-1', config);
      expect(response).not.toBeNull();

      const headers = response!.headers;
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('X-RateLimit-Limit')).toBe('5');
      expect(headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(headers.get('X-RateLimit-Reset')).toBeDefined();
      expect(headers.get('Retry-After')).toBeDefined();
    });

    it('should include Retry-After header in seconds', () => {
      const config: RateLimitConfig = { limit: 1, windowMs: 60000 };

      rateLimitMiddleware('user-1', config);
      const response = rateLimitMiddleware('user-1', config);

      expect(response).not.toBeNull();
      const retryAfter = response!.headers.get('Retry-After');
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter!)).toBeLessThanOrEqual(60);
      expect(parseInt(retryAfter!)).toBeGreaterThan(0);
    });

    it('should calculate X-RateLimit-Remaining correctly', () => {
      const config: RateLimitConfig = { limit: 10, windowMs: 60000 };

      // Make 3 requests
      rateLimitMiddleware('user-1', config);
      rateLimitMiddleware('user-1', config);
      rateLimitMiddleware('user-1', config);

      // 4th request should show 6 remaining
      const fourthResult = checkRateLimit('user-1', config);
      expect(fourthResult.count).toBe(4);

      // Make requests until rate limited
      for (let i = 0; i < 7; i++) {
        rateLimitMiddleware('user-1', config);
      }

      const response = rateLimitMiddleware('user-1', config);
      expect(response).not.toBeNull();
      expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should work with default config', () => {
      // Default is 100 requests per 60 seconds
      for (let i = 0; i < 100; i++) {
        const response = rateLimitMiddleware('user-1');
        expect(response).toBeNull();
      }

      // 101st request should be rate limited
      const response = rateLimitMiddleware('user-1');
      expect(response).not.toBeNull();
      expect(response!.status).toBe(429);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle authentication flow (strict limit)', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 300000 }; // 5 attempts per 5 minutes

      // User makes 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const response = rateLimitMiddleware('user@example.com', config);
        expect(response).toBeNull();
      }

      // 6th attempt should be blocked
      const blocked = rateLimitMiddleware('user@example.com', config);
      expect(blocked).not.toBeNull();
      expect(blocked!.status).toBe(429);
    });

    it('should handle API endpoint with generous limit', () => {
      const config: RateLimitConfig = { limit: 1000, windowMs: 60000 }; // 1000 per minute

      // Make 500 requests
      for (let i = 0; i < 500; i++) {
        const response = rateLimitMiddleware('api-user-123', config);
        expect(response).toBeNull();
      }

      // Check status (should still have room)
      const status = getRateLimitStatus('api-user-123', config);
      expect(status!.count).toBe(500);
      expect(status!.allowed).toBe(true);
    });

    it('should handle burst traffic then cooldown', () => {
      const config: RateLimitConfig = { limit: 10, windowMs: 10000 };

      // Burst of 10 requests
      for (let i = 0; i < 10; i++) {
        checkRateLimit('user-1', config);
      }

      // Next request denied
      const denied = checkRateLimit('user-1', config);
      expect(denied.allowed).toBe(false);

      // Wait for window to expire
      mockNow += 10001;

      // Should be allowed again
      const allowed = checkRateLimit('user-1', config);
      expect(allowed.allowed).toBe(true);
      expect(allowed.count).toBe(1);
    });

    it('should handle IP-based rate limiting', () => {
      const config: RateLimitConfig = { limit: 100, windowMs: 60000 };
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP 1 makes many requests
      for (let i = 0; i < 100; i++) {
        checkRateLimit(ip1, config);
      }

      // IP 1 should be rate limited
      const ip1Result = checkRateLimit(ip1, config);
      expect(ip1Result.allowed).toBe(false);

      // IP 2 should still be allowed
      const ip2Result = checkRateLimit(ip2, config);
      expect(ip2Result.allowed).toBe(true);
    });

    it('should handle admin bypass pattern', () => {
      const config: RateLimitConfig = { limit: 10, windowMs: 60000 };

      // Regular user hits limit
      for (let i = 0; i < 10; i++) {
        checkRateLimit('user-1', config);
      }
      const userDenied = checkRateLimit('user-1', config);
      expect(userDenied.allowed).toBe(false);

      // Admin can reset user's limit
      resetRateLimit('user-1');

      // User can make requests again
      const userAllowed = checkRateLimit('user-1', config);
      expect(userAllowed.allowed).toBe(true);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid successive calls', () => {
      const config: RateLimitConfig = { limit: 1000, windowMs: 60000 };

      // Make 1000 rapid requests
      for (let i = 0; i < 1000; i++) {
        const result = checkRateLimit('stress-test-user', config);
        expect(result.count).toBe(i + 1);
      }

      const finalResult = checkRateLimit('stress-test-user', config);
      expect(finalResult.allowed).toBe(false);
      expect(finalResult.count).toBe(1001);
    });

    it('should handle many unique keys efficiently', () => {
      const config: RateLimitConfig = { limit: 5, windowMs: 60000 };

      // Create 1000 different rate limit records
      for (let i = 0; i < 1000; i++) {
        const result = checkRateLimit(`user-${i}`, config);
        expect(result.allowed).toBe(true);
        expect(result.count).toBe(1);
      }

      // Verify all are still independent
      const firstUserResult = checkRateLimit('user-0', config);
      expect(firstUserResult.count).toBe(2);

      const lastUserResult = checkRateLimit('user-999', config);
      expect(lastUserResult.count).toBe(2);
    });
  });
});
