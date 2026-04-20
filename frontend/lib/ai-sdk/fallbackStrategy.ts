/**
 * Fallback Strategy Implementation
 *
 * Implements retry logic with exponential backoff and provider cascade.
 * Automatically switches between providers when failures occur, with
 * intelligent error categorization and timeout handling.
 *
 * Cascade order:
 * 1. Gemini 3.1 Pro (Primary)
 * 2. Gemini Opus 4 (Fallback)
 * 3. Ollama Qwen3 (Emergency)
 *
 * @module lib/ai-sdk/fallbackStrategy
 */

import {
  ModelConfig,
  ProviderType,
  getEnabledProviders,
  DEFAULT_FALLBACK_STRATEGY,
  FallbackStrategy as FallbackConfig,
} from './providerConfig';
import { getCircuitBreaker, CircuitState } from './circuitBreaker';

/**
 * Error categories for determining retry behavior
 */
export enum ErrorCategory {
  /** Temporary error, should retry */
  TRANSIENT = 'TRANSIENT',

  /** Rate limit error, should retry with backoff */
  RATE_LIMIT = 'RATE_LIMIT',

  /** Timeout error, should retry */
  TIMEOUT = 'TIMEOUT',

  /** Authentication error, should not retry */
  AUTH = 'AUTH',

  /** Permanent error, should not retry */
  PERMANENT = 'PERMANENT',

  /** Unknown error, should retry cautiously */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Extended error with categorization
 */
export class CategorizedError extends Error {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly provider: ProviderType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CategorizedError';
  }
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  /** Attempt number (0-indexed) */
  attempt: number;

  /** Provider used for this attempt */
  provider: ProviderType;

  /** Delay before this attempt (ms) */
  delayMs: number;

  /** Timestamp of attempt */
  timestamp: number;

  /** Error that occurred (if any) */
  error?: CategorizedError;

  /** Whether this was successful */
  success: boolean;

  /** Response time in milliseconds */
  responseTimeMs?: number;
}

/**
 * Fallback execution result
 */
export interface FallbackResult<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** Result data (if successful) */
  data?: T;

  /** Final error (if failed) */
  error?: CategorizedError;

  /** Provider that succeeded */
  successfulProvider?: ProviderType;

  /** All retry attempts made */
  attempts: RetryAttempt[];

  /** Total time taken (ms) */
  totalTimeMs: number;

  /** Number of providers tried */
  providersTried: number;
}

/**
 * Categorize an error to determine retry behavior
 */
export function categorizeError(error: Error, provider: ProviderType): CategorizedError {
  const message = error.message.toLowerCase();

  // Rate limit errors
  if (
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('too many requests')
  ) {
    return new CategorizedError('Rate limit exceeded', ErrorCategory.RATE_LIMIT, provider, error);
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out') || message.includes('aborted')) {
    return new CategorizedError('Request timeout', ErrorCategory.TIMEOUT, provider, error);
  }

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('invalid api key') ||
    message.includes('authentication')
  ) {
    return new CategorizedError('Authentication failed', ErrorCategory.AUTH, provider, error);
  }

  // Network/connection errors (transient)
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('503') ||
    message.includes('502')
  ) {
    return new CategorizedError('Network error', ErrorCategory.TRANSIENT, provider, error);
  }

  // Server errors (transient)
  if (message.includes('500') || message.includes('internal server error')) {
    return new CategorizedError('Server error', ErrorCategory.TRANSIENT, provider, error);
  }

  // Client errors (permanent)
  if (message.includes('400') || message.includes('404') || message.includes('invalid')) {
    return new CategorizedError('Invalid request', ErrorCategory.PERMANENT, provider, error);
  }

  // Default to unknown
  return new CategorizedError('Unknown error', ErrorCategory.UNKNOWN, provider, error);
}

/**
 * Calculate backoff delay with jitter
 */
export function calculateBackoff(
  attempt: number,
  config: FallbackConfig = DEFAULT_FALLBACK_STRATEGY
): number {
  const baseDelay = config.initialBackoffMs;
  const exponentialDelay = baseDelay * Math.pow(config.backoffMultiplier, attempt);

  // Add jitter (±20% randomness) to prevent thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);

  return Math.floor(exponentialDelay + jitter);
}

/**
 * Check if error should be retried
 */
export function shouldRetry(error: CategorizedError): boolean {
  switch (error.category) {
    case ErrorCategory.TRANSIENT:
    case ErrorCategory.RATE_LIMIT:
    case ErrorCategory.TIMEOUT:
    case ErrorCategory.UNKNOWN:
      return true;

    case ErrorCategory.AUTH:
    case ErrorCategory.PERMANENT:
      return false;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute operation with fallback cascade and retry logic
 */
export async function executeWithFallback<T>(
  operation: (provider: ModelConfig) => Promise<T>,
  config: FallbackConfig = DEFAULT_FALLBACK_STRATEGY
): Promise<FallbackResult<T>> {
  const startTime = Date.now();
  const attempts: RetryAttempt[] = [];
  const providers = getEnabledProviders();
  const circuitBreaker = getCircuitBreaker();

  let lastError: CategorizedError | undefined;
  let providerIndex = 0;

  // Try each provider in order
  while (providerIndex < providers.length) {
    const provider = providers[providerIndex];
    const providerId = provider.id;

    // Check circuit breaker
    const state = circuitBreaker.getState(providerId);
    if (state === CircuitState.OPEN) {
      // Only log server-side
      if (typeof window === 'undefined') {
        console.warn(`[Fallback] ${providerId} circuit is OPEN, skipping to next provider`);
      }
      providerIndex++;
      continue;
    }

    // Retry current provider with exponential backoff
    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      const delayMs = attempt > 0 ? calculateBackoff(attempt - 1, config) : 0;

      if (delayMs > 0) {
        await sleep(delayMs);
      }

      const attemptStart = Date.now();

      try {
        // Only log server-side
        if (typeof window === 'undefined') {
          console.log(
            `[Fallback] Attempt ${attempt + 1}/${config.maxRetries} with ${providerId}${delayMs > 0 ? ` (after ${delayMs}ms backoff)` : ''}`
          );
        }

        const result = await operation(provider);
        const responseTimeMs = Date.now() - attemptStart;

        // Success!
        circuitBreaker.recordSuccess(providerId);

        attempts.push({
          attempt: attempts.length,
          provider: providerId,
          delayMs,
          timestamp: attemptStart,
          success: true,
          responseTimeMs,
        });

        return {
          success: true,
          data: result,
          successfulProvider: providerId,
          attempts,
          totalTimeMs: Date.now() - startTime,
          providersTried: providerIndex + 1,
        };
      } catch (error) {
        const responseTimeMs = Date.now() - attemptStart;
        const categorizedError = categorizeError(error as Error, providerId);

        circuitBreaker.recordFailure(providerId, categorizedError);

        attempts.push({
          attempt: attempts.length,
          provider: providerId,
          delayMs,
          timestamp: attemptStart,
          success: false,
          error: categorizedError,
          responseTimeMs,
        });

        lastError = categorizedError;

        // Only log server-side
        if (typeof window === 'undefined') {
          console.warn(
            `[Fallback] ${providerId} attempt ${attempt + 1} failed: ${categorizedError.category} - ${categorizedError.message}`
          );
        }

        // Don't retry if error is not retryable
        if (!shouldRetry(categorizedError)) {
          if (typeof window === 'undefined') {
            console.warn(
              `[Fallback] ${categorizedError.category} error is not retryable, moving to next provider`
            );
          }
          break;
        }

        // If this was the last retry for this provider, move to next
        if (attempt === config.maxRetries - 1) {
          if (typeof window === 'undefined') {
            console.warn(
              `[Fallback] ${providerId} exhausted all ${config.maxRetries} retries, moving to next provider`
            );
          }
        }
      }
    }

    // Move to next provider
    providerIndex++;
  }

  // All providers failed
  return {
    success: false,
    error:
      lastError ||
      new CategorizedError(
        'All providers failed',
        ErrorCategory.PERMANENT,
        ProviderType.CLAUDE_SONNET_4
      ),
    attempts,
    totalTimeMs: Date.now() - startTime,
    providersTried: providerIndex,
  };
}

/**
 * Get fallback statistics for monitoring
 */
export interface FallbackStats {
  /** Total number of attempts across all operations */
  totalAttempts: number;

  /** Number of successful operations */
  successfulOperations: number;

  /** Number of failed operations */
  failedOperations: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Average number of attempts per operation */
  avgAttemptsPerOperation: number;

  /** Average response time for successful operations (ms) */
  avgResponseTime: number;

  /** Provider usage distribution */
  providerUsage: Record<ProviderType, number>;
}

/**
 * Track fallback statistics (simple in-memory tracking)
 */
class FallbackStatsTracker {
  private results: FallbackResult<unknown>[] = [];

  track<T>(result: FallbackResult<T>): void {
    this.results.push(result as FallbackResult<unknown>);

    // Keep only last 1000 results to prevent memory issues
    if (this.results.length > 1000) {
      this.results = this.results.slice(-1000);
    }
  }

  getStats(): FallbackStats {
    const total = this.results.length;

    if (total === 0) {
      return {
        totalAttempts: 0,
        successfulOperations: 0,
        failedOperations: 0,
        successRate: 0,
        avgAttemptsPerOperation: 0,
        avgResponseTime: 0,
        providerUsage: {} as Record<ProviderType, number>,
      };
    }

    const successful = this.results.filter((r) => r.success);
    const totalAttempts = this.results.reduce((sum, r) => sum + r.attempts.length, 0);

    const responseTimes = successful
      .map((r) => r.attempts.find((a) => a.success)?.responseTimeMs)
      .filter((rt): rt is number => rt !== undefined);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
        : 0;

    const providerUsage: Partial<Record<ProviderType, number>> = {};
    successful.forEach((r) => {
      if (r.successfulProvider) {
        providerUsage[r.successfulProvider] = (providerUsage[r.successfulProvider] || 0) + 1;
      }
    });

    return {
      totalAttempts,
      successfulOperations: successful.length,
      failedOperations: total - successful.length,
      successRate: successful.length / total,
      avgAttemptsPerOperation: totalAttempts / total,
      avgResponseTime,
      providerUsage: providerUsage as Record<ProviderType, number>,
    };
  }

  reset(): void {
    this.results = [];
  }
}

/**
 * Global stats tracker instance
 */
let statsTrackerInstance: FallbackStatsTracker | null = null;

/**
 * Get the global stats tracker
 */
export function getStatsTracker(): FallbackStatsTracker {
  if (!statsTrackerInstance) {
    statsTrackerInstance = new FallbackStatsTracker();
  }
  return statsTrackerInstance;
}

/**
 * Reset stats tracker (for testing)
 */
export function resetStatsTracker(): void {
  statsTrackerInstance = null;
}
