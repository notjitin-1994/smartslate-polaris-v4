/**
 * Razorpay Webhook Logging Service
 *
 * @description Comprehensive structured logging and error handling for webhook processing
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This service provides structured logging for all webhook processing events,
 * including security events, processing metrics, errors, and performance data.
 *
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

import type { ParsedWebhookEvent } from '../razorpay/webhookSecurity';
import type { WebhookEventRecord } from '../razorpay/idempotency';
import type { EventHandlerResult } from '../razorpay/eventRouter';
import type { WebhookProcessingState } from '../razorpay/webhookStateManagement';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Log severity levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Webhook log entry structure
 */
export interface WebhookLogEntry {
  timestamp: string;
  level: LogLevel;
  category: 'security' | 'processing' | 'performance' | 'error' | 'business' | 'audit';
  eventId?: string;
  eventType?: string;
  accountId?: string;
  userId?: string;
  paymentId?: string;
  subscriptionId?: string;
  requestId?: string;
  message: string;
  details?: Record<string, any>;
  error?: {
    code?: string;
    message: string;
    stack?: string;
    context?: Record<string, any>;
  };
  metrics?: {
    duration?: number;
    processingTime?: number;
    memoryUsage?: number;
    retryCount?: number;
  };
  source: {
    service: string;
    version: string;
    environment: string;
    hostname?: string;
  };
  correlationId?: string;
  tags?: string[];
}

/**
 * Log aggregation statistics
 */
export interface LogStatistics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<string, number>;
  errorRate: number;
  averageProcessingTime: number;
  recentErrors: WebhookLogEntry[];
  timeRange: {
    start: string;
    end: string;
  };
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: LogLevel;
  enableConsoleOutput: boolean;
  enableStructuredOutput: boolean;
  enableMetrics: boolean;
  enableAuditTrail: boolean;
  enablePerformanceTracking: boolean;
  enableErrorAggregation: boolean;
  maxLogEntries: number;
  retentionDays: number;
  excludeSensitiveData: boolean;
  sensitiveFields: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: 'info',
  enableConsoleOutput: true,
  enableStructuredOutput: true,
  enableMetrics: true,
  enableAuditTrail: true,
  enablePerformanceTracking: true,
  enableErrorAggregation: true,
  maxLogEntries: 10000,
  retentionDays: 30,
  excludeSensitiveData: true,
  sensitiveFields: ['razorpay_signature', 'webhook_secret', 'api_key', 'payment_id', 'customer_id'],
};

// ============================================================================
// Webhook Logging Service
// ============================================================================

/**
 * Webhook logging service
 */
export class WebhookLoggingService {
  private config: LoggingConfig;
  private logBuffer: WebhookLogEntry[] = [];
  private errorCounts = new Map<string, number>();
  private performanceMetrics = new Map<string, number[]>();

  constructor(config: LoggingConfig = DEFAULT_LOGGING_CONFIG) {
    this.config = config;
  }

  /**
   * Log webhook receipt and validation
   */
  logWebhookReceived(context: {
    eventId: string;
    eventType: string;
    accountId: string;
    requestId: string;
    signatureValid: boolean;
    processingTime: number;
    request?: Request;
  }): void {
    this.createLog({
      level: context.signatureValid ? 'info' : 'warn',
      category: 'security',
      message: context.signatureValid
        ? 'Webhook received and validated'
        : 'Webhook signature validation failed',
      eventId: context.eventId,
      eventType: context.eventType,
      accountId: context.accountId,
      requestId: context.requestId,
      details: {
        signatureValid: context.signatureValid,
        userAgent: context.request?.headers.get('user-agent'),
        ip: this.extractIP(context.request),
      },
      metrics: {
        processingTime: context.processingTime,
      },
      tags: ['webhook', 'validation'],
    });
  }

  /**
   * Log event processing start
   */
  logProcessingStarted(context: {
    eventId: string;
    eventType: string;
    userId?: string;
    subscriptionId?: string;
    paymentId?: string;
    requestId: string;
  }): void {
    this.createLog({
      level: 'info',
      category: 'processing',
      message: `Started processing ${context.eventType}`,
      eventId: context.eventId,
      eventType: context.eventType,
      userId: context.userId,
      subscriptionId: context.subscriptionId,
      paymentId: context.paymentId,
      requestId: context.requestId,
      details: {
        processingPhase: 'started',
      },
      tags: ['processing', 'started'],
    });
  }

  /**
   * Log successful event processing
   */
  logProcessingCompleted(context: {
    eventId: string;
    eventType: string;
    userId?: string;
    subscriptionId?: string;
    paymentId?: string;
    requestId: string;
    handlerResult: EventHandlerResult;
    totalProcessingTime: number;
    state?: WebhookProcessingState;
  }): void {
    this.createLog({
      level: 'info',
      category: 'processing',
      message: `Successfully processed ${context.eventType}`,
      eventId: context.eventId,
      eventType: context.eventType,
      userId: context.userId,
      subscriptionId: context.subscriptionId,
      paymentId: context.paymentId,
      requestId: context.requestId,
      details: {
        handlerSuccess: context.handlerResult.success,
        processed: context.handlerResult.processed,
        handlerDetails: context.handlerResult.details,
      },
      metrics: {
        processingTime: context.totalProcessingTime,
        retryCount: context.state?.retryCount,
      },
      tags: ['processing', 'completed', 'success'],
    });

    // Track performance metrics
    if (this.config.enablePerformanceTracking) {
      this.trackPerformance(context.eventType, context.totalProcessingTime);
    }
  }

  /**
   * Log processing failures
   */
  logProcessingFailed(context: {
    eventId: string;
    eventType: string;
    userId?: string;
    subscriptionId?: string;
    paymentId?: string;
    requestId: string;
    error: string;
    errorCode?: string;
    retryable: boolean;
    totalProcessingTime: number;
    state?: WebhookProcessingState;
    originalError?: Error;
  }): void {
    this.createLog({
      level: 'error',
      category: 'error',
      message: `Failed to process ${context.eventType}: ${context.error}`,
      eventId: context.eventId,
      eventType: context.eventType,
      userId: context.userId,
      subscriptionId: context.subscriptionId,
      paymentId: context.paymentId,
      requestId: context.requestId,
      details: {
        retryable: context.retryable,
        errorCode: context.errorCode,
        retryCount: context.state?.retryCount,
        maxRetries: context.state?.maxRetries,
      },
      error: {
        code: context.errorCode,
        message: context.error,
        stack: context.originalError?.stack,
        context: {
          eventId: context.eventId,
          eventType: context.eventType,
          processingTime: context.totalProcessingTime,
        },
      },
      metrics: {
        processingTime: context.totalProcessingTime,
      },
      tags: ['processing', 'failed', 'error'],
    });

    // Track error aggregation
    if (this.config.enableErrorAggregation) {
      this.trackError(context.errorCode || context.error);
    }
  }

  /**
   * Log signature verification attempts
   */
  logSignatureVerification(context: {
    eventId: string;
    eventType: string;
    accountId: string;
    requestId: string;
    success: boolean;
    expectedSignature?: string;
    receivedSignature?: string;
    processingTime: number;
  }): void {
    this.createLog({
      level: context.success ? 'info' : 'warn',
      category: 'security',
      message: `Signature verification ${context.success ? 'succeeded' : 'failed'}`,
      eventId: context.eventId,
      eventType: context.eventType,
      accountId: context.accountId,
      requestId: context.requestId,
      details: {
        verificationSuccess: context.success,
        signatureLength: context.receivedSignature?.length,
        timestamp: new Date().toISOString(),
      },
      error: context.success
        ? undefined
        : {
            code: 'SIGNATURE_VERIFICATION_FAILED',
            message: 'Webhook signature verification failed',
            context: {
              expectedSignaturePrefix: context.expectedSignature?.substring(0, 8),
              receivedSignaturePrefix: context.receivedSignature?.substring(0, 8),
            },
          },
      metrics: {
        processingTime: context.processingTime,
      },
      tags: ['security', 'signature', context.success ? 'success' : 'failure'],
    });
  }

  /**
   * Log idempotency checks
   */
  logIdempotencyCheck(context: {
    eventId: string;
    eventType: string;
    requestId: string;
    isDuplicate: boolean;
    existingRecord?: WebhookEventRecord;
    processingTime: number;
  }): void {
    this.createLog({
      level: context.isDuplicate ? 'info' : 'debug',
      category: 'processing',
      message: `Idempotency check - ${context.isDuplicate ? 'duplicate event detected' : 'new event'}`,
      eventId: context.eventId,
      eventType: context.eventType,
      requestId: context.requestId,
      details: {
        isDuplicate: context.isDuplicate,
        existingStatus: context.existingRecord?.processingStatus,
        existingProcessedAt: context.existingRecord?.processedAt,
      },
      metrics: {
        processingTime: context.processingTime,
      },
      tags: ['processing', 'idempotency', context.isDuplicate ? 'duplicate' : 'new'],
    });
  }

  /**
   * Log business events
   */
  logBusinessEvent(context: {
    eventId: string;
    eventType: string;
    userId?: string;
    subscriptionId?: string;
    paymentId?: string;
    requestId: string;
    action: string;
    details?: Record<string, any>;
    value?: number; // For monetary events
  }): void {
    this.createLog({
      level: 'info',
      category: 'business',
      message: `Business event: ${context.action}`,
      eventId: context.eventId,
      eventType: context.eventType,
      userId: context.userId,
      subscriptionId: context.subscriptionId,
      paymentId: context.paymentId,
      requestId: context.requestId,
      details: {
        action: context.action,
        ...context.details,
      },
      metrics: context.value
        ? {
            value: context.value,
          }
        : undefined,
      tags: ['business', context.action],
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics(context: {
    eventId: string;
    eventType: string;
    requestId: string;
    metrics: Record<string, number>;
    operation?: string;
  }): void {
    this.createLog({
      level: 'debug',
      category: 'performance',
      message: `Performance metrics for ${context.eventType}`,
      eventId: context.eventId,
      eventType: context.eventType,
      requestId: context.requestId,
      details: {
        operation: context.operation || 'webhook_processing',
      },
      metrics: context.metrics,
      tags: ['performance', 'metrics'],
    });
  }

  /**
   * Create a log entry
   */
  private createLog(entry: Omit<WebhookLogEntry, 'timestamp' | 'source'>): void {
    // Check log level
    if (!this.shouldLog(entry.level)) {
      return;
    }

    let logEntry: WebhookLogEntry = {
      timestamp: new Date().toISOString(),
      source: {
        service: 'razorpay-webhook-handler',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        hostname: process.env.HOSTNAME,
      },
      correlationId: this.generateCorrelationId(),
      ...entry,
    };

    // Filter sensitive data
    if (this.config.excludeSensitiveData) {
      logEntry = this.filterSensitiveData(logEntry);
    }

    // Add to buffer
    this.addToBuffer(logEntry);

    // Output to console if enabled
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }

    // Output structured if enabled
    if (this.config.enableStructuredOutput) {
      this.outputStructured(logEntry);
    }
  }

  /**
   * Check if log level should be recorded
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= configLevelIndex;
  }

  /**
   * Filter sensitive data from log entries
   */
  private filterSensitiveData(entry: WebhookLogEntry): WebhookLogEntry {
    const filtered = { ...entry };

    const filterObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      const filtered: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (
          this.config.sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase())
          )
        ) {
          filtered[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          filtered[key] = filterObject(value);
        } else {
          filtered[key] = value;
        }
      }
      return filtered;
    };

    if (filtered.details) {
      filtered.details = filterObject(filtered.details);
    }

    if (filtered.error?.context) {
      filtered.error.context = filterObject(filtered.error.context);
    }

    return filtered;
  }

  /**
   * Add log entry to buffer
   */
  private addToBuffer(entry: WebhookLogEntry): void {
    this.logBuffer.push(entry);

    // Maintain buffer size
    if (this.logBuffer.length > this.config.maxLogEntries) {
      this.logBuffer.shift();
    }
  }

  /**
   * Output to console
   */
  private outputToConsole(entry: WebhookLogEntry): void {
    const { timestamp, level, category, message, ...rest } = entry;

    const logMessage = `[${timestamp}] ${level.toUpperCase()} [${category}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, rest);
        break;
      case 'info':
        console.info(logMessage, rest);
        break;
      case 'warn':
        console.warn(logMessage, rest);
        break;
      case 'error':
      case 'fatal':
        console.error(logMessage, rest);
        break;
    }
  }

  /**
   * Output structured log
   */
  private outputStructured(entry: WebhookLogEntry): void {
    // In a production environment, this would send to a log aggregation service
    // like Elasticsearch, Splunk, DataDog, etc.
    console.log(JSON.stringify(entry));
  }

  /**
   * Extract IP from request
   */
  private extractIP(request?: Request): string | undefined {
    if (!request) return undefined;

    return (
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    );
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Track performance metrics
   */
  private trackPerformance(eventType: string, processingTime: number): void {
    if (!this.performanceMetrics.has(eventType)) {
      this.performanceMetrics.set(eventType, []);
    }

    const times = this.performanceMetrics.get(eventType)!;
    times.push(processingTime);

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
  }

  /**
   * Track error occurrences
   */
  private trackError(errorKey: string): void {
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
  }

  /**
   * Get logging statistics
   */
  getStatistics(): LogStatistics {
    const logsByLevel = this.logBuffer.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      {} as Record<LogLevel, number>
    );

    const logsByCategory = this.logBuffer.reduce(
      (acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalLogs = this.logBuffer.length;
    const errorLogs = logsByLevel.error || 0 + logsByLevel.fatal || 0;
    const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;

    // Calculate average processing time
    const processingTimes = this.logBuffer
      .filter((log) => log.metrics?.processingTime)
      .map((log) => log.metrics!.processingTime!);

    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

    // Get recent errors
    const recentErrors = this.logBuffer.filter((log) => log.category === 'error').slice(-10);

    return {
      totalLogs,
      logsByLevel,
      logsByCategory,
      errorRate,
      averageProcessingTime,
      recentErrors,
      timeRange: {
        start: this.logBuffer[0]?.timestamp || new Date().toISOString(),
        end: this.logBuffer[this.logBuffer.length - 1]?.timestamp || new Date().toISOString(),
      },
    };
  }

  /**
   * Get top errors
   */
  getTopErrors(limit: number = 10): Array<{ error: string; count: number }> {
    return Array.from(this.errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<
    string,
    {
      average: number;
      min: number;
      max: number;
      count: number;
    }
  > {
    const metrics: Record<string, any> = {};

    for (const [eventType, times] of this.performanceMetrics.entries()) {
      if (times.length > 0) {
        metrics[eventType] = {
          average: times.reduce((sum, time) => sum + time, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length,
        };
      }
    }

    return metrics;
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logBuffer = [];
    this.errorCounts.clear();
    this.performanceMetrics.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): LoggingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<LoggingConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a configured webhook logging service
 *
 * @param config - Optional logging configuration
 * @returns Configured logging service
 *
 * @example
 * const logger = createWebhookLogger({
 *   level: 'debug',
 *   enableConsoleOutput: true,
 *   enableMetrics: true
 * });
 */
export function createWebhookLogger(config?: Partial<LoggingConfig>): WebhookLoggingService {
  const finalConfig = { ...DEFAULT_LOGGING_CONFIG, ...config };
  return new WebhookLoggingService(finalConfig);
}

// ============================================================================
// Default Export
// ============================================================================

// Remove module-level instantiation to avoid cookies context error
// export const webhookLogger = createWebhookLogger();
