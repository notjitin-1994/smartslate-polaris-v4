import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateEnvironment,
  validateEnvironmentOrExit,
  getValidatedEnv,
  EnvironmentValidationError,
  type ValidatedEnv,
} from '../environmentValidation';

describe('environmentValidation utilities', () => {
  // Store original env and console
  const originalEnv = process.env;
  const originalWindow = global.window;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset process.env
    process.env = { ...originalEnv };

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Spy on process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit called with code ${code}`);
    });

    // Ensure we're in server environment
    // @ts-expect-error - deleting window for server-side simulation
    delete global.window;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;

    // Restore window
    // @ts-expect-error - restoring window for client-side
    global.window = originalWindow;

    // Restore console and process.exit
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('EnvironmentValidationError', () => {
    it('should create error with message only', () => {
      const error = new EnvironmentValidationError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('EnvironmentValidationError');
      expect(error.missingVars).toEqual([]);
      expect(error.invalidVars).toEqual([]);
    });

    it('should create error with missing vars', () => {
      const error = new EnvironmentValidationError('Test error', ['VAR1', 'VAR2']);

      expect(error.missingVars).toEqual(['VAR1', 'VAR2']);
      expect(error.invalidVars).toEqual([]);
    });

    it('should create error with invalid vars', () => {
      const error = new EnvironmentValidationError('Test error', [], ['VAR1', 'VAR2']);

      expect(error.missingVars).toEqual([]);
      expect(error.invalidVars).toEqual(['VAR1', 'VAR2']);
    });

    it('should create error with both missing and invalid vars', () => {
      const error = new EnvironmentValidationError('Test error', ['MISSING1'], ['INVALID1']);

      expect(error.missingVars).toEqual(['MISSING1']);
      expect(error.invalidVars).toEqual(['INVALID1']);
    });
  });

  describe('validateEnvironment', () => {
    describe('Valid Configuration', () => {
      it('should validate with all required variables', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-api-key-12345';

        const result = validateEnvironment();

        expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-api-key-12345');
        expect(result.NEXT_PUBLIC_USE_AI_SDK).toBe(false); // Default
        expect(result.AI_SDK_LOG_LEVEL).toBe('info'); // Default
        expect(result.AI_SDK_TIMEOUT_MS).toBe(60000); // Default
        expect(result.AI_SDK_MAX_RETRIES).toBe(3); // Default
      });

      it('should validate with all variables explicitly set', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-full-key';
        process.env.NEXT_PUBLIC_USE_AI_SDK = 'true';
        process.env.AI_SDK_LOG_LEVEL = 'debug';
        process.env.AI_SDK_TIMEOUT_MS = '30000';
        process.env.AI_SDK_MAX_RETRIES = '5';

        const result = validateEnvironment();

        expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-full-key');
        expect(result.NEXT_PUBLIC_USE_AI_SDK).toBe(true);
        expect(result.AI_SDK_LOG_LEVEL).toBe('debug');
        expect(result.AI_SDK_TIMEOUT_MS).toBe(30000);
        expect(result.AI_SDK_MAX_RETRIES).toBe(5);
      });

      it('should log success message on server-side', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

        validateEnvironment();

        expect(consoleLogSpy).toHaveBeenCalledWith('✓ Environment validation successful');
        expect(consoleLogSpy).toHaveBeenCalledWith('  - ANTHROPIC_API_KEY: configured');
        expect(consoleLogSpy).toHaveBeenCalledWith('  - AI SDK enabled: false');
        expect(consoleLogSpy).toHaveBeenCalledWith('  - Log level: info');
        expect(consoleLogSpy).toHaveBeenCalledWith('  - Timeout: 60000ms');
        expect(consoleLogSpy).toHaveBeenCalledWith('  - Max retries: 3');
      });

      it('should transform NEXT_PUBLIC_USE_AI_SDK to boolean', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.NEXT_PUBLIC_USE_AI_SDK = 'true';

        const result = validateEnvironment();
        expect(result.NEXT_PUBLIC_USE_AI_SDK).toBe(true);

        process.env.NEXT_PUBLIC_USE_AI_SDK = 'false';
        const result2 = validateEnvironment();
        expect(result2.NEXT_PUBLIC_USE_AI_SDK).toBe(false);

        process.env.NEXT_PUBLIC_USE_AI_SDK = 'anything-else';
        const result3 = validateEnvironment();
        expect(result3.NEXT_PUBLIC_USE_AI_SDK).toBe(false);
      });

      it('should accept all valid log levels', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';

        const levels = ['debug', 'info', 'warn', 'error'] as const;
        for (const level of levels) {
          process.env.AI_SDK_LOG_LEVEL = level;
          const result = validateEnvironment();
          expect(result.AI_SDK_LOG_LEVEL).toBe(level);
        }
      });

      it('should accept timeout at boundaries', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';

        // Minimum: 1ms
        process.env.AI_SDK_TIMEOUT_MS = '1';
        let result = validateEnvironment();
        expect(result.AI_SDK_TIMEOUT_MS).toBe(1);

        // Maximum: 600000ms (10 minutes)
        process.env.AI_SDK_TIMEOUT_MS = '600000';
        result = validateEnvironment();
        expect(result.AI_SDK_TIMEOUT_MS).toBe(600000);
      });

      it('should accept max retries at boundaries', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';

        // Minimum: 0
        process.env.AI_SDK_MAX_RETRIES = '0';
        let result = validateEnvironment();
        expect(result.AI_SDK_MAX_RETRIES).toBe(0);

        // Maximum: 10
        process.env.AI_SDK_MAX_RETRIES = '10';
        result = validateEnvironment();
        expect(result.AI_SDK_MAX_RETRIES).toBe(10);
      });
    });

    describe('Missing Variables', () => {
      it('should throw when ANTHROPIC_API_KEY is missing', () => {
        delete process.env.ANTHROPIC_API_KEY;

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          expect(error).toBeInstanceOf(EnvironmentValidationError);
          const envError = error as EnvironmentValidationError;
          expect(envError.missingVars).toContain('ANTHROPIC_API_KEY');
          expect(envError.message).toContain('ANTHROPIC_API_KEY');
          expect(envError.message).toContain('missing');
        }
      });

      it('should throw when ANTHROPIC_API_KEY is empty string', () => {
        process.env.ANTHROPIC_API_KEY = '';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('ANTHROPIC_API_KEY');
        }
      });
    });

    describe('Invalid Variables', () => {
      it('should throw when ANTHROPIC_API_KEY does not start with sk-ant-', () => {
        process.env.ANTHROPIC_API_KEY = 'invalid-key-format';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('ANTHROPIC_API_KEY');
          expect(envError.message).toContain('must start with "sk-ant-"');
        }
      });

      it('should throw when AI_SDK_LOG_LEVEL is invalid', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_LOG_LEVEL = 'invalid-level';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('AI_SDK_LOG_LEVEL');
        }
      });

      it('should throw when AI_SDK_TIMEOUT_MS is below minimum', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_TIMEOUT_MS = '0'; // Below minimum (1)

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('AI_SDK_TIMEOUT_MS');
          expect(envError.message).toContain('between 1 and 600000ms');
        }
      });

      it('should throw when AI_SDK_TIMEOUT_MS is above maximum', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_TIMEOUT_MS = '600001'; // Above maximum

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('AI_SDK_TIMEOUT_MS');
        }
      });

      it('should throw when AI_SDK_MAX_RETRIES is below minimum', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_MAX_RETRIES = '-1'; // Below minimum (0)

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('AI_SDK_MAX_RETRIES');
          expect(envError.message).toContain('between 0 and 10');
        }
      });

      it('should throw when AI_SDK_MAX_RETRIES is above maximum', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_MAX_RETRIES = '11'; // Above maximum (10)

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('AI_SDK_MAX_RETRIES');
        }
      });

      it('should throw when AI_SDK_TIMEOUT_MS is not a number', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_TIMEOUT_MS = 'not-a-number';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('AI_SDK_TIMEOUT_MS');
        }
      });

      it('should throw when AI_SDK_MAX_RETRIES is not a number', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_MAX_RETRIES = 'not-a-number';

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.invalidVars).toContain('AI_SDK_MAX_RETRIES');
        }
      });
    });

    describe('Multiple Errors', () => {
      it('should report multiple missing/invalid variables', () => {
        delete process.env.ANTHROPIC_API_KEY;
        process.env.AI_SDK_LOG_LEVEL = 'invalid';
        process.env.AI_SDK_MAX_RETRIES = '100'; // Too high

        expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.missingVars).toContain('ANTHROPIC_API_KEY');
          expect(envError.invalidVars).toContain('AI_SDK_LOG_LEVEL');
          expect(envError.invalidVars).toContain('AI_SDK_MAX_RETRIES');
          expect(envError.message).toContain('ANTHROPIC_API_KEY');
          expect(envError.message).toContain('AI_SDK_LOG_LEVEL');
          expect(envError.message).toContain('AI_SDK_MAX_RETRIES');
        }
      });

      it('should include helpful error message footer', () => {
        delete process.env.ANTHROPIC_API_KEY;

        try {
          validateEnvironment();
        } catch (error) {
          const envError = error as EnvironmentValidationError;
          expect(envError.message).toContain('.env.local');
          expect(envError.message).toContain('.env.example');
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle API key with exact prefix', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-'; // Just the prefix

        const result = validateEnvironment();
        expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-');
      });

      it('should handle very long API keys', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-' + 'x'.repeat(1000);

        const result = validateEnvironment();
        expect(result.ANTHROPIC_API_KEY).toContain('sk-ant-');
      });

      it('should handle whitespace in timeout and retries', () => {
        process.env.ANTHROPIC_API_KEY = 'sk-ant-key';
        process.env.AI_SDK_TIMEOUT_MS = '  30000  ';
        process.env.AI_SDK_MAX_RETRIES = '  5  ';

        const result = validateEnvironment();
        expect(result.AI_SDK_TIMEOUT_MS).toBe(30000);
        expect(result.AI_SDK_MAX_RETRIES).toBe(5);
      });
    });
  });

  describe('validateEnvironmentOrExit', () => {
    it('should return validated env on success (server-side)', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const result = validateEnvironmentOrExit();

      expect(result).not.toBeNull();
      expect(result!.ANTHROPIC_API_KEY).toBe('sk-ant-test-key');
    });

    it('should call process.exit(1) on validation failure (server-side)', () => {
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => validateEnvironmentOrExit()).toThrow('process.exit called with code 1');
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error message before exiting', () => {
      delete process.env.ANTHROPIC_API_KEY;

      try {
        validateEnvironmentOrExit();
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorCall = consoleErrorSpy.mock.calls[0][0];
      expect(errorCall).toContain('Environment validation failed');
      expect(errorCall).toContain('ANTHROPIC_API_KEY');
    });

    it('should return null on client-side', () => {
      // Simulate client-side
      // @ts-expect-error - Setting window to simulate client-side environment
      global.window = {} as Window & typeof globalThis;

      process.env.ANTHROPIC_API_KEY = 'sk-ant-key';

      const result = validateEnvironmentOrExit();
      expect(result).toBeNull();

      // Should not call process.exit on client
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should not validate on client-side even with missing vars', () => {
      // Simulate client-side
      // @ts-expect-error - Setting window to simulate client-side environment
      global.window = {} as Window & typeof globalThis;

      delete process.env.ANTHROPIC_API_KEY;

      const result = validateEnvironmentOrExit();
      expect(result).toBeNull();

      // Should not exit or error on client
      expect(processExitSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    // Note: Testing rethrow of non-EnvironmentValidationError is difficult to mock
    // since validateEnvironment is called internally within the same module.
    // The implementation would rethrow if Zod threw an unexpected error type.
  });

  describe('getValidatedEnv', () => {
    it('should return validated env on success (server-side)', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

      const result = getValidatedEnv();

      expect(result).not.toBeNull();
      expect(result!.ANTHROPIC_API_KEY).toBe('sk-ant-test-key');
    });

    it('should return null on validation failure (server-side)', () => {
      delete process.env.ANTHROPIC_API_KEY;

      const result = getValidatedEnv();
      expect(result).toBeNull();

      // Should not exit or throw
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should return null on client-side', () => {
      // Simulate client-side
      // @ts-expect-error - Setting window to simulate client-side environment
      global.window = {} as Window & typeof globalThis;

      process.env.ANTHROPIC_API_KEY = 'sk-ant-key';

      const result = getValidatedEnv();
      expect(result).toBeNull();
    });

    it('should not throw on client-side with missing vars', () => {
      // Simulate client-side
      // @ts-expect-error - Setting window to simulate client-side environment
      global.window = {} as Window & typeof globalThis;

      delete process.env.ANTHROPIC_API_KEY;

      const result = getValidatedEnv();
      expect(result).toBeNull();
    });

    it('should silently return null on any error', () => {
      process.env.ANTHROPIC_API_KEY = 'invalid-key';

      const result = getValidatedEnv();
      expect(result).toBeNull();

      // Should not log errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should validate production-like configuration', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-prod-key-1234567890abcdef';
      process.env.NEXT_PUBLIC_USE_AI_SDK = 'true';
      process.env.AI_SDK_LOG_LEVEL = 'warn';
      process.env.AI_SDK_TIMEOUT_MS = '120000'; // 2 minutes
      process.env.AI_SDK_MAX_RETRIES = '5';

      const result = validateEnvironment();

      expect(result.ANTHROPIC_API_KEY).toContain('sk-ant-');
      expect(result.NEXT_PUBLIC_USE_AI_SDK).toBe(true);
      expect(result.AI_SDK_LOG_LEVEL).toBe('warn');
      expect(result.AI_SDK_TIMEOUT_MS).toBe(120000);
      expect(result.AI_SDK_MAX_RETRIES).toBe(5);
    });

    it('should validate development-like configuration', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-dev-key-test';
      process.env.NEXT_PUBLIC_USE_AI_SDK = 'true';
      process.env.AI_SDK_LOG_LEVEL = 'debug';
      process.env.AI_SDK_TIMEOUT_MS = '10000'; // 10 seconds for dev
      process.env.AI_SDK_MAX_RETRIES = '1';

      const result = validateEnvironment();

      expect(result.AI_SDK_LOG_LEVEL).toBe('debug');
      expect(result.AI_SDK_TIMEOUT_MS).toBe(10000);
      expect(result.AI_SDK_MAX_RETRIES).toBe(1);
    });

    it('should validate minimal configuration (required only)', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-minimal-key';
      // All optional vars use defaults

      const result = validateEnvironment();

      expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-minimal-key');
      expect(result.NEXT_PUBLIC_USE_AI_SDK).toBe(false);
      expect(result.AI_SDK_LOG_LEVEL).toBe('info');
      expect(result.AI_SDK_TIMEOUT_MS).toBe(60000);
      expect(result.AI_SDK_MAX_RETRIES).toBe(3);
    });

    it('should handle application startup flow', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-startup-key';

      // Simulate application startup
      let env: ValidatedEnv | null = null;

      // Step 1: Validate environment (would be in instrumentation.ts)
      expect(() => {
        env = validateEnvironmentOrExit();
      }).not.toThrow();

      // Step 2: Use validated env throughout app
      expect(env).not.toBeNull();
      expect(env!.ANTHROPIC_API_KEY).toBeDefined();

      // Step 3: Can safely access config
      const config = getValidatedEnv();
      expect(config).not.toBeNull();
      expect(config!.ANTHROPIC_API_KEY).toBe('sk-ant-startup-key');
    });

    it('should prevent startup with invalid configuration', () => {
      process.env.ANTHROPIC_API_KEY = 'wrong-prefix-key';

      expect(() => validateEnvironmentOrExit()).toThrow();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Type Safety', () => {
    it('should infer correct types for validated env', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-key';

      const result = validateEnvironment();

      // Type assertions (compile-time checks)
      const apiKey: string = result.ANTHROPIC_API_KEY;
      const useAiSdk: boolean = result.NEXT_PUBLIC_USE_AI_SDK;
      const logLevel: 'debug' | 'info' | 'warn' | 'error' = result.AI_SDK_LOG_LEVEL;
      const timeout: number = result.AI_SDK_TIMEOUT_MS;
      const retries: number = result.AI_SDK_MAX_RETRIES;

      expect(typeof apiKey).toBe('string');
      expect(typeof useAiSdk).toBe('boolean');
      expect(typeof logLevel).toBe('string');
      expect(typeof timeout).toBe('number');
      expect(typeof retries).toBe('number');
    });
  });
});
