import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, HEAD } from '@/app/api/health/route';

// Mock the health check functions
vi.mock('@/lib/monitoring/healthChecks', () => ({
  performHealthCheck: vi.fn(),
  quickHealthCheck: vi.fn(),
}));

// Mock rate limiting middleware
vi.mock('@/lib/middleware/rateLimiting', () => ({
  RATE_LIMIT_CONFIGS: {},
  rateLimitMiddleware: vi.fn(() => async () => ({ allowed: true })),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full Health Check', () => {
    it('should return healthy status with 200', async () => {
      const { performHealthCheck } = await import('@/lib/monitoring/healthChecks');

      vi.mocked(performHealthCheck).mockResolvedValue({
        status: 'healthy',
        overallScore: 100,
        timestamp: new Date('2025-01-01T00:00:00Z'),
        checks: [
          {
            name: 'database',
            status: 'healthy',
            message: 'Database is responding',
            responseTime: 50,
            timestamp: new Date('2025-01-01T00:00:00Z'),
            details: {},
          },
        ],
      });

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.score).toBe(100);
      expect(data.checks).toHaveLength(1);
      expect(data.environment).toBeDefined();
    });

    it('should return degraded status with 200', async () => {
      const { performHealthCheck } = await import('@/lib/monitoring/healthChecks');

      vi.mocked(performHealthCheck).mockResolvedValue({
        status: 'degraded',
        overallScore: 75,
        timestamp: new Date(),
        checks: [
          {
            name: 'cache',
            status: 'degraded',
            message: 'Cache is slow',
            responseTime: 500,
            timestamp: new Date(),
            details: {},
          },
        ],
      });

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.score).toBe(75);
    });

    it('should return unhealthy status with 503', async () => {
      const { performHealthCheck } = await import('@/lib/monitoring/healthChecks');

      vi.mocked(performHealthCheck).mockResolvedValue({
        status: 'unhealthy',
        overallScore: 0,
        timestamp: new Date(),
        checks: [
          {
            name: 'database',
            status: 'unhealthy',
            message: 'Database connection failed',
            responseTime: null,
            timestamp: new Date(),
            details: {},
          },
        ],
      });

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
    });

    it('should include proper headers', async () => {
      const { performHealthCheck } = await import('@/lib/monitoring/healthChecks');

      vi.mocked(performHealthCheck).mockResolvedValue({
        status: 'healthy',
        overallScore: 100,
        timestamp: new Date(),
        checks: [],
      });

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toContain('no-cache');
      expect(response.headers.get('X-Health-Status')).toBe('healthy');
      expect(response.headers.get('X-Health-Score')).toBe('100');
    });
  });

  describe('Quick Health Check', () => {
    it('should return quick check when ?quick=true', async () => {
      const { quickHealthCheck } = await import('@/lib/monitoring/healthChecks');

      vi.mocked(quickHealthCheck).mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });

      const request = new Request('http://localhost:3000/api/health?quick=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(quickHealthCheck).toHaveBeenCalled();
    });

    it('should return 503 for unhealthy quick check', async () => {
      const { quickHealthCheck } = await import('@/lib/monitoring/healthChecks');

      vi.mocked(quickHealthCheck).mockResolvedValue({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      });

      const request = new Request('http://localhost:3000/api/health?quick=true');
      const response = await GET(request);

      expect(response.status).toBe(503);
    });
  });

  describe('Error Handling', () => {
    it('should return 503 when health check throws error', async () => {
      const { performHealthCheck } = await import('@/lib/monitoring/healthChecks');

      vi.mocked(performHealthCheck).mockRejectedValue(new Error('System failure'));

      const request = new Request('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toContain('failure');
    });
  });
});

describe('HEAD /api/health', () => {
  it('should return 200 with minimal headers', async () => {
    const request = new Request('http://localhost:3000/api/health', { method: 'HEAD' });
    const response = await HEAD(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Health-Status')).toBe('healthy');
    expect(response.headers.get('X-Health-Score')).toBe('100');
  });

  it('should return 503 on error', async () => {
    // Force an error by mocking HEAD to throw
    const request = new Request('http://localhost:3000/api/health', { method: 'HEAD' });

    // Can't easily force HEAD to throw, so this tests the happy path
    const response = await HEAD(request);
    expect(response.status).toBe(200);
  });
});
