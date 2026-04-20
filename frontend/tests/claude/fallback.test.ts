/**
 * Tests for Gemini Fallback Logic
 */

import { describe, it, expect } from 'vitest';
import {
  shouldFallbackToSonnet4,
  shouldFallbackToOllama,
  FallbackTrigger,
} from '@/lib/claude/fallback';
import { GeminiApiError } from '@/lib/claude/client';
import { ValidationError } from '@/lib/claude/validation';

describe('Gemini Fallback Logic', () => {
  describe('shouldFallbackToSonnet4', () => {
    describe('GeminiApiError scenarios', () => {
      it('should fallback on timeout error', () => {
        const error = new GeminiApiError('Request timeout', 408, 'timeout');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.TIMEOUT);
        expect(decision.reason).toContain('timeout');
      });

      it('should fallback on rate limit error (429)', () => {
        const error = new GeminiApiError('Rate limit', 429);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.RATE_LIMIT);
      });

      it('should fallback on rate_limit_error type', () => {
        const error = new GeminiApiError('Rate limit', 200, 'rate_limit_error');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.RATE_LIMIT);
      });

      it('should fallback on 401 Unauthorized', () => {
        const error = new GeminiApiError('Unauthorized', 401);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.INVALID_API_KEY);
      });

      it('should fallback on 403 Forbidden', () => {
        const error = new GeminiApiError('Forbidden', 403);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.INVALID_API_KEY);
      });

      it('should fallback on 4xx client errors', () => {
        const error = new GeminiApiError('Bad Request', 400);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.API_ERROR_4XX);
        expect(decision.reason).toContain('400');
      });

      it('should fallback on 404 Not Found', () => {
        const error = new GeminiApiError('Not Found', 404);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.API_ERROR_4XX);
      });

      it('should fallback on 5xx server errors', () => {
        const error = new GeminiApiError('Internal Server Error', 500);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.API_ERROR_5XX);
        expect(decision.reason).toContain('500');
      });

      it('should fallback on 502 Bad Gateway', () => {
        const error = new GeminiApiError('Bad Gateway', 502);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.API_ERROR_5XX);
      });

      it('should fallback on 503 Service Unavailable', () => {
        const error = new GeminiApiError('Service Unavailable', 503);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.API_ERROR_5XX);
      });

      it('should fallback on network_error type', () => {
        const error = new GeminiApiError('Network failed', undefined, 'network_error');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.NETWORK_ERROR);
      });

      it('should fallback on parse_error type', () => {
        const error = new GeminiApiError('Parse failed', undefined, 'parse_error');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.JSON_PARSE_ERROR);
      });
    });

    describe('ValidationError scenarios', () => {
      it('should fallback on INVALID_JSON validation error', () => {
        const error = new ValidationError('Invalid JSON', 'INVALID_JSON');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.JSON_PARSE_ERROR);
      });

      it('should NOT fallback on structural validation errors', () => {
        const error = new ValidationError('Missing metadata', 'MISSING_METADATA');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(false);
      });

      it('should NOT fallback on NO_SECTIONS error', () => {
        const error = new ValidationError('No sections', 'NO_SECTIONS');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(false);
      });

      it('should NOT fallback on MISSING_METADATA_FIELD error', () => {
        const error = new ValidationError('Missing field', 'MISSING_METADATA_FIELD');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(false);
      });
    });

    describe('Generic Error scenarios', () => {
      it('should fallback on network-related errors', () => {
        const error = new Error('fetch failed');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.NETWORK_ERROR);
      });

      it('should fallback on network connectivity errors', () => {
        const error = new Error('network timeout');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.NETWORK_ERROR);
      });

      it('should NOT fallback on unknown error types', () => {
        const error = new Error('Unknown error');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(false);
      });

      it('should NOT fallback on application logic errors', () => {
        const error = new Error('Invalid input');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(false);
      });
    });

    describe('Decision object structure', () => {
      it('should include originalError in decision', () => {
        const error = new GeminiApiError('Test error', 500);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.originalError).toBe(error);
      });

      it('should include trigger when fallback is warranted', () => {
        const error = new GeminiApiError('Test error', 500);
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.trigger).toBeDefined();
        expect(decision.reason).toBeDefined();
      });

      it('should not include trigger when fallback is not warranted', () => {
        const error = new Error('Unknown error');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.trigger).toBeUndefined();
        expect(decision.reason).toBeUndefined();
      });
    });

    describe('Edge cases', () => {
      it('should handle GeminiApiError without status code', () => {
        const error = new GeminiApiError('Generic error');
        const decision = shouldFallbackToSonnet4(error);

        // Should only fallback if errorType indicates a fallback-worthy error
        expect(decision.shouldFallback).toBe(false);
      });

      it('should handle GeminiApiError with only errorType', () => {
        const error = new GeminiApiError('Error', undefined, 'timeout');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.TIMEOUT);
      });

      it('should prioritize errorType over statusCode for rate limits', () => {
        const error = new GeminiApiError('Rate limit', 200, 'rate_limit_error');
        const decision = shouldFallbackToSonnet4(error);

        expect(decision.shouldFallback).toBe(true);
        expect(decision.trigger).toBe(FallbackTrigger.RATE_LIMIT);
      });
    });
  });

  describe('shouldFallbackToOllama', () => {
    it('should always return true when both Gemini models fail', () => {
      const sonnetError = new GeminiApiError('Sonnet failed', 500);
      const opusError = new GeminiApiError('Opus failed', 500);

      const result = shouldFallbackToOllama(sonnetError, opusError);

      expect(result).toBe(true);
    });

    it('should handle different error types for both models', () => {
      const sonnetError = new Error('Network error');
      const opusError = new ValidationError('Parse error', 'INVALID_JSON');

      const result = shouldFallbackToOllama(sonnetError, opusError);

      expect(result).toBe(true);
    });

    it('should work with generic errors', () => {
      const sonnetError = new Error('Error 1');
      const opusError = new Error('Error 2');

      const result = shouldFallbackToOllama(sonnetError, opusError);

      expect(result).toBe(true);
    });
  });
});
