/**
 * Comprehensive tests for AI SDK Provider Configuration, Circuit Breaker, Fallback Strategy, and Health Monitoring
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProviderType,
  createProviderConfigs,
  getProviderConfig,
  getEnabledProviders,
  getPrimaryProvider,
  getFallbackProviders,
  getConfigSummary,
} from '../../lib/ai-sdk/providerConfig';
import {
  CircuitBreaker,
  CircuitState,
  DEFAULT_CIRCUIT_CONFIG,
  resetCircuitBreakerInstance,
} from '../../lib/ai-sdk/circuitBreaker';
import {
  categorizeError,
  ErrorCategory,
  calculateBackoff,
  shouldRetry,
} from '../../lib/ai-sdk/fallbackStrategy';
import {
  ProviderHealthMonitor,
  HealthStatus,
  DEFAULT_HEALTH_CONFIG,
  resetHealthMonitorInstance,
} from '../../lib/ai-sdk/healthMonitor';

describe('AI SDK Provider Configuration', () => {
  describe('createProviderConfigs', () => {
    it('should create three provider configurations', () => {
      const configs = createProviderConfigs();

      expect(configs).toHaveLength(3);
      expect(configs.map((c) => c.id)).toEqual([
        ProviderType.CLAUDE_SONNET_4,
        ProviderType.CLAUDE_OPUS_4,
        ProviderType.OLLAMA_QWEN3,
      ]);
    });

    it('should configure Gemini 3.1 Pro as primary', () => {
      const configs = createProviderConfigs();
      const sonnet = configs.find((c) => c.id === ProviderType.CLAUDE_SONNET_4);

      expect(sonnet).toBeDefined();
      expect(sonnet?.name).toBe('Gemini 3.1 Pro');
      expect(sonnet?.model).toBe('gemini-3.1-pro-preview-20250514');
      expect(sonnet?.maxTokens).toBe(12000);
      expect(sonnet?.temperature).toBe(0.2);
      expect(sonnet?.timeout).toBe(60000);
      expect(sonnet?.priority).toBe(1);
      expect(sonnet?.enabled).toBe(true);
    });

    it('should configure Gemini Opus 4 as fallback', () => {
      const configs = createProviderConfigs();
      const opus = configs.find((c) => c.id === ProviderType.CLAUDE_OPUS_4);

      expect(opus).toBeDefined();
      expect(opus?.name).toBe('Gemini Opus 4');
      expect(opus?.model).toBe('gemini-3.1-pro-preview-20250514');
      expect(opus?.maxTokens).toBe(16000);
      expect(opus?.temperature).toBe(0.2);
      expect(opus?.timeout).toBe(90000);
      expect(opus?.priority).toBe(2);
      expect(opus?.enabled).toBe(true);
    });

    it('should configure Ollama Qwen3 as emergency', () => {
      const configs = createProviderConfigs();
      const ollama = configs.find((c) => c.id === ProviderType.OLLAMA_QWEN3);

      expect(ollama).toBeDefined();
      expect(ollama?.name).toBe('Ollama Qwen3');
      expect(ollama?.model).toBe('qwen3:32b');
      expect(ollama?.maxTokens).toBe(12000);
      expect(ollama?.temperature).toBe(0.2);
      expect(ollama?.timeout).toBe(120000);
      expect(ollama?.priority).toBe(3);
      expect(ollama?.enabled).toBe(true);
    });
  });

  describe('getProviderConfig', () => {
    it('should retrieve specific provider configuration', () => {
      const config = getProviderConfig(ProviderType.CLAUDE_SONNET_4);

      expect(config).toBeDefined();
      expect(config?.id).toBe(ProviderType.CLAUDE_SONNET_4);
    });

    it('should return undefined for invalid provider', () => {
      const config = getProviderConfig('invalid' as ProviderType);

      expect(config).toBeUndefined();
    });
  });

  describe('getEnabledProviders', () => {
    it('should return all enabled providers in priority order', () => {
      const enabled = getEnabledProviders();

      expect(enabled).toHaveLength(3);
      expect(enabled[0].priority).toBe(1);
      expect(enabled[1].priority).toBe(2);
      expect(enabled[2].priority).toBe(3);
    });
  });

  describe('getPrimaryProvider', () => {
    it('should return Gemini 3.1 Pro as primary', () => {
      const primary = getPrimaryProvider();

      expect(primary.id).toBe(ProviderType.CLAUDE_SONNET_4);
      expect(primary.priority).toBe(1);
    });
  });

  describe('getFallbackProviders', () => {
    it('should return fallback providers excluding primary', () => {
      const fallbacks = getFallbackProviders();

      expect(fallbacks).toHaveLength(2);
      expect(fallbacks[0].id).toBe(ProviderType.CLAUDE_OPUS_4);
      expect(fallbacks[1].id).toBe(ProviderType.OLLAMA_QWEN3);
    });
  });

  describe('getConfigSummary', () => {
    it('should provide complete configuration summary', () => {
      const summary = getConfigSummary();

      expect(summary.totalProviders).toBe(3);
      expect(summary.enabledProviders).toBe(3);
      expect(summary.primary.id).toBe(ProviderType.CLAUDE_SONNET_4);
      expect(summary.fallbacks).toHaveLength(2);
      expect(summary.strategy.maxRetries).toBe(3);
      expect(summary.strategy.backoffMultiplier).toBe(1.5);
    });
  });
});

describe('Circuit Breaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    resetCircuitBreakerInstance();
    circuitBreaker = new CircuitBreaker(DEFAULT_CIRCUIT_CONFIG);
  });

  describe('Initial State', () => {
    it('should start in CLOSED state', () => {
      const state = circuitBreaker.getState(ProviderType.CLAUDE_SONNET_4);
      expect(state).toBe(CircuitState.CLOSED);
    });

    it('should allow requests initially', () => {
      const allowed = circuitBreaker.allowRequest(ProviderType.CLAUDE_SONNET_4);
      expect(allowed).toBe(true);
    });
  });

  describe('Failure Tracking', () => {
    it('should record failures', () => {
      circuitBreaker.recordFailure(ProviderType.CLAUDE_SONNET_4);
      const metrics = circuitBreaker.getMetricsSnapshot(ProviderType.CLAUDE_SONNET_4);

      expect(metrics.failures).toBe(1);
    });

    it('should open circuit after threshold failures', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure(ProviderType.CLAUDE_SONNET_4);
      }

      const state = circuitBreaker.getState(ProviderType.CLAUDE_SONNET_4);
      expect(state).toBe(CircuitState.OPEN);
    });

    it('should block requests when circuit is OPEN', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure(ProviderType.CLAUDE_SONNET_4);
      }

      const allowed = circuitBreaker.allowRequest(ProviderType.CLAUDE_SONNET_4);
      expect(allowed).toBe(false);
    });
  });

  describe('Success Tracking', () => {
    it('should record successes', () => {
      circuitBreaker.recordSuccess(ProviderType.CLAUDE_SONNET_4);
      const metrics = circuitBreaker.getMetricsSnapshot(ProviderType.CLAUDE_SONNET_4);

      expect(metrics.successes).toBe(1);
    });
  });

  describe('State Transitions', () => {
    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure(ProviderType.CLAUDE_SONNET_4);
      }

      expect(circuitBreaker.getState(ProviderType.CLAUDE_SONNET_4)).toBe(CircuitState.OPEN);

      // Use a custom config with short timeout for testing
      const testCircuit = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_CONFIG,
        resetTimeout: 100, // 100ms for testing
      });

      for (let i = 0; i < 5; i++) {
        testCircuit.recordFailure(ProviderType.CLAUDE_SONNET_4);
      }

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      const state = testCircuit.getState(ProviderType.CLAUDE_SONNET_4);
      expect(state).toBe(CircuitState.HALF_OPEN);
    });

    it('should allow requests in HALF_OPEN state', async () => {
      const testCircuit = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_CONFIG,
        resetTimeout: 100,
      });

      for (let i = 0; i < 5; i++) {
        testCircuit.recordFailure(ProviderType.CLAUDE_SONNET_4);
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      const allowed = testCircuit.allowRequest(ProviderType.CLAUDE_SONNET_4);
      expect(allowed).toBe(true);
    });

    it('should close circuit after successful requests in HALF_OPEN', async () => {
      const testCircuit = new CircuitBreaker({
        ...DEFAULT_CIRCUIT_CONFIG,
        resetTimeout: 100,
        successThreshold: 2,
      });

      // Open circuit
      for (let i = 0; i < 5; i++) {
        testCircuit.recordFailure(ProviderType.CLAUDE_SONNET_4);
      }

      // Wait for HALF_OPEN
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Verify we're in HALF_OPEN
      expect(testCircuit.getState(ProviderType.CLAUDE_SONNET_4)).toBe(CircuitState.HALF_OPEN);

      // Record successes
      testCircuit.recordSuccess(ProviderType.CLAUDE_SONNET_4);
      testCircuit.recordSuccess(ProviderType.CLAUDE_SONNET_4);

      // Should now be CLOSED
      const state = testCircuit.getState(ProviderType.CLAUDE_SONNET_4);
      expect(state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Manual Reset', () => {
    it('should reset circuit manually', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure(ProviderType.CLAUDE_SONNET_4);
      }

      expect(circuitBreaker.getState(ProviderType.CLAUDE_SONNET_4)).toBe(CircuitState.OPEN);

      circuitBreaker.reset(ProviderType.CLAUDE_SONNET_4);

      expect(circuitBreaker.getState(ProviderType.CLAUDE_SONNET_4)).toBe(CircuitState.CLOSED);
    });

    it('should reset all circuits', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure(ProviderType.CLAUDE_SONNET_4);
        circuitBreaker.recordFailure(ProviderType.CLAUDE_OPUS_4);
      }

      circuitBreaker.resetAll();

      expect(circuitBreaker.getState(ProviderType.CLAUDE_SONNET_4)).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getState(ProviderType.CLAUDE_OPUS_4)).toBe(CircuitState.CLOSED);
    });
  });
});

describe('Fallback Strategy', () => {
  describe('Error Categorization', () => {
    it('should categorize rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(categorized.category).toBe(ErrorCategory.RATE_LIMIT);
    });

    it('should categorize timeout errors', () => {
      const error = new Error('Request timeout');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(categorized.category).toBe(ErrorCategory.TIMEOUT);
    });

    it('should categorize auth errors', () => {
      const error = new Error('401 Unauthorized');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(categorized.category).toBe(ErrorCategory.AUTH);
    });

    it('should categorize network errors as transient', () => {
      const error = new Error('Network connection failed');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(categorized.category).toBe(ErrorCategory.TRANSIENT);
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Something went wrong');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(categorized.category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('Backoff Calculation', () => {
    it('should calculate exponential backoff', () => {
      const delay0 = calculateBackoff(0);
      const delay1 = calculateBackoff(1);
      const delay2 = calculateBackoff(2);

      // Verify exponential growth (accounting for jitter)
      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should apply backoff multiplier', () => {
      const config = {
        maxRetries: 3,
        backoffMultiplier: 2.0,
        initialBackoffMs: 1000,
        circuitBreaker: { threshold: 5, resetTimeout: 300000 },
      };
      const delay1 = calculateBackoff(1, config);

      // Should be approximately 2x the initial delay (accounting for jitter)
      expect(delay1).toBeGreaterThan(1500);
      expect(delay1).toBeLessThan(3000);
    });

    it('should add jitter to prevent thundering herd', () => {
      const delays = Array.from({ length: 10 }, () => calculateBackoff(1));

      // Not all delays should be exactly the same
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('Retry Logic', () => {
    it('should retry transient errors', () => {
      const error = new Error('Network error');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(shouldRetry(categorized)).toBe(true);
    });

    it('should not retry auth errors', () => {
      const error = new Error('401 Unauthorized');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(shouldRetry(categorized)).toBe(false);
    });

    it('should not retry permanent errors', () => {
      const error = new Error('400 Bad Request');
      const categorized = categorizeError(error, ProviderType.CLAUDE_SONNET_4);

      expect(shouldRetry(categorized)).toBe(false);
    });
  });
});

describe('Provider Health Monitor', () => {
  let monitor: ProviderHealthMonitor;

  beforeEach(() => {
    resetHealthMonitorInstance();
    monitor = new ProviderHealthMonitor(DEFAULT_HEALTH_CONFIG);
  });

  describe('Request Recording', () => {
    it('should record successful requests', () => {
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should record failed requests', () => {
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, false, 100, 'Error message');

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(1);
    });

    it('should calculate success rate correctly', () => {
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, false, 100);

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.successRate).toBeCloseTo(2 / 3, 2);
    });
  });

  describe('Latency Metrics', () => {
    it('should calculate latency percentiles', () => {
      const latencies = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

      latencies.forEach((lat) => {
        monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, lat);
      });

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.latency.p50).toBeGreaterThan(0);
      expect(metrics.latency.p95).toBeGreaterThan(metrics.latency.p50);
      expect(metrics.latency.p99).toBeGreaterThanOrEqual(metrics.latency.p95);
    });

    it('should calculate min/max latency', () => {
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 50);
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 500);

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.latency.min).toBe(50);
      expect(metrics.latency.max).toBe(500);
    });
  });

  describe('Health Status', () => {
    it('should be UNKNOWN with no requests', () => {
      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.status).toBe(HealthStatus.UNKNOWN);
    });

    it('should be HEALTHY with high success rate', () => {
      for (let i = 0; i < 10; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      }

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.status).toBe(HealthStatus.HEALTHY);
    });

    it('should be DEGRADED with moderate success rate', () => {
      for (let i = 0; i < 7; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      }
      for (let i = 0; i < 3; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, false, 100);
      }

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.status).toBe(HealthStatus.DEGRADED);
    });

    it('should be UNHEALTHY with low success rate', () => {
      for (let i = 0; i < 3; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      }
      for (let i = 0; i < 7; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, false, 100);
      }

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.status).toBe(HealthStatus.UNHEALTHY);
    });
  });

  describe('Dashboard Data', () => {
    it('should provide dashboard summary', () => {
      // Healthy provider
      for (let i = 0; i < 10; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      }

      // Degraded provider
      for (let i = 0; i < 7; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_OPUS_4, true, 100);
      }
      for (let i = 0; i < 3; i++) {
        monitor.recordRequest(ProviderType.CLAUDE_OPUS_4, false, 100);
      }

      const dashboard = monitor.getDashboardData();

      expect(dashboard.summary.healthyCount).toBe(1);
      expect(dashboard.summary.degradedCount).toBe(1);
    });
  });

  describe('Reset', () => {
    it('should reset metrics for a provider', () => {
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      monitor.reset(ProviderType.CLAUDE_SONNET_4);

      const metrics = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      expect(metrics.totalRequests).toBe(0);
    });

    it('should reset all metrics', () => {
      monitor.recordRequest(ProviderType.CLAUDE_SONNET_4, true, 100);
      monitor.recordRequest(ProviderType.CLAUDE_OPUS_4, true, 100);

      monitor.resetAll();

      const metrics1 = monitor.getMetrics(ProviderType.CLAUDE_SONNET_4);
      const metrics2 = monitor.getMetrics(ProviderType.CLAUDE_OPUS_4);

      expect(metrics1.totalRequests).toBe(0);
      expect(metrics2.totalRequests).toBe(0);
    });
  });
});
