/**
 * Tests for LogStore
 * Unit tests for log querying, filtering, and export
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LogStore } from '@/lib/logging';
import type { LogEntry } from '@/lib/logging/types';

describe('LogStore', () => {
  let store: LogStore;

  beforeEach(() => {
    store = new LogStore();
  });

  describe('Basic Operations', () => {
    it('should add log entries', () => {
      const entry: LogEntry = {
        id: 'log_1',
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'api',
        event: 'test.event',
        message: 'Test message',
        metadata: {},
      };

      store.add(entry);

      const logs = store.getAll();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('log_1');
    });

    it('should get all logs', () => {
      for (let i = 0; i < 5; i++) {
        store.add({
          id: `log_${i}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          service: 'api',
          event: 'test.event',
          message: `Message ${i}`,
          metadata: {},
        });
      }

      const logs = store.getAll();
      expect(logs).toHaveLength(5);
    });

    it('should get log by id', () => {
      const entry: LogEntry = {
        id: 'log_specific',
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'api',
        event: 'test.event',
        message: 'Test message',
        metadata: {},
      };

      store.add(entry);

      const found = store.getById('log_specific');
      expect(found).toBeDefined();
      expect(found?.id).toBe('log_specific');
    });

    it('should clear all logs', () => {
      store.add({
        id: 'log_1',
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'api',
        event: 'test.event',
        message: 'Test',
        metadata: {},
      });

      store.clear();

      expect(store.count()).toBe(0);
    });

    it('should get recent logs', () => {
      for (let i = 0; i < 10; i++) {
        store.add({
          id: `log_${i}`,
          timestamp: new Date(Date.now() + i).toISOString(),
          level: 'info',
          service: 'api',
          event: 'test.event',
          message: `Message ${i}`,
          metadata: {},
        });
      }

      const recent = store.getRecent(5);
      expect(recent).toHaveLength(5);
      // Should be in reverse order (newest first)
      expect(recent[0].id).toBe('log_9');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      // Add test data
      const levels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];
      const services: Array<'api' | 'database' | 'perplexity'> = ['api', 'database', 'perplexity'];

      for (let i = 0; i < 12; i++) {
        store.add({
          id: `log_${i}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          level: levels[i % 4],
          service: services[i % 3],
          event: 'test.event',
          message: `Message ${i}`,
          metadata: {
            userId: i % 2 === 0 ? 'user-1' : 'user-2',
            blueprintId: i % 3 === 0 ? 'blueprint-1' : 'blueprint-2',
          },
        });
      }
    });

    it('should filter by log level', () => {
      const errorLogs = store.query({ level: 'error' });
      expect(errorLogs.every((log) => log.level === 'error')).toBe(true);
    });

    it('should filter by multiple log levels', () => {
      const logs = store.query({ level: ['error', 'warn'] });
      expect(logs.every((log) => log.level === 'error' || log.level === 'warn')).toBe(true);
    });

    it('should filter by service', () => {
      const apiLogs = store.query({ service: 'api' });
      expect(apiLogs.every((log) => log.service === 'api')).toBe(true);
    });

    it('should filter by multiple services', () => {
      const logs = store.query({ service: ['api', 'database'] });
      expect(logs.every((log) => log.service === 'api' || log.service === 'database')).toBe(true);
    });

    it('should filter by userId', () => {
      const userLogs = store.query({ userId: 'user-1' });
      expect(userLogs.every((log) => log.metadata.userId === 'user-1')).toBe(true);
    });

    it('should filter by blueprintId', () => {
      const blueprintLogs = store.query({ blueprintId: 'blueprint-1' });
      expect(blueprintLogs.every((log) => log.metadata.blueprintId === 'blueprint-1')).toBe(true);
    });

    it('should support search in message', () => {
      const logs = store.query({ search: 'Message 5' });
      expect(logs.some((log) => log.message.includes('Message 5'))).toBe(true);
    });

    it('should support pagination', () => {
      const page1 = store.query({ limit: 5, offset: 0 });
      const page2 = store.query({ limit: 5, offset: 5 });

      expect(page1).toHaveLength(5);
      expect(page2).toHaveLength(5);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should filter by time range', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 10000);

      const logs = store.query({
        from: now.toISOString(),
        to: future.toISOString(),
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should combine multiple filters', () => {
      const logs = store.query({
        level: 'error',
        service: 'api',
        userId: 'user-1',
      });

      expect(
        logs.every(
          (log) =>
            log.level === 'error' && log.service === 'api' && log.metadata.userId === 'user-1'
        )
      ).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      // Add test data with known distribution
      for (let i = 0; i < 10; i++) {
        store.add({
          id: `log_${i}`,
          timestamp: new Date().toISOString(),
          level: i < 5 ? 'info' : i < 8 ? 'warn' : 'error',
          service: 'api',
          event: 'test.event',
          message: `Message ${i}`,
          metadata: {
            duration: i * 100,
          },
        });
      }
    });

    it('should calculate total logs', () => {
      const stats = store.getStats();
      expect(stats.total).toBe(10);
    });

    it('should count logs by level', () => {
      const stats = store.getStats();
      expect(stats.byLevel.info).toBe(5);
      expect(stats.byLevel.warn).toBe(3);
      expect(stats.byLevel.error).toBe(2);
    });

    it('should calculate error rate', () => {
      const stats = store.getStats();
      expect(stats.errorRate).toBe(20); // 2 errors out of 10 = 20%
    });

    it('should calculate average duration', () => {
      const stats = store.getStats();
      // Average of 0, 100, 200, ..., 900 = 450
      expect(stats.avgDuration).toBe(450);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      store.add({
        id: 'log_1',
        timestamp: '2025-01-01T00:00:00.000Z',
        level: 'info',
        service: 'api',
        event: 'test.event',
        message: 'Test message',
        metadata: {
          userId: 'user-123',
          duration: 100,
        },
      });
    });

    it('should export logs as JSON', () => {
      const json = store.exportJSON();
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('log_1');
    });

    it('should export logs as CSV', () => {
      const csv = store.exportCSV();

      expect(csv).toContain('ID,Timestamp,Level,Service,Event,Message');
      expect(csv).toContain('log_1');
      expect(csv).toContain('info');
      expect(csv).toContain('api');
      expect(csv).toContain('Test message');
    });

    it('should export logs as plain text', () => {
      const txt = store.exportText();

      expect(txt).toContain('[2025-01-01T00:00:00.000Z]');
      expect(txt).toContain('[INFO]');
      expect(txt).toContain('[api]');
      expect(txt).toContain('test.event');
      expect(txt).toContain('Test message');
      expect(txt).toContain('(100ms)');
    });

    it('should export filtered logs', () => {
      // Add more logs
      store.add({
        id: 'log_2',
        timestamp: '2025-01-01T00:01:00.000Z',
        level: 'error',
        service: 'database',
        event: 'db.error',
        message: 'Database error',
        metadata: {},
      });

      const json = store.exportJSON({ level: 'error' });
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].level).toBe('error');
    });

    it('should handle CSV special characters', () => {
      store.clear();
      store.add({
        id: 'log_1',
        timestamp: '2025-01-01T00:00:00.000Z',
        level: 'info',
        service: 'api',
        event: 'test.event',
        message: 'Message with "quotes" and, commas',
        metadata: {},
      });

      const csv = store.exportCSV();
      expect(csv).toContain('"Message with ""quotes"" and, commas"');
    });
  });
});
