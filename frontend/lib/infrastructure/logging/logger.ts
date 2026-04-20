/**
 * Structured Logger Service
 * Provides comprehensive logging for the Perplexity Dynamic Questionnaire System
 */

import {
  LogEntry,
  LogLevel,
  LogService,
  LogEvent,
  LogMetadata,
  SENSITIVE_FIELDS,
  LOG_LEVEL_PRIORITY,
} from './types';
import { LogStore } from './logStore';

class Logger {
  private store: LogStore;
  private minLevel: LogLevel;
  private service: LogService = 'system';
  private isClient: boolean;

  constructor() {
    this.store = new LogStore();
    this.minLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * Set the service context for this logger instance
   */
  setService(service: LogService): void {
    this.service = service;
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Scrub sensitive data from metadata
   */
  private scrubSensitiveData(data: LogMetadata): LogMetadata {
    const scrubbed = { ...data };

    const scrubObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(scrubObject);
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_FIELDS.some((field) =>
          lowerKey.includes(field.field.toLowerCase())
        );

        if (isSensitive) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = scrubObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return scrubObject(scrubbed);
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    event: LogEvent,
    message: string,
    metadata: LogMetadata = {}
  ): LogEntry | null {
    if (!this.shouldLog(level)) {
      return null; // Don't log below threshold
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      event,
      message,
      metadata: this.scrubSensitiveData(metadata),
    };

    // Store the log entry
    this.store.add(entry);

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](
        `[${level.toUpperCase()}] [${this.service}] ${event}:`,
        message,
        metadata
      );
    }

    return entry;
  }

  /**
   * Debug level logging
   */
  debug(event: LogEvent, message: string, metadata: LogMetadata = {}): LogEntry | null {
    return this.log('debug', event, message, metadata);
  }

  /**
   * Info level logging
   */
  info(event: LogEvent, message: string, metadata: LogMetadata = {}): LogEntry | null {
    return this.log('info', event, message, metadata);
  }

  /**
   * Warning level logging
   */
  warn(event: LogEvent, message: string, metadata: LogMetadata = {}): LogEntry | null {
    return this.log('warn', event, message, metadata);
  }

  /**
   * Error level logging
   */
  error(event: LogEvent, message: string, metadata: LogMetadata = {}): LogEntry | null {
    // Automatically capture error stack if metadata contains error
    if (metadata.error && metadata.error instanceof Error) {
      metadata.errorStack = metadata.error.stack;
      metadata.error = metadata.error.message;
    }

    return this.log('error', event, message, metadata);
  }

  /**
   * Create a timing helper for measuring operation duration
   */
  startTimer(event: LogEvent, message: string, metadata: LogMetadata = {}): () => void {
    const startTime = Date.now();

    this.debug(`${event}.start` as LogEvent, `${message} - Started`, metadata);

    return () => {
      const duration = Date.now() - startTime;
      this.info(`${event}.complete` as LogEvent, `${message} - Completed in ${duration}ms`, {
        ...metadata,
        duration,
      });
    };
  }

  /**
   * Log with automatic error handling
   */
  async withLogging<T>(
    event: LogEvent,
    message: string,
    fn: () => Promise<T>,
    metadata: LogMetadata = {}
  ): Promise<T> {
    const endTimer = this.startTimer(event, message, metadata);

    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      this.error(`${event}.error` as LogEvent, `${message} - Failed`, {
        ...metadata,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Get the log store instance
   */
  getStore(): LogStore {
    return this.store;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.store.clear();
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(service?: LogService): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }

  if (service) {
    loggerInstance.setService(service);
  }

  return loggerInstance;
}

export const logger = getLogger();
