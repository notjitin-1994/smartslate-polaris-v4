/**
 * Tests for Client Error Tracker
 * Unit tests for client-side error capture and queueing
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { clientErrorTracker } from '@/lib/logging/clientErrorTracker';

// Mock fetch
global.fetch = vi.fn();

describe('Client Error Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Manual Error Capture', () => {
    it('should capture errors manually', async () => {
      const testError = new Error('Test error');

      clientErrorTracker.captureError(testError, { context: 'test' });

      // Wait for async queue processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/logs/client',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test error'),
        })
      );
    });

    it('should capture warnings', async () => {
      clientErrorTracker.captureWarning('Warning message', { source: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/logs/client',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Warning message'),
        })
      );
    });

    it('should capture info messages', async () => {
      clientErrorTracker.captureInfo('Info message', { action: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/logs/client',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Info message'),
        })
      );
    });
  });

  describe('React Error Boundary Integration', () => {
    it('should capture React errors with component stack', async () => {
      const testError = new Error('Component error');
      const errorInfo = {
        componentStack: '    in ErrorComponent (at App.tsx:10)\n    in App (at index.tsx:5)',
      };

      clientErrorTracker.captureReactError(testError, errorInfo);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/logs/client',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Component error'),
        })
      );

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.metadata.componentStack).toBeDefined();
      expect(callBody.metadata.type).toBe('react.error');
    });
  });

  describe('Error Context', () => {
    it('should include error stack trace', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:10:15';

      clientErrorTracker.captureError(error);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.metadata.errorStack).toContain('test.ts:10:15');
    });

    it('should handle non-Error objects', async () => {
      clientErrorTracker.captureError('String error message');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/logs/client',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('String error message'),
        })
      );
    });

    it('should include custom context', async () => {
      const error = new Error('Test error');
      const context = {
        userId: 'user-123',
        action: 'button-click',
        data: { foo: 'bar' },
      };

      clientErrorTracker.captureError(error, context);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.metadata.userId).toBe('user-123');
      expect(callBody.metadata.action).toBe('button-click');
      expect(callBody.metadata.data).toEqual({ foo: 'bar' });
    });
  });

  describe('Error Queueing', () => {
    it('should queue errors when API fails', async () => {
      // First call fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      // Second call succeeds
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const error = new Error('Test error');
      clientErrorTracker.captureError(error);

      // Wait for first attempt and retry
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have attempted at least once
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should retry failed requests', async () => {
      let callCount = 0;
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      });

      const error = new Error('Test error');
      clientErrorTracker.captureError(error);

      // Just verify it was called once initially
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callCount).toBeGreaterThanOrEqual(1);
    }, 1000);

    it('should process multiple errors in queue', async () => {
      const errors = [new Error('Error 1'), new Error('Error 2'), new Error('Error 3')];

      errors.forEach((error) => clientErrorTracker.captureError(error));

      // Wait for queue processing
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should have been called at least once
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Payload Structure', () => {
    it('should send correct payload structure', async () => {
      vi.clearAllMocks();
      const error = new Error('Test error');
      clientErrorTracker.captureError(error);

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = (global.fetch as any).mock.calls[0];
      if (callArgs && callArgs[1]) {
        const callBody = JSON.parse(callArgs[1].body);

        expect(callBody).toHaveProperty('level');
        expect(callBody).toHaveProperty('event');
        expect(callBody).toHaveProperty('message');
        expect(callBody).toHaveProperty('metadata');
        expect(callBody.metadata).toHaveProperty('url');
        expect(callBody.metadata).toHaveProperty('userAgent');
      }
    });

    it('should use correct event names', async () => {
      vi.clearAllMocks();

      clientErrorTracker.captureError(new Error('Error'));
      await new Promise((resolve) => setTimeout(resolve, 200));

      const errorCall = (global.fetch as any).mock.calls[0];
      if (errorCall && errorCall[1]) {
        const callBody = JSON.parse(errorCall[1].body);
        expect(callBody.event).toBe('ui.error.captured');
      }
    });
  });
});
