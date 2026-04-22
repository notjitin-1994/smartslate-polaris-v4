/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures by tracking provider health and temporarily
 * disabling failing providers. Implements the classic circuit breaker pattern
 * with three states: CLOSED, OPEN, and HALF_OPEN.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Provider is failing, requests are blocked
 * - HALF_OPEN: Testing if provider has recovered
 *
 * @module lib/ai-sdk/circuitBreaker
 */

import { ProviderType } from './providerConfig';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Normal operation - requests pass through */
  CLOSED = 'CLOSED',

  /** Provider is failing - requests are blocked */
  OPEN = 'OPEN',

  /** Testing recovery - limited requests allowed */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;

  /** Number of successful requests needed to close circuit from HALF_OPEN */
  successThreshold: number;

  /** Time to wait before transitioning from OPEN to HALF_OPEN (milliseconds) */
  resetTimeout: number;

  /** Time window for tracking failures (milliseconds) */
  monitoringWindow: number;
}

/**
 * Circuit breaker metrics for a provider
 */
export interface CircuitMetrics {
  /** Current circuit state */
  state: CircuitState;

  /** Total number of failures in current window */
  failures: number;

  /** Total number of successes in current window */
  successes: number;

  /** Timestamp when circuit was last opened */
  lastOpenedAt: number | null;

  /** Timestamp when circuit state last changed */
  lastStateChangeAt: number;

  /** Total number of times circuit has opened */
  totalOpens: number;

  /** Consecutive successes in HALF_OPEN state */
  consecutiveSuccesses: number;
}

/**
 * Default circuit breaker configuration aligned with PRD
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 300000, // 5 minutes
  monitoringWindow: 60000, // 1 minute
};

/**
 * Circuit Breaker implementation for provider resilience
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private metrics: Map<ProviderType, CircuitMetrics>;
  private failureTimestamps: Map<ProviderType, number[]>;

  constructor(config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG) {
    this.config = config;
    this.metrics = new Map();
    this.failureTimestamps = new Map();
  }

  /**
   * Initialize metrics for a provider
   */
  private initializeMetrics(provider: ProviderType): CircuitMetrics {
    const metrics: CircuitMetrics = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastOpenedAt: null,
      lastStateChangeAt: Date.now(),
      totalOpens: 0,
      consecutiveSuccesses: 0,
    };
    this.metrics.set(provider, metrics);
    this.failureTimestamps.set(provider, []);
    return metrics;
  }

  /**
   * Get metrics for a provider, initializing if needed
   */
  private getMetrics(provider: ProviderType): CircuitMetrics {
    return this.metrics.get(provider) || this.initializeMetrics(provider);
  }

  /**
   * Clean up old failure timestamps outside monitoring window
   */
  private cleanupOldFailures(provider: ProviderType): void {
    const timestamps = this.failureTimestamps.get(provider) || [];
    const cutoff = Date.now() - this.config.monitoringWindow;
    const recent = timestamps.filter((ts) => ts > cutoff);
    this.failureTimestamps.set(provider, recent);

    const metrics = this.getMetrics(provider);
    metrics.failures = recent.length;
  }

  /**
   * Transition circuit state with logging
   */
  private transitionState(provider: ProviderType, newState: CircuitState, reason: string): void {
    const metrics = this.getMetrics(provider);
    const oldState = metrics.state;

    if (oldState === newState) {
      return;
    }

    metrics.state = newState;
    metrics.lastStateChangeAt = Date.now();

    if (newState === CircuitState.OPEN) {
      metrics.lastOpenedAt = Date.now();
      metrics.totalOpens++;
    }

    // Only log server-side
    if (typeof window === 'undefined') {
      console.log(`[Circuit Breaker] ${provider}: ${oldState} → ${newState} (${reason})`);
    }
  }

  /**
   * Check if circuit should transition to OPEN state
   */
  private checkOpenTransition(provider: ProviderType): void {
    const metrics = this.getMetrics(provider);

    if (metrics.state !== CircuitState.CLOSED) {
      return;
    }

    this.cleanupOldFailures(provider);

    if (metrics.failures >= this.config.failureThreshold) {
      this.transitionState(
        provider,
        CircuitState.OPEN,
        `${metrics.failures} failures exceeded threshold of ${this.config.failureThreshold}`
      );
    }
  }

  /**
   * Check if circuit should transition from OPEN to HALF_OPEN
   */
  private checkHalfOpenTransition(provider: ProviderType): void {
    const metrics = this.getMetrics(provider);

    if (metrics.state !== CircuitState.OPEN || !metrics.lastOpenedAt) {
      return;
    }

    const timeSinceOpen = Date.now() - metrics.lastOpenedAt;

    if (timeSinceOpen >= this.config.resetTimeout) {
      this.transitionState(
        provider,
        CircuitState.HALF_OPEN,
        `Reset timeout of ${this.config.resetTimeout}ms elapsed`
      );
      metrics.consecutiveSuccesses = 0;
    }
  }

  /**
   * Check if circuit should transition from HALF_OPEN to CLOSED
   */
  private checkClosedTransition(provider: ProviderType): void {
    const metrics = this.getMetrics(provider);

    if (metrics.state !== CircuitState.HALF_OPEN) {
      return;
    }

    if (metrics.consecutiveSuccesses >= this.config.successThreshold) {
      this.transitionState(
        provider,
        CircuitState.CLOSED,
        `${metrics.consecutiveSuccesses} consecutive successes exceeded threshold of ${this.config.successThreshold}`
      );
      // Reset failure tracking
      this.failureTimestamps.set(provider, []);
      metrics.failures = 0;
      metrics.consecutiveSuccesses = 0;
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess(provider: ProviderType): void {
    const metrics = this.getMetrics(provider);
    metrics.successes++;

    if (metrics.state === CircuitState.HALF_OPEN) {
      metrics.consecutiveSuccesses++;
      this.checkClosedTransition(provider);
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(provider: ProviderType, error?: Error): void {
    const metrics = this.getMetrics(provider);
    const timestamps = this.failureTimestamps.get(provider) || [];

    timestamps.push(Date.now());
    this.failureTimestamps.set(provider, timestamps);
    metrics.failures++;

    // Only log server-side
    if (typeof window === 'undefined') {
      console.warn(
        `[Circuit Breaker] ${provider} failure recorded: ${error?.message || 'Unknown error'} (${metrics.failures}/${this.config.failureThreshold})`
      );
    }

    if (metrics.state === CircuitState.HALF_OPEN) {
      // Immediate transition to OPEN on any failure in HALF_OPEN
      this.transitionState(provider, CircuitState.OPEN, 'Failure during HALF_OPEN state');
      metrics.consecutiveSuccesses = 0;
    } else {
      this.checkOpenTransition(provider);
    }
  }

  /**
   * Check if a request is allowed for a provider
   * @returns true if request should be allowed, false if circuit is open
   */
  allowRequest(provider: ProviderType): boolean {
    this.checkHalfOpenTransition(provider);
    const metrics = this.getMetrics(provider);

    switch (metrics.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.HALF_OPEN:
        // Allow limited requests in HALF_OPEN to test recovery
        return true;

      case CircuitState.OPEN:
        return false;
    }
  }

  /**
   * Get current state for a provider
   */
  getState(provider: ProviderType): CircuitState {
    this.checkHalfOpenTransition(provider);
    return this.getMetrics(provider).state;
  }

  /**
   * Get all metrics for a provider
   */
  getMetricsSnapshot(provider: ProviderType): Readonly<CircuitMetrics> {
    this.checkHalfOpenTransition(provider);
    this.cleanupOldFailures(provider);
    return { ...this.getMetrics(provider) };
  }

  /**
   * Get metrics for all providers
   */
  getAllMetrics(): Map<ProviderType, Readonly<CircuitMetrics>> {
    const snapshot = new Map<ProviderType, Readonly<CircuitMetrics>>();
    for (const provider of this.metrics.keys()) {
      snapshot.set(provider, this.getMetricsSnapshot(provider));
    }
    return snapshot;
  }

  /**
   * Manually reset circuit for a provider (for testing/admin)
   */
  reset(provider: ProviderType): void {
    const metrics = this.getMetrics(provider);
    this.transitionState(provider, CircuitState.CLOSED, 'Manual reset');
    this.failureTimestamps.set(provider, []);
    metrics.failures = 0;
    metrics.successes = 0;
    metrics.consecutiveSuccesses = 0;
  }

  /**
   * Reset all circuits (for testing/admin)
   */
  resetAll(): void {
    for (const provider of this.metrics.keys()) {
      this.reset(provider);
    }
  }
}

/**
 * Singleton circuit breaker instance
 */
let circuitBreakerInstance: CircuitBreaker | null = null;

/**
 * Get the global circuit breaker instance
 */
export function getCircuitBreaker(): CircuitBreaker {
  if (!circuitBreakerInstance) {
    circuitBreakerInstance = new CircuitBreaker();
  }
  return circuitBreakerInstance;
}

/**
 * Reset the global circuit breaker instance (for testing)
 */
export function resetCircuitBreakerInstance(): void {
  circuitBreakerInstance = null;
}
