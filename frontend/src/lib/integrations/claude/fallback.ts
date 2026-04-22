/**
 * Gemini Fallback Logic
 * Defines failure detection criteria and fallback orchestration
 */

import { GeminiApiError } from './client';
import { ValidationError } from './validation';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('claude-fallback');

/**
 * Failure types that trigger fallback
 */
export enum FallbackTrigger {
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  API_ERROR_4XX = 'api_error_4xx',
  API_ERROR_5XX = 'api_error_5xx',
  INVALID_API_KEY = 'invalid_api_key',
  NETWORK_ERROR = 'network_error',
  JSON_PARSE_ERROR = 'json_parse_error',
  VALIDATION_ERROR = 'validation_error',
}

/**
 * Fallback decision result
 */
export interface FallbackDecision {
  shouldFallback: boolean;
  trigger?: FallbackTrigger;
  reason?: string;
  originalError: Error;
}

/**
 * Determine if error should trigger fallback to Sonnet 4
 */
export function shouldFallbackToSonnet4(error: Error): FallbackDecision {
  const decision: FallbackDecision = {
    shouldFallback: false,
    originalError: error,
  };

  // Handle GeminiApiError
  if (error instanceof GeminiApiError) {
    const { statusCode, errorType } = error;

    // Timeout errors
    if (errorType === 'timeout') {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.TIMEOUT;
      decision.reason = 'Request timeout exceeded';
      return decision;
    }

    // Rate limit errors
    if (errorType === 'rate_limit_error' || statusCode === 429) {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.RATE_LIMIT;
      decision.reason = 'Rate limit exceeded';
      return decision;
    }

    // Invalid API key
    if (statusCode === 401 || statusCode === 403) {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.INVALID_API_KEY;
      decision.reason = 'Authentication failed';
      return decision;
    }

    // 4xx errors (client errors)
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.API_ERROR_4XX;
      decision.reason = `Client error: ${statusCode}`;
      return decision;
    }

    // 5xx errors (server errors)
    if (statusCode && statusCode >= 500) {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.API_ERROR_5XX;
      decision.reason = `Server error: ${statusCode}`;
      return decision;
    }

    // Network errors
    if (errorType === 'network_error') {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.NETWORK_ERROR;
      decision.reason = 'Network error occurred';
      return decision;
    }

    // Parse errors
    if (errorType === 'parse_error') {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.JSON_PARSE_ERROR;
      decision.reason = 'Failed to parse JSON response';
      return decision;
    }
  }

  // Handle ValidationError
  if (error instanceof ValidationError) {
    // Only fallback for JSON parsing errors, not structural validation
    if (error.code === 'INVALID_JSON') {
      decision.shouldFallback = true;
      decision.trigger = FallbackTrigger.JSON_PARSE_ERROR;
      decision.reason = 'Invalid JSON in response';
      return decision;
    }

    // Don't fallback for structural validation errors
    // (schema issues won't be fixed by different model)
    decision.shouldFallback = false;
    return decision;
  }

  // Network errors (not wrapped in GeminiApiError)
  if (error.message.includes('fetch') || error.message.includes('network')) {
    decision.shouldFallback = true;
    decision.trigger = FallbackTrigger.NETWORK_ERROR;
    decision.reason = 'Network connectivity issue';
    return decision;
  }

  // Default: don't fallback for unknown errors
  decision.shouldFallback = false;
  return decision;
}

/**
 * Determine if error should trigger emergency fallback to Ollama
 */
export function shouldFallbackToOllama(sonnetError: Error, opusError: Error): boolean {
  // Fallback to Ollama if both Gemini models failed
  logger.warn('claude.fallback.both_models_failed', {
    sonnetError: sonnetError.message,
    opusError: opusError.message,
    triggeringEmergencyFallback: true,
  });

  return true;
}

/**
 * Log fallback decision
 */
export function logFallbackDecision(
  decision: FallbackDecision,
  context: {
    blueprintId?: string;
    model: string;
    attempt: number;
  }
): void {
  if (decision.shouldFallback) {
    logger.warn('claude.fallback.triggered', {
      model: context.model,
      trigger: decision.trigger,
      reason: decision.reason,
      blueprintId: context.blueprintId,
      attempt: context.attempt,
      errorMessage: decision.originalError.message,
    });
  } else {
    logger.error('claude.fallback.not_triggered', {
      model: context.model,
      blueprintId: context.blueprintId,
      attempt: context.attempt,
      errorMessage: decision.originalError.message,
      reason: 'Error type does not warrant fallback',
    });
  }
}
