import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, PUT, DELETE, PATCH } from '@/app/api/monitoring/production-setup/route';

// Mock dependencies
vi.mock('@/lib/monitoring/productionConfig', () => ({
  configureProductionMonitoring: vi.fn(),
  testProductionAlerting: vi.fn(),
  getProductionMonitoringStatus: vi.fn(),
  validateProductionEnvironment: vi.fn(),
}));

vi.mock('@/lib/monitoring/vercelIntegration', () => ({
  initializeVercelMonitoring: vi.fn(),
  vercelLogs: {
    log: vi.fn(),
  },
}));

vi.mock('@/lib/security/securityHeaders', () => ({
  addApiSecurityHeaders: vi.fn((response) => response),
}));

describe('GET /api/monitoring/production-setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return production monitoring status', async () => {
    const { validateProductionEnvironment, getProductionMonitoringStatus } = await import(
      '@/lib/monitoring/productionConfig'
    );

    vi.mocked(validateProductionEnvironment).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });

    vi.mocked(getProductionMonitoringStatus).mockReturnValue({
      alerting: { active: true },
      monitoring: { active: true },
    });

    const request = new Request('http://localhost:3000/api/monitoring/production-setup');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.requestId).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it('should include environment validation', async () => {
    const { validateProductionEnvironment, getProductionMonitoringStatus } = await import(
      '@/lib/monitoring/productionConfig'
    );

    vi.mocked(validateProductionEnvironment).mockReturnValue({
      valid: true,
      errors: [],
      warnings: ['SLACK_WEBHOOK_URL not configured'],
    });

    vi.mocked(getProductionMonitoringStatus).mockReturnValue({
      alerting: { active: true },
    });

    const request = new Request('http://localhost:3000/api/monitoring/production-setup');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.environment).toBeDefined();
    expect(data.data.environment.valid).toBe(true);
    expect(data.data.environment.warnings).toContain('SLACK_WEBHOOK_URL not configured');
  });

  it('should include monitoring status', async () => {
    const { validateProductionEnvironment, getProductionMonitoringStatus } = await import(
      '@/lib/monitoring/productionConfig'
    );

    vi.mocked(validateProductionEnvironment).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });

    vi.mocked(getProductionMonitoringStatus).mockReturnValue({
      alerting: { active: true, configured: true },
      logging: { active: true },
    });

    const request = new Request('http://localhost:3000/api/monitoring/production-setup');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.monitoring).toBeDefined();
    expect(data.data.monitoring.alerting.active).toBe(true);
  });

  it('should include setup instructions', async () => {
    const { validateProductionEnvironment, getProductionMonitoringStatus } = await import(
      '@/lib/monitoring/productionConfig'
    );

    vi.mocked(validateProductionEnvironment).mockReturnValue({
      valid: true,
      errors: [],
      warnings: [],
    });
    vi.mocked(getProductionMonitoringStatus).mockReturnValue({});

    const request = new Request('http://localhost:3000/api/monitoring/production-setup');
    const response = await GET(request);
    const data = await response.json();

    expect(data.data.setupInstructions).toBeDefined();
    expect(data.data.setupInstructions.environmentVariables).toBeDefined();
    expect(data.data.setupInstructions.recommended).toBeDefined();
  });

  it('should return 500 on error', async () => {
    const { validateProductionEnvironment } = await import('@/lib/monitoring/productionConfig');

    vi.mocked(validateProductionEnvironment).mockImplementation(() => {
      throw new Error('Validation failed');
    });

    const request = new Request('http://localhost:3000/api/monitoring/production-setup');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('POST /api/monitoring/production-setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Action: initialize', () => {
    it('should initialize production monitoring', async () => {
      const {
        configureProductionMonitoring,
        validateProductionEnvironment,
        getProductionMonitoringStatus,
      } = await import('@/lib/monitoring/productionConfig');
      const { initializeVercelMonitoring } = await import('@/lib/monitoring/vercelIntegration');

      vi.mocked(validateProductionEnvironment).mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      vi.mocked(configureProductionMonitoring).mockReturnValue(undefined);
      vi.mocked(initializeVercelMonitoring).mockReturnValue(undefined);
      vi.mocked(getProductionMonitoringStatus).mockReturnValue({});

      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'initialize' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.action).toBe('initialize');
    });

    it('should support test mode for initialization', async () => {
      const {
        configureProductionMonitoring,
        validateProductionEnvironment,
        testProductionAlerting,
      } = await import('@/lib/monitoring/productionConfig');
      const { initializeVercelMonitoring } = await import('@/lib/monitoring/vercelIntegration');

      vi.mocked(validateProductionEnvironment).mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      });
      vi.mocked(configureProductionMonitoring).mockReturnValue(undefined);
      vi.mocked(initializeVercelMonitoring).mockReturnValue(undefined);
      vi.mocked(testProductionAlerting).mockResolvedValue({
        success: true,
        results: [],
      });

      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'initialize', testMode: true }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.testMode).toBe(true);
      expect(testProductionAlerting).toHaveBeenCalled();
    });
  });

  describe('Action: test', () => {
    it('should test production monitoring setup', async () => {
      const { testProductionAlerting } = await import('@/lib/monitoring/productionConfig');

      vi.mocked(testProductionAlerting).mockResolvedValue({
        success: true,
        results: [
          { channel: 'email', success: true },
          { channel: 'slack', success: true },
        ],
      });

      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.action).toBe('test');
    });
  });

  describe('Action: validate', () => {
    it('should validate production environment', async () => {
      const { validateProductionEnvironment } = await import('@/lib/monitoring/productionConfig');

      vi.mocked(validateProductionEnvironment).mockReturnValue({
        valid: true,
        errors: [],
        warnings: ['Optional variable missing'],
      });

      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'validate' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.result.valid).toBe(true);
      expect(data.data.result.warnings).toContain('Optional variable missing');
    });
  });

  describe('Action: status', () => {
    it('should return monitoring status', async () => {
      const { getProductionMonitoringStatus } = await import('@/lib/monitoring/productionConfig');

      vi.mocked(getProductionMonitoringStatus).mockReturnValue({
        alerting: { active: true, configured: true },
        monitoring: { active: true },
        health: { status: 'healthy' },
      });

      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'status' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.result.alerting.active).toBe(true);
      expect(data.data.result.health.status).toBe('healthy');
    });
  });

  describe('Invalid Actions', () => {
    it('should return 400 for invalid action', async () => {
      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid-action' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_ACTION');
    });

    it('should include supported actions in error response', async () => {
      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'unknown' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.error.details.supportedActions).toEqual([
        'initialize',
        'test',
        'validate',
        'status',
      ]);
    });
  });

  describe('Request Validation', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('INVALID_JSON');
    });

    it('should include timestamp in response', async () => {
      const { validateProductionEnvironment } = await import('@/lib/monitoring/productionConfig');

      vi.mocked(validateProductionEnvironment).mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      });

      const request = new Request('http://localhost:3000/api/monitoring/production-setup', {
        method: 'POST',
        body: JSON.stringify({ action: 'validate' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
    });
  });
});

describe('Unsupported HTTP Methods', () => {
  it('should return 405 for PUT', async () => {
    const response = await PUT();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('should return 405 for DELETE', async () => {
    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('should return 405 for PATCH', async () => {
    const response = await PATCH();
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED');
  });
});
