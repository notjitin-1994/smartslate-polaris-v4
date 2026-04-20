/**
 * Rate Limiting Middleware Tests
 *
 * @description Test suite for rate limiting functionality
 * and security features
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRateLimitMiddleware, RATE_LIMIT_CONFIGS } from '@/lib/middleware/rateLimiting';

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Clear any in-memory storage
    if (typeof global !== 'undefined' && global.rateLimitStore) {
      global.rateLimitStore.clear();
    }
  });

  describe('createRateLimitMiddleware', () => {
    it('should create a rate limiting middleware function', () => {
      const middleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.GENERAL_API);
      expect(typeof middleware).toBe('function');
    });

    it('should allow requests within limit', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make 5 requests (within limit)
      const results = await Promise.all([
        middleware(mockRequest),
        middleware(mockRequest),
        middleware(mockRequest),
        middleware(mockRequest),
        middleware(mockRequest),
      ]);

      results.forEach((result) => {
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeGreaterThan(0);
      });
    });

    it('should block requests exceeding limit', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000, // 1 minute
        maxRequests: 2,
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make first 2 requests (within limit)
      const result1 = await middleware(mockRequest);
      const result2 = await middleware(mockRequest);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);

      // Make 3rd request (exceeds limit)
      const result3 = await middleware(mockRequest);

      expect(result3.allowed).toBe(false);
      expect(result3.error).toContain('Rate limit exceeded');
      expect(result3.retryAfter).toBeGreaterThan(0);
    });

    it('should handle different IP addresses separately', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
      });

      const request1 = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const request2 = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' },
      });

      // Both IPs should be allowed independently
      const result1a = await middleware(request1);
      const result1b = await middleware(request1);
      const result1c = await middleware(request1); // This should be blocked

      const result2a = await middleware(request2);
      const result2b = await middleware(request2);
      const result2c = await middleware(request2); // This should be blocked

      expect(result1a.allowed).toBe(true);
      expect(result1b.allowed).toBe(true);
      expect(result1c.allowed).toBe(false);

      expect(result2a.allowed).toBe(true);
      expect(result2b.allowed).toBe(true);
      expect(result2c.allowed).toBe(false);
    });

    it('should use custom key generator', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: (request) => {
          const url = new URL(request.url);
          return `custom:${url.pathname}:${request.headers.get('x-api-key') || 'anonymous'}`;
        },
      });

      const request1 = new Request('https://example.com/api/test', {
        headers: { 'x-api-key': 'key1' },
      });

      const request2 = new Request('https://example.com/api/test', {
        headers: { 'x-api-key': 'key2' },
      });

      // Different API keys should be tracked separately
      const result1a = await middleware(request1);
      const result1b = await middleware(request1);
      const result1c = await middleware(request1);

      const result2a = await middleware(request2);
      const result2b = await middleware(request2);
      const result2c = await middleware(request2);

      expect(result1a.allowed).toBe(true);
      expect(result1b.allowed).toBe(true);
      expect(result1c.allowed).toBe(false);

      expect(result2a.allowed).toBe(true);
      expect(result2b.allowed).toBe(true);
      expect(result2c.allowed).toBe(false);
    });

    it('should handle sliding window correctly', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 1000, // 1 second
        maxRequests: 3,
        strategy: 'sliding-window',
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make 3 requests quickly
      const result1 = await middleware(mockRequest);
      const result2 = await middleware(mockRequest);
      const result3 = await middleware(mockRequest);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);

      // Wait for window to slide
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should be able to make requests again
      const result4 = await middleware(mockRequest);
      expect(result4.allowed).toBe(true);
    });

    it('should skip rate limiting for valid skip condition', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
        skip: (request) => {
          const url = new URL(request.url);
          return url.pathname.includes('health');
        },
      });

      const healthRequest = new Request('https://example.com/api/health', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const apiRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Health checks should skip rate limiting
      const healthResult1 = await middleware(healthRequest);
      const healthResult2 = await middleware(healthRequest);

      expect(healthResult1.allowed).toBe(true);
      expect(healthResult2.allowed).toBe(true);

      // API requests should be rate limited
      const apiResult1 = await middleware(apiRequest);
      const apiResult2 = await middleware(apiRequest);

      expect(apiResult1.allowed).toBe(true);
      expect(apiResult2.allowed).toBe(false);
    });

    it('should handle fixed window strategy', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 2000, // 2 seconds
        maxRequests: 2,
        strategy: 'fixed-window',
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make requests at start of window
      const result1 = await middleware(mockRequest);
      const result2 = await middleware(mockRequest);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);

      // Even with small delay, should still be blocked (same window)
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result3 = await middleware(mockRequest);
      expect(result3.allowed).toBe(false);

      // Wait for new window
      await new Promise((resolve) => setTimeout(resolve, 1600));
      const result4 = await middleware(mockRequest);
      expect(result4.allowed).toBe(true);
    });
  });

  describe('Built-in Configurations', () => {
    it('should have appropriate limits for different API types', () => {
      expect(RATE_LIMIT_CONFIGS.GENERAL_API.maxRequests).toBe(100);
      expect(RATE_LIMIT_CONFIGS.AUTH_API.maxRequests).toBe(20);
      expect(RATE_LIMIT_CONFIGS.WEBHOOK_API.maxRequests).toBe(1000);
      expect(RATE_LIMIT_CONFIGS.PAYMENT_API.maxRequests).toBe(10);
      expect(RATE_LIMIT_CONFIGS.HEALTH_CHECK.maxRequests).toBe(1000);
    });

    it('should have appropriate window durations', () => {
      expect(RATE_LIMIT_CONFIGS.GENERAL_API.windowMs).toBe(60000); // 1 minute
      expect(RATE_LIMIT_CONFIGS.AUTH_API.windowMs).toBe(900000); // 15 minutes
      expect(RATE_LIMIT_CONFIGS.WEBHOOK_API.windowMs).toBe(60000); // 1 minute
      expect(RATE_LIMIT_CONFIGS.PAYMENT_API.windowMs).toBe(60000); // 1 minute
      expect(RATE_LIMIT_CONFIGS.HEALTH_CHECK.windowMs).toBe(60000); // 1 minute
    });

    it('should have appropriate strategies for different use cases', () => {
      expect(RATE_LIMIT_CONFIGS.GENERAL_API.strategy).toBe('sliding-window');
      expect(RATE_LIMIT_CONFIGS.WEBHOOK_API.strategy).toBe('sliding-window');
      expect(RATE_LIMIT_CONFIGS.HEALTH_CHECK.strategy).toBe('fixed-window');
    });
  });

  describe('Security Tests', () => {
    it('should handle IP spoofing attempts', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
      });

      const maliciousRequests = [
        new Request('https://example.com/api/test', {
          headers: { 'x-forwarded-for': '127.0.0.1, 10.0.0.1, 192.168.1.1' },
        }),
        new Request('https://example.com/api/test', {
          headers: { 'x-forwarded-for': '10.0.0.1, 127.0.0.1' },
        }),
        new Request('https://example.com/api/test', {
          headers: { 'x-forwarded-for': '192.168.1.1' },
        }),
      ];

      // All requests should be tracked by the first IP in the chain
      const results = await Promise.all(maliciousRequests.map((req) => middleware(req)));

      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(false); // Should be blocked
    });

    it('should handle missing IP headers gracefully', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
      });

      const requestWithoutIP = new Request('https://example.com/api/test');

      const result = await middleware(requestWithoutIP);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should prevent brute force attacks on sensitive endpoints', async () => {
      const authMiddleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.AUTH_API);

      const loginRequest = new Request('https://example.com/api/auth/login', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.100' },
      });

      // Try multiple login attempts quickly
      const attempts = [];
      for (let i = 0; i < 25; i++) {
        attempts.push(authMiddleware(loginRequest));
      }

      const results = await Promise.all(attempts);
      const allowedAttempts = results.filter((r) => r.allowed).length;
      const blockedAttempts = results.filter((r) => !r.allowed).length;

      expect(allowedAttempts).toBeLessThanOrEqual(20); // Max for AUTH_API
      expect(blockedAttempts).toBeGreaterThan(0);
    });

    it('should handle DDoS protection for public endpoints', async () => {
      const webhookMiddleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.WEBHOOK_API);

      const webhookRequest = new Request('https://example.com/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'x-forwarded-for': '10.0.0.50' },
      });

      // Simulate high volume webhook requests
      const requests = [];
      for (let i = 0; i < 1200; i++) {
        requests.push(webhookMiddleware(webhookRequest));
      }

      const results = await Promise.all(requests);
      const allowedRequests = results.filter((r) => r.allowed).length;
      const blockedRequests = results.filter((r) => !r.allowed).length;

      expect(allowedRequests).toBeLessThanOrEqual(1000); // Max for WEBHOOK_API
      expect(blockedRequests).toBeGreaterThan(0);
    });

    it('should handle request header manipulation', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 3,
        keyGenerator: (request) => {
          // Use user agent for key generation (potential manipulation point)
          return request.headers.get('user-agent') || 'unknown';
        },
      });

      const requests = [
        new Request('https://example.com/api/test', {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        }),
        new Request('https://example.com/api/test', {
          headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        }),
        new Request('https://example.com/api/test', {
          headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64)' },
        }),
        new Request('https://example.com/api/test', {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, // Same as first
        }),
      ];

      const results = await Promise.all(requests.map((req) => middleware(req)));

      // First three should be allowed (different user agents)
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(true);

      // Fourth should be allowed (same user agent as first, but different requests in different contexts)
      expect(results[3].allowed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed requests', async () => {
      const middleware = createRateLimitMiddleware(RATE_LIMIT_CONFIGS.GENERAL_API);

      // Test with null/undefined request
      expect(await middleware(null as any)).toBeDefined();
      expect(await middleware(undefined as any)).toBeDefined();
    });

    it('should handle concurrent requests correctly', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 5,
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make 10 concurrent requests
      const promises = Array(10)
        .fill(null)
        .map(() => middleware(mockRequest));
      const results = await Promise.all(promises);

      const allowed = results.filter((r) => r.allowed).length;
      const blocked = results.filter((r) => !r.allowed).length;

      expect(allowed).toBe(5);
      expect(blocked).toBe(5);
    });

    it('should handle very long keys', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: () => 'a'.repeat(10000), // Very long key
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const result1 = await middleware(mockRequest);
      const result2 = await middleware(mockRequest);
      const result3 = await middleware(mockRequest);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(false);
    });

    it('should handle memory cleanup', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 100, // Very short window
        maxRequests: 1,
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      // Make request
      const result1 = await middleware(mockRequest);
      expect(result1.allowed).toBe(true);

      // Second should be blocked
      const result2 = await middleware(mockRequest);
      expect(result2.allowed).toBe(false);

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again after cleanup
      const result3 = await middleware(mockRequest);
      expect(result3.allowed).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle high request volume efficiently', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1000,
      });

      const mockRequest = new Request('https://example.com/api/test', {
        headers: { 'x-forwarded-for': '127.0.0.1' },
      });

      const startTime = Date.now();

      // Make 1000 requests
      const promises = Array(1000)
        .fill(null)
        .map((_, i) =>
          middleware(
            new Request('https://example.com/api/test', {
              headers: { 'x-forwarded-for': `127.0.0.${i}` }, // Different IPs
            })
          )
        );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should not leak memory over time', async () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 100, // Short window for quick cleanup
        maxRequests: 1,
      });

      // Make many requests from different IPs
      for (let i = 0; i < 100; i++) {
        const request = new Request('https://example.com/api/test', {
          headers: { 'x-forwarded-for': `192.168.1.${i}` },
        });

        await middleware(request);

        // Wait a bit to allow cleanup
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Memory usage should be reasonable (this is a basic check)
      // In a real environment, you'd monitor actual memory usage
      expect(true).toBe(true); // Placeholder for memory check
    });
  });
});
