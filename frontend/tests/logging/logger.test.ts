/**
 * Tests for Logger Service
 * Unit tests for logging middleware and PII redaction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, createServiceLogger } from '@/lib/logging';

describe('Logger Service', () => {
  beforeEach(() => {
    // Clear logs before each test
    logger.clear();
    vi.clearAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      const entry = logger.info('test.event', 'Test message', { key: 'value' });

      expect(entry).toBeDefined();
      expect(entry?.level).toBe('info');
      expect(entry?.event).toBe('test.event');
      expect(entry?.message).toBe('Test message');
      expect(entry?.metadata.key).toBe('value');
    });

    it('should log error messages', () => {
      const testError = new Error('Test error');
      const entry = logger.error('test.error', 'Error occurred', { error: testError });

      expect(entry).toBeDefined();
      expect(entry?.level).toBe('error');
      expect(entry?.metadata.error).toBe('Test error');
      expect(entry?.metadata.errorStack).toBeDefined();
    });

    it('should log warning messages', () => {
      const entry = logger.warn('test.warning', 'Warning message');

      expect(entry).toBeDefined();
      expect(entry?.level).toBe('warn');
    });

    it('should log debug messages', () => {
      // Set to debug level first
      logger.setMinLevel('debug');

      const entry = logger.debug('test.debug', 'Debug message');

      expect(entry).toBeDefined();
      expect(entry?.level).toBe('debug');

      // Reset to default
      logger.setMinLevel('info');
    });
  });

  describe('PII Redaction', () => {
    it('should redact API keys', () => {
      const entry = logger.info('test.event', 'Test', {
        api_key: 'secret-key-123',
        apiKey: 'another-secret',
      });

      expect(entry?.metadata.api_key).toBe('[REDACTED]');
      expect(entry?.metadata.apiKey).toBe('[REDACTED]');
    });

    it('should redact tokens', () => {
      const entry = logger.info('test.event', 'Test', {
        token: 'bearer-token-123',
        access_token: 'access-123',
      });

      expect(entry?.metadata.token).toBe('[REDACTED]');
      expect(entry?.metadata.access_token).toBe('[REDACTED]');
    });

    it('should redact passwords', () => {
      const entry = logger.info('test.event', 'Test', {
        password: 'my-password',
        user_password: 'secret',
      });

      expect(entry?.metadata.password).toBe('[REDACTED]');
      expect(entry?.metadata.user_password).toBe('[REDACTED]');
    });

    it('should redact authorization headers', () => {
      const entry = logger.info('test.event', 'Test', {
        authorization: 'Bearer token',
        Authorization: 'Bearer token',
      });

      expect(entry?.metadata.authorization).toBe('[REDACTED]');
      expect(entry?.metadata.Authorization).toBe('[REDACTED]');
    });

    it('should redact nested sensitive data', () => {
      const entry = logger.info('test.event', 'Test', {
        user: {
          name: 'John',
          password: 'secret',
          api_key: 'key-123',
        },
      });

      expect(entry?.metadata.user.name).toBe('John');
      expect(entry?.metadata.user.password).toBe('[REDACTED]');
      expect(entry?.metadata.user.api_key).toBe('[REDACTED]');
    });

    it('should not redact non-sensitive data', () => {
      const entry = logger.info('test.event', 'Test', {
        userId: 'user-123',
        blueprintId: 'blueprint-456',
        email: 'test@example.com',
      });

      expect(entry?.metadata.userId).toBe('user-123');
      expect(entry?.metadata.blueprintId).toBe('blueprint-456');
      expect(entry?.metadata.email).toBe('test@example.com');
    });
  });

  describe('Service Logger', () => {
    it('should create logger with specific service', () => {
      logger.clear();
      const apiLogger = createServiceLogger('api');
      const entry = apiLogger.info('api.request', 'Test request');

      expect(entry?.service).toBe('api');
    });

    it('should support multiple service loggers', () => {
      logger.clear();

      logger.setService('api');
      const apiEntry = logger.info('api.request', 'API request');

      logger.setService('database');
      const dbEntry = logger.info('database.query', 'DB query');

      expect(apiEntry?.service).toBe('api');
      expect(dbEntry?.service).toBe('database');

      // Reset to default
      logger.setService('system');
    });
  });

  describe('Timer Functionality', () => {
    it('should measure operation duration', async () => {
      logger.clear();
      const endTimer = logger.startTimer('test.operation', 'Test operation');

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 50));

      endTimer();

      const store = logger.getStore();
      const logs = store.getAll();
      const completionLog = logs.find((log) => log.event === 'test.operation.complete');

      expect(completionLog).toBeDefined();
      expect(completionLog?.metadata.duration).toBeGreaterThan(0);
      expect(completionLog?.metadata.duration).toBeLessThan(200);
    });
  });

  describe('Error Handling with Logging', () => {
    it('should log errors from async operations', async () => {
      const testError = new Error('Operation failed');

      await expect(
        logger.withLogging('test.operation', 'Test operation', async () => {
          throw testError;
        })
      ).rejects.toThrow('Operation failed');

      const store = logger.getStore();
      const logs = store.getAll();
      const errorLog = logs.find((log) => log.event === 'test.operation.error');

      expect(errorLog).toBeDefined();
      expect(errorLog?.level).toBe('error');
      expect(errorLog?.metadata.error).toBe('Operation failed');
    });

    it('should log success for async operations', async () => {
      await logger.withLogging('test.operation', 'Test operation', async () => {
        return 'success';
      });

      const store = logger.getStore();
      const logs = store.getAll();
      const completeLog = logs.find((log) => log.event === 'test.operation.complete');

      expect(completeLog).toBeDefined();
      expect(completeLog?.metadata.duration).toBeDefined();
    });
  });

  describe('Log Storage', () => {
    it('should store logs in memory', () => {
      logger.info('test.event', 'Message 1');
      logger.info('test.event', 'Message 2');
      logger.error('test.error', 'Error 1');

      const store = logger.getStore();
      const logs = store.getAll();

      expect(logs).toHaveLength(3);
    });

    it('should clear all logs', () => {
      logger.info('test.event', 'Message 1');
      logger.info('test.event', 'Message 2');

      logger.clear();

      const store = logger.getStore();
      const logs = store.getAll();

      expect(logs).toHaveLength(0);
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect minimum log level', () => {
      // Set min level to warn (should skip debug and info)
      logger.setMinLevel('warn');

      logger.debug('test.debug', 'Debug message');
      logger.info('test.info', 'Info message');
      logger.warn('test.warn', 'Warn message');
      logger.error('test.error', 'Error message');

      const store = logger.getStore();
      const logs = store.getAll();

      // Should only have warn and error
      expect(logs.length).toBe(2);
      expect(logs.some((log) => log.level === 'warn')).toBe(true);
      expect(logs.some((log) => log.level === 'error')).toBe(true);
      expect(logs.some((log) => log.level === 'debug')).toBe(false);
      expect(logs.some((log) => log.level === 'info')).toBe(false);

      // Reset to default
      logger.setMinLevel('info');
    });
  });
});
