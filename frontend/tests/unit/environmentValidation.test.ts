/**
 * Unit tests for environment validation module
 *
 * Tests all validation scenarios including:
 * - Successful validation with all required variables
 * - Missing required variables
 * - Invalid variable formats
 * - Optional variables with defaults
 * - Fail-fast behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEnvironment,
  validateEnvironmentOrExit,
  getValidatedEnv,
  EnvironmentValidationError,
} from '../../lib/utils/environmentValidation';

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let originalWindow: typeof globalThis.window | undefined;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Save and delete window to simulate server-side environment
    originalWindow = globalThis.window;
    // @ts-expect-error - Deleting window for server-side simulation
    delete globalThis.window;

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code})`);
    });

    // Clear all environment variables
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.NEXT_PUBLIC_USE_AI_SDK;
    delete process.env.AI_SDK_LOG_LEVEL;
    delete process.env.AI_SDK_TIMEOUT_MS;
    delete process.env.AI_SDK_MAX_RETRIES;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Restore window
    if (originalWindow) {
      globalThis.window = originalWindow;
    }

    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('validateEnvironment', () => {
    describe('Success Scenarios', () => {
      it('should validate successfully with all required variables', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';

        const result = validateEnvironment();

        expect(result).toBeDefined();
        expect(result.GOOGLE_GENERATIVE_AI_API_KEY).toBe('sk-ant-api03-test-key');
        expect(result.NEXT_PUBLIC_USE_AI_SDK).toBe(false); // default
        expect(result.AI_SDK_LOG_LEVEL).toBe('info'); // default
        expect(result.AI_SDK_TIMEOUT_MS).toBe(60000); // default
        expect(result.AI_SDK_MAX_RETRIES).toBe(3); // default
      });

      it('should parse NEXT_PUBLIC_USE_AI_SDK as boolean', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.NEXT_PUBLIC_USE_AI_SDK = 'true';

        const result = validateEnvironment();

        expect(result.NEXT_PUBLIC_USE_AI_SDK).toBe(true);
      });

      it('should validate with custom log level', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.AI_SDK_LOG_LEVEL = 'debug';

        const result = validateEnvironment();

        expect(result.AI_SDK_LOG_LEVEL).toBe('debug');
      });

      it('should parse timeout as number', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.AI_SDK_TIMEOUT_MS = '30000';

        const result = validateEnvironment();

        expect(result.AI_SDK_TIMEOUT_MS).toBe(30000);
      });

      it('should parse max retries as number', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.AI_SDK_MAX_RETRIES = '5';

        const result = validateEnvironment();

        expect(result.AI_SDK_MAX_RETRIES).toBe(5);
      });

      it('should log successful validation server-side', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';

        // In test environment, window is undefined, so isServer is true
        validateEnvironment();

        expect(consoleLogSpy).toHaveBeenCalled();
        expect(consoleLogSpy.mock.calls[0][0]).toContain('Environment validation successful');
      });
    });

    describe('Missing Variable Scenarios', () => {
      it('should throw EnvironmentValidationError when GOOGLE_GENERATIVE_AI_API_KEY is missing', () => {
        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          if (error instanceof EnvironmentValidationError) {
            expect(error.missingVars).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
            expect(error.message).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
          }
        }
      });

      it('should throw EnvironmentValidationError when both required variables are missing', () => {
        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          if (error instanceof EnvironmentValidationError) {
            expect(error.missingVars).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
            expect(error.message).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
            expect(error.message).toContain('.env.example');
          }
        }
      });
    });

    describe('Invalid Variable Scenarios', () => {
      it('should throw EnvironmentValidationError for invalid Anthropic API key format', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'invalid-key-format';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          if (error instanceof EnvironmentValidationError) {
            expect(error.invalidVars).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
            expect(error.message).toContain('sk-ant-');
          }
        }
      });

      it('should throw EnvironmentValidationError for invalid log level', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.AI_SDK_LOG_LEVEL = 'invalid-level';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
      });

      it('should throw EnvironmentValidationError for timeout exceeding max', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.AI_SDK_TIMEOUT_MS = '1000000'; // exceeds 600000 max

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
      });

      it('should throw EnvironmentValidationError for negative timeout', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.AI_SDK_TIMEOUT_MS = '-1000';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
      });

      it('should throw EnvironmentValidationError for max retries exceeding limit', () => {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';
        process.env.AI_SDK_MAX_RETRIES = '15'; // exceeds 10 max

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
      });
    });
  });

  describe('validateEnvironmentOrExit', () => {
    it('should return validated environment on success', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';

      const result = validateEnvironmentOrExit();

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.GOOGLE_GENERATIVE_AI_API_KEY).toBe('sk-ant-api03-test-key');
    });

    it('should call process.exit(1) on validation failure', () => {
      expect(() => validateEnvironmentOrExit()).toThrow('process.exit(1)');
    });

    it('should log error message before exiting', () => {
      try {
        validateEnvironmentOrExit();
      } catch (_error) {
        // Expected to throw
        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorMessage = consoleErrorSpy.mock.calls[0][0];
        expect(errorMessage).toContain('Environment validation failed');
        expect(errorMessage).toContain('GOOGLE_GENERATIVE_AI_API_KEY');
      }
    });
  });

  describe('getValidatedEnv', () => {
    it('should return validated environment on success', () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'sk-ant-api03-test-key';

      const result = getValidatedEnv();

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.GOOGLE_GENERATIVE_AI_API_KEY).toBe('sk-ant-api03-test-key');
    });

    it('should return null on validation failure', () => {
      // Missing GOOGLE_GENERATIVE_AI_API_KEY

      const result = getValidatedEnv();

      expect(result).toBeNull();
    });

    it('should not throw on validation failure', () => {
      expect(() => getValidatedEnv()).not.toThrow();
    });
  });

  describe('EnvironmentValidationError', () => {
    it('should have correct name property', () => {
      const error = new EnvironmentValidationError('Test error');

      expect(error.name).toBe('EnvironmentValidationError');
    });

    it('should store missing and invalid variables', () => {
      const error = new EnvironmentValidationError('Test error', ['VAR1', 'VAR2'], ['VAR3']);

      expect(error.missingVars).toEqual(['VAR1', 'VAR2']);
      expect(error.invalidVars).toEqual(['VAR3']);
    });

    it('should be instance of Error', () => {
      const error = new EnvironmentValidationError('Test error');

      expect(error).toBeInstanceOf(Error);
    });
  });
});
