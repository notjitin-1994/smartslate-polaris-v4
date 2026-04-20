import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/monitoring/redis-health/route';

// Mock Redis health check
vi.mock('@/lib/cache/redis', () => ({
  checkRedisHealth: vi.fn(),
}));

describe('GET /api/monitoring/redis-health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Healthy Redis Connection', () => {
    it('should return 200 with healthy status when Redis is connected', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 5,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.redis.connected).toBe(true);
      expect(data.redis.latency).toBe(5);
      expect(data.redis.error).toBeNull();
      expect(data.timestamp).toBeDefined();
    });

    it('should include API response time in response', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 3,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.api).toBeDefined();
      expect(data.api.responseTime).toMatch(/^\d+ms$/);
      expect(data.api.endpoint).toBe('/api/monitoring/redis-health');
    });

    it('should include environment and version info', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 2,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.environment).toBeDefined();
      expect(data.version).toBe('1.0.0');
    });

    it('should include proper cache control headers', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 4,
        error: null,
      });

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Unhealthy Redis Connection', () => {
    it('should return 503 when Redis is not connected', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: false,
        latency: null,
        error: 'Connection refused',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.redis.connected).toBe(false);
      expect(data.redis.latency).toBeNull();
      expect(data.redis.error).toBe('Connection refused');
    });

    it('should return 503 when Redis has timeout', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: false,
        latency: null,
        error: 'Operation timeout',
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.redis.error).toBe('Operation timeout');
    });

    it('should include error details in response', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: false,
        latency: null,
        error: 'ECONNREFUSED',
      });

      const response = await GET();
      const data = await response.json();

      expect(data.redis.error).toBe('ECONNREFUSED');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when health check throws error', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockRejectedValue(new Error('System failure'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.error).toContain('System failure');
    });

    it('should return 500 when health check throws unknown error', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockRejectedValue('Unknown error');

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.error).toBe('Unknown error');
    });

    it('should include proper headers on error', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockRejectedValue(new Error('Connection failed'));

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include redis error in response on failure', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockRejectedValue(new Error('Network error'));

      const response = await GET();
      const data = await response.json();

      expect(data.redis.connected).toBe(false);
      expect(data.redis.latency).toBeNull();
      expect(data.redis.error).toContain('Network error');
    });
  });

  describe('Response Format', () => {
    it('should have correct response structure for healthy state', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 10,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('redis');
      expect(data).toHaveProperty('api');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('version');
    });

    it('should have correct redis object structure', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 7,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.redis).toHaveProperty('connected');
      expect(data.redis).toHaveProperty('latency');
      expect(data.redis).toHaveProperty('error');
    });

    it('should have correct api object structure', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 6,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.api).toHaveProperty('responseTime');
      expect(data.api).toHaveProperty('endpoint');
    });
  });

  describe('Performance', () => {
    it('should complete health check quickly', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockResolvedValue({
        connected: true,
        latency: 1,
        error: null,
      });

      const start = Date.now();
      await GET();
      const duration = Date.now() - start;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle slow Redis response', async () => {
      const { checkRedisHealth } = await import('@/lib/cache/redis');

      vi.mocked(checkRedisHealth).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  connected: true,
                  latency: 500,
                  error: null,
                }),
              500
            )
          )
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.redis.latency).toBe(500);
    });
  });
});
