/**
 * Log Storage and Query Engine
 * Manages in-memory log storage with querying and filtering capabilities
 */

import { LogEntry, LogQuery, LogStats, LogLevel, LogService } from './types';

const MAX_LOGS = 10000; // Maximum logs to keep in memory
const CLEANUP_THRESHOLD = 12000; // Cleanup when exceeding this

export class LogStore {
  private logs: LogEntry[] = [];
  private maxLogs: number;

  constructor(maxLogs: number = MAX_LOGS) {
    this.maxLogs = maxLogs;
  }

  /**
   * Add a log entry
   */
  add(entry: LogEntry): void {
    this.logs.push(entry);

    // Cleanup old logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Get all logs
   */
  getAll(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Query logs with filters
   */
  query(query: LogQuery = {}): LogEntry[] {
    let results = [...this.logs];

    // Filter by level
    if (query.level) {
      const levels = Array.isArray(query.level) ? query.level : [query.level];
      results = results.filter((log) => levels.includes(log.level));
    }

    // Filter by service
    if (query.service) {
      const services = Array.isArray(query.service) ? query.service : [query.service];
      results = results.filter((log) => services.includes(log.service));
    }

    // Filter by event
    if (query.event) {
      const events = Array.isArray(query.event) ? query.event : [query.event];
      results = results.filter((log) => events.includes(log.event as any));
    }

    // Filter by userId
    if (query.userId) {
      results = results.filter((log) => log.metadata.userId === query.userId);
    }

    // Filter by blueprintId
    if (query.blueprintId) {
      results = results.filter((log) => log.metadata.blueprintId === query.blueprintId);
    }

    // Filter by time range
    if (query.from) {
      const fromDate = new Date(query.from);
      results = results.filter((log) => new Date(log.timestamp) >= fromDate);
    }

    if (query.to) {
      const toDate = new Date(query.to);
      results = results.filter((log) => new Date(log.timestamp) <= toDate);
    }

    // Search in message or metadata
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter((log) => {
        const messageMatch = log.message.toLowerCase().includes(searchLower);
        const metadataMatch = JSON.stringify(log.metadata).toLowerCase().includes(searchLower);
        return messageMatch || metadataMatch;
      });
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit and offset
    const offset = query.offset || 0;
    const limit = query.limit || results.length;
    results = results.slice(offset, offset + limit);

    return results;
  }

  /**
   * Get log statistics
   */
  getStats(query: LogQuery = {}): LogStats {
    const logs = this.query(query);

    const stats: LogStats = {
      total: logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
      },
      byService: {
        perplexity: 0,
        ollama: 0,
        'dynamic-questions': 0,
        database: 0,
        auth: 0,
        validation: 0,
        api: 0,
        ui: 0,
        system: 0,
      },
      errorRate: 0,
      avgDuration: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      // Count by level
      stats.byLevel[log.level]++;

      // Count by service
      stats.byService[log.service]++;

      // Calculate average duration
      if (log.metadata.duration !== undefined) {
        totalDuration += log.metadata.duration;
        durationCount++;
      }
    }

    // Calculate error rate
    stats.errorRate = logs.length > 0 ? (stats.byLevel.error / logs.length) * 100 : 0;

    // Calculate average duration
    stats.avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    return stats;
  }

  /**
   * Get logs by ID
   */
  getById(id: string): LogEntry | undefined {
    return this.logs.find((log) => log.id === id);
  }

  /**
   * Get recent logs
   */
  getRecent(count: number = 100): LogEntry[] {
    return this.logs.slice(-count).reverse();
  }

  /**
   * Get logs by time range
   */
  getByTimeRange(from: Date, to: Date): LogEntry[] {
    return this.logs.filter((log) => {
      const timestamp = new Date(log.timestamp);
      return timestamp >= from && timestamp <= to;
    });
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get count of logs
   */
  count(): number {
    return this.logs.length;
  }

  /**
   * Export logs as JSON
   */
  exportJSON(query: LogQuery = {}): string {
    const logs = this.query(query);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportCSV(query: LogQuery = {}): string {
    const logs = this.query(query);

    if (logs.length === 0) {
      return '';
    }

    // CSV headers
    const headers = [
      'ID',
      'Timestamp',
      'Level',
      'Service',
      'Event',
      'Message',
      'Duration (ms)',
      'User ID',
      'Blueprint ID',
      'Error',
    ];

    // CSV rows
    const rows = logs.map((log) => [
      log.id,
      log.timestamp,
      log.level,
      log.service,
      log.event,
      `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
      log.metadata.duration || '',
      log.metadata.userId || '',
      log.metadata.blueprintId || '',
      log.metadata.error ? `"${String(log.metadata.error).replace(/"/g, '""')}"` : '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  /**
   * Export logs as plain text
   */
  exportText(query: LogQuery = {}): string {
    const logs = this.query(query);

    return logs
      .map((log) => {
        const meta = log.metadata.duration ? ` (${log.metadata.duration}ms)` : '';
        return `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.service}] ${log.event}: ${log.message}${meta}`;
      })
      .join('\n');
  }
}
