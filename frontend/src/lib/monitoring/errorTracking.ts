/**
 * Error Tracking and Logging System
 *
 * Comprehensive error tracking with structured logging, error classification,
 * and automatic alerting for critical issues.
 */

import { performanceMonitor } from '@/lib/performance/performanceMonitor';

interface ErrorContext {
  userId?: string;
  blueprintId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  component?: string;
  action?: string;
  [key: string]: any;
}

interface ErrorSeverity {
  level: 'low' | 'medium' | 'high' | 'critical';
  shouldAlert: boolean;
  alertThreshold?: number;
}

interface ErrorEvent {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: ErrorSeverity;
  category: 'api' | 'database' | 'ui' | 'auth' | 'payment' | 'ai' | 'system' | 'network';
  fingerprint: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  resolved: boolean;
  tags: string[];
}

interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByHour: Record<number, number>;
  topErrors: Array<{
    message: string;
    count: number;
    category: string;
    severity: string;
  }>;
  resolutionRate: number;
  alertTriggered: boolean;
}

class ErrorTracker {
  private errors: Map<string, ErrorEvent> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private alertThresholds: Map<string, { count: number; timeWindow: number; lastAlert: number }> =
    new Map();
  private maxErrors = 10000;
  private retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Track an error event
   */
  trackError(
    error: Error | string,
    context: ErrorContext = {},
    category: ErrorEvent['category'] = 'system'
  ): string {
    const errorId = this.generateErrorId(error, context);
    const now = Date.now();
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    // Determine severity based on error type and context
    const severity = this.determineSeverity(error, context, category);

    // Generate fingerprint for grouping similar errors
    const fingerprint = this.generateFingerprint(message, stack, category);

    // Check if this is a recurring error
    const existingError = this.errors.get(errorId);

    if (existingError) {
      // Update existing error
      existingError.count++;
      existingError.lastSeen = now;
      existingError.context = { ...existingError.context, ...context };

      // Check if we should trigger an alert
      this.checkAlertThresholds(existingError);

      return existingError.id;
    }

    // Create new error event
    const errorEvent: ErrorEvent = {
      id: errorId,
      timestamp: now,
      message,
      stack,
      context: {
        ...context,
        userAgent:
          context.userAgent ||
          (typeof window !== 'undefined' ? window.navigator.userAgent : 'server'),
        url: context.url || (typeof window !== 'undefined' ? window.location.href : 'server'),
        timestamp: new Date().toISOString(),
      },
      severity,
      category,
      fingerprint,
      count: 1,
      firstSeen: now,
      lastSeen: now,
      resolved: false,
      tags: this.generateTags(error, context, category),
    };

    this.errors.set(errorId, errorEvent);

    // Log the error
    this.logError(errorEvent);

    // Check alert thresholds
    this.checkAlertThresholds(errorEvent);

    // Clean up old errors
    this.cleanupOldErrors();

    // Track in performance monitor
    performanceMonitor.recordMetric({
      name: 'error_occurred',
      startTime: now,
      endTime: now,
      duration: 0,
      success: false,
      metadata: {
        errorId,
        category,
        severity: severity.level,
        message,
        fingerprint,
      },
      tags: {
        type: 'error',
        category,
        severity: severity.level,
      },
    });

    return errorId;
  }

  /**
   * Track API error
   */
  trackApiError(
    error: Error | string,
    context: ErrorContext & { endpoint?: string; statusCode?: number }
  ): string {
    return this.trackError(error, context, 'api');
  }

  /**
   * Track database error
   */
  trackDatabaseError(
    error: Error | string,
    context: ErrorContext & { query?: string; table?: string }
  ): string {
    return this.trackError(error, context, 'database');
  }

  /**
   * Track UI error
   */
  trackUIError(
    error: Error | string,
    context: ErrorContext & { component?: string; action?: string }
  ): string {
    return this.trackError(error, context, 'ui');
  }

  /**
   * Track authentication error
   */
  trackAuthError(
    error: Error | string,
    context: ErrorContext & { authMethod?: string; provider?: string }
  ): string {
    return this.trackError(error, context, 'auth');
  }

  /**
   * Track payment error
   */
  trackPaymentError(
    error: Error | string,
    context: ErrorContext & { paymentMethod?: string; transactionId?: string }
  ): string {
    return this.trackError(error, context, 'payment');
  }

  /**
   * Track AI service error
   */
  trackAIError(
    error: Error | string,
    context: ErrorContext & { model?: string; prompt?: string; service?: string }
  ): string {
    return this.trackError(error, context, 'ai');
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    const now = Date.now();
    const errors = Array.from(this.errors.values());

    // Count errors by category
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByHour: Record<number, number> = {};

    errors.forEach((error) => {
      // Category counting
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;

      // Severity counting
      errorsBySeverity[error.severity.level] = (errorsBySeverity[error.severity.level] || 0) + 1;

      // Hourly counting (last 24 hours)
      const hour = Math.floor((now - error.timestamp) / (60 * 60 * 1000));
      if (hour < 24) {
        errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
      }
    });

    // Top errors by count
    const topErrors = errors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((error) => ({
        message: error.message,
        count: error.count,
        category: error.category,
        severity: error.severity.level,
      }));

    // Resolution rate
    const resolvedErrors = errors.filter((error) => error.resolved).length;
    const resolutionRate = errors.length > 0 ? (resolvedErrors / errors.length) * 100 : 0;

    // Check if any alerts have been triggered
    const alertTriggered = Array.from(this.alertThresholds.values()).some(
      (threshold) => now - threshold.lastAlert < threshold.timeWindow
    );

    return {
      totalErrors: errors.length,
      errorsByCategory,
      errorsBySeverity,
      errorsByHour,
      topErrors,
      resolutionRate,
      alertTriggered,
    };
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category?: ErrorEvent['category'], limit = 50): ErrorEvent[] {
    const errors = Array.from(this.errors.values());

    if (category) {
      return errors
        .filter((error) => error.category === category)
        .sort((a, b) => b.lastSeen - a.lastSeen)
        .slice(0, limit);
    }

    return errors.sort((a, b) => b.lastSeen - a.lastSeen).slice(0, limit);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(limit = 50): ErrorEvent[] {
    return Array.from(this.errors.values())
      .filter((error) => !error.resolved)
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, limit);
  }

  /**
   * Resolve an error
   */
  resolveError(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.lastSeen = Date.now();
      this.logInfo(`Error resolved: ${error.message}`, { errorId });
      return true;
    }
    return false;
  }

  /**
   * Bulk resolve errors by fingerprint
   */
  resolveErrorsByFingerprint(fingerprint: string): number {
    let resolved = 0;
    for (const error of this.errors.values()) {
      if (error.fingerprint === fingerprint && !error.resolved) {
        error.resolved = true;
        error.lastSeen = Date.now();
        resolved++;
      }
    }

    this.logInfo(`Resolved ${resolved} errors with fingerprint: ${fingerprint}`);
    return resolved;
  }

  /**
   * Clear old errors
   */
  clearOldErrors(): void {
    const now = Date.now();
    const cutoff = now - this.retentionPeriod;

    for (const [id, error] of this.errors.entries()) {
      if (error.lastSeen < cutoff) {
        this.errors.delete(id);
      }
    }
  }

  /**
   * Export errors for external analysis
   */
  exportErrors(format: 'json' | 'csv' = 'json'): string {
    const errors = Array.from(this.errors.values());

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'message', 'category', 'severity', 'count', 'resolved'];
      const rows = errors.map((error) => [
        error.id,
        new Date(error.timestamp).toISOString(),
        error.message,
        error.category,
        error.severity.level,
        error.count,
        error.resolved,
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        totalErrors: errors.length,
        errors: errors.map((error) => ({
          ...error,
          // Remove potentially sensitive context for export
          context: {
            userId: error.context.userId ? '[REDACTED]' : undefined,
            sessionId: error.context.sessionId ? '[REDACTED]' : undefined,
            ...Object.fromEntries(
              Object.entries(error.context).filter(
                ([key]) => !['userId', 'sessionId'].includes(key)
              )
            ),
          },
        })),
      },
      null,
      2
    );
  }

  // Private helper methods

  private generateErrorId(error: Error | string, context: ErrorContext): string {
    const message = typeof error === 'string' ? error : error.message;
    const hash = this.simpleHash(message + JSON.stringify(context));
    return `error_${hash}_${Date.now()}`;
  }

  private generateFingerprint(message: string, stack?: string, category?: string): string {
    // Create a fingerprint for grouping similar errors
    const fingerprintData = [
      message,
      category,
      stack ? stack.split('\n')[0] : '', // First line of stack
    ].join('|');

    return this.simpleHash(fingerprintData);
  }

  private determineSeverity(
    error: Error | string,
    context: ErrorContext,
    category: ErrorEvent['category']
  ): ErrorSeverity {
    const message = typeof error === 'string' ? error : error.message;

    // Critical errors that should always alert
    if (category === 'payment' || category === 'auth') {
      return { level: 'high' as const, shouldAlert: true };
    }

    if (category === 'database' && message.includes('connection')) {
      return { level: 'critical' as const, shouldAlert: true };
    }

    // High severity errors
    if (context.statusCode && context.statusCode >= 500) {
      return { level: 'high' as const, shouldAlert: true };
    }

    if (message.includes('timeout') || message.includes('memory')) {
      return { level: 'high' as const, shouldAlert: true };
    }

    // Medium severity errors
    if (context.statusCode && context.statusCode >= 400) {
      return { level: 'medium' as const, shouldAlert: false, alertThreshold: 10 };
    }

    // Default to low severity
    return { level: 'low' as const, shouldAlert: false, alertThreshold: 50 };
  }

  private generateTags(
    error: Error | string,
    context: ErrorContext,
    category: ErrorEvent['category']
  ): string[] {
    const tags = [category];

    const message = typeof error === 'string' ? error : error.message;

    // Add tags based on error content
    if (message.includes('timeout')) tags.push('timeout');
    if (message.includes('network')) tags.push('network');
    if (message.includes('validation')) tags.push('validation');
    if (message.includes('permission')) tags.push('permission');
    if (message.includes('not found')) tags.push('not-found');

    // Add context-based tags
    if (context.component) tags.push(`component:${context.component}`);
    if (context.action) tags.push(`action:${context.action}`);
    if (context.method) tags.push(`method:${context.method}`);

    return tags;
  }

  private checkAlertThresholds(error: ErrorEvent): void {
    const { fingerprint, severity, count } = error;
    const now = Date.now();

    // Get or create threshold tracking
    let threshold = this.alertThresholds.get(fingerprint);
    if (!threshold) {
      threshold = {
        count: 0,
        timeWindow: severity.shouldAlert ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 min for alerts, 1 hour for non-alerts
        lastAlert: 0,
      };
      this.alertThresholds.set(fingerprint, threshold);
    }

    threshold.count++;

    // Check if we should trigger an alert
    const shouldAlert =
      severity.shouldAlert ||
      (severity.alertThreshold && threshold.count >= severity.alertThreshold);

    if (shouldAlert && now - threshold.lastAlert > threshold.timeWindow) {
      this.triggerAlert(error);
      threshold.lastAlert = now;
      threshold.count = 0; // Reset count after alert
    }
  }

  private triggerAlert(error: ErrorEvent): void {
    // Log alert
    this.logError(error, true);

    // In a real implementation, this would send to alerting service
    // like PagerDuty, Slack, email, etc.
    console.error('🚨 ERROR ALERT TRIGGERED:', {
      id: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity.level,
      count: error.count,
      timestamp: new Date(error.timestamp).toISOString(),
    });
  }

  private logError(error: ErrorEvent, isAlert = false): void {
    const logLevel = isAlert
      ? 'error'
      : error.severity.level === 'critical'
        ? 'error'
        : error.severity.level === 'high'
          ? 'error'
          : error.severity.level === 'medium'
            ? 'warn'
            : 'info';

    const logData = {
      id: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity.level,
      count: error.count,
      timestamp: new Date(error.timestamp).toISOString(),
      context: error.context,
      fingerprint: error.fingerprint,
    };

    if (logLevel === 'error') {
      console.error(logLevel.toUpperCase(), logData);
    } else if (logLevel === 'warn') {
      console.warn(logLevel.toUpperCase(), logData);
    } else {
      console.log(logLevel.toUpperCase(), logData);
    }
  }

  private logInfo(message: string, data: any = {}): void {
    console.log('INFO', { message, timestamp: new Date().toISOString(), ...data });
  }

  private cleanupOldErrors(): void {
    const now = Date.now();
    const cutoff = now - this.retentionPeriod;

    for (const [id, error] of this.errors.entries()) {
      if (error.lastSeen < cutoff) {
        this.errors.delete(id);
      }
    }

    // Also clean up old alert thresholds
    for (const [fingerprint, threshold] of this.alertThresholds.entries()) {
      if (now - threshold.lastAlert > 24 * 60 * 60 * 1000) {
        // 24 hours
        this.alertThresholds.delete(fingerprint);
      }
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Utility functions for common error tracking scenarios
export function trackError(error: Error | string, context?: ErrorContext): string {
  return errorTracker.trackError(error, context);
}

export function trackApiError(
  error: Error | string,
  context: ErrorContext & { endpoint?: string; statusCode?: number }
): string {
  return errorTracker.trackApiError(error, context);
}

export function trackDatabaseError(
  error: Error | string,
  context: ErrorContext & { query?: string; table?: string }
): string {
  return errorTracker.trackDatabaseError(error, context);
}

export function trackUIError(
  error: Error | string,
  context: ErrorContext & { component?: string; action?: string }
): string {
  return errorTracker.trackUIError(error, context);
}

export function trackAuthError(
  error: Error | string,
  context: ErrorContext & { authMethod?: string; provider?: string }
): string {
  return errorTracker.trackAuthError(error, context);
}

export function trackPaymentError(
  error: Error | string,
  context: ErrorContext & { paymentMethod?: string; transactionId?: string }
): string {
  return errorTracker.trackPaymentError(error, context);
}

export function trackAIError(
  error: Error | string,
  context: ErrorContext & { model?: string; prompt?: string; service?: string }
): string {
  return errorTracker.trackAIError(error, context);
}

export default errorTracker;
