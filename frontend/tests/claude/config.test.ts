/**
 * Tests for Gemini API Configuration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGeminiConfig, isGeminiConfigured } from '@/lib/claude/config';

describe('Gemini Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getGeminiConfig', () => {
    it('should load configuration from environment variables', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';
      process.env.ANTHROPIC_BASE_URL = 'https://test.api.com';
      process.env.ANTHROPIC_VERSION = '2024-01-01';

      const config = getGeminiConfig();

      expect(config.apiKey).toBe('test-api-key');
      expect(config.baseUrl).toBe('https://test.api.com');
      expect(config.version).toBe('2024-01-01');
    });

    it('should use default values when optional env vars are missing', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';
      delete process.env.ANTHROPIC_BASE_URL;
      delete process.env.ANTHROPIC_VERSION;

      const config = getGeminiConfig();

      expect(config.baseUrl).toBe('https://api.anthropic.com');
      expect(config.version).toBe('2023-06-01');
    });

    it('should trim whitespace from environment variables', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = '  test-api-key  ';
      process.env.ANTHROPIC_BASE_URL = '  https://test.api.com  ';

      const config = getGeminiConfig();

      expect(config.apiKey).toBe('test-api-key');
      expect(config.baseUrl).toBe('https://test.api.com');
    });

    it('should remove trailing slash from base URL', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';
      process.env.ANTHROPIC_BASE_URL = 'https://test.api.com/';

      const config = getGeminiConfig();

      expect(config.baseUrl).toBe('https://test.api.com');
    });

    it('should return safe default config if API key is missing', () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

      const config = getGeminiConfig();

      expect(config.apiKey).toBe('');
      expect(config.primaryModel).toBe('gemini-3.1-pro-preview');
      expect(config.fallbackModel).toBe('gemini-3.1-pro-preview');
      expect(config.baseUrl).toBe('https://api.anthropic.com');
    });

    it('should return safe default config if API key is empty string', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = '';

      const config = getGeminiConfig();

      expect(config.apiKey).toBe('');
      expect(config.primaryModel).toBe('gemini-3.1-pro-preview');
      expect(config.fallbackModel).toBe('gemini-3.1-pro-preview');
    });

    it('should return safe default config if API key is only whitespace', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = '   ';

      const config = getGeminiConfig();

      expect(config.apiKey).toBe('');
      expect(config.primaryModel).toBe('gemini-3.1-pro-preview');
      expect(config.fallbackModel).toBe('gemini-3.1-pro-preview');
    });

    it('should return correct model names', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';

      const config = getGeminiConfig();

      expect(config.primaryModel).toBe('gemini-3.1-pro-preview');
      expect(config.fallbackModel).toBe('gemini-3.1-pro-preview');
    });

    it('should return correct configuration values', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';

      const config = getGeminiConfig();

      expect(config.maxTokens).toBe(16000);
      expect(config.temperature).toBe(0.2);
      expect(config.timeout).toBe(840000);
      expect(config.retries).toBe(2);
    });

    it('should try NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY as fallback', () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY = 'fallback-api-key';

      const config = getGeminiConfig();

      expect(config.apiKey).toBe('fallback-api-key');
    });
  });

  describe('isGeminiConfigured', () => {
    it('should return true when GOOGLE_GENERATIVE_AI_API_KEY is set', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';

      expect(isGeminiConfigured()).toBe(true);
    });

    it('should return true when NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY is set', () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY = 'test-api-key';

      expect(isGeminiConfigured()).toBe(true);
    });

    it('should return false when no API key is set', () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

      expect(isGeminiConfigured()).toBe(false);
    });

    it('should not throw error when no API key is set', () => {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

      expect(() => isGeminiConfigured()).not.toThrow();
    });
  });

  describe('Security', () => {
    it('should not expose API key in client-safe function', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'secret-api-key';

      // isGeminiConfigured should not return the key itself
      const result = isGeminiConfigured();
      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    });

    it('should only expose API key through server-side function', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'secret-api-key';

      const config = getGeminiConfig();

      // API key should only be accessible through getGeminiConfig
      expect(config.apiKey).toBe('secret-api-key');
    });
  });
});
