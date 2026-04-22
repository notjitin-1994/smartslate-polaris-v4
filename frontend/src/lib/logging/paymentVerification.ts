/**
 * Payment Verification Logging
 *
 * @description Structured logging for payment verification attempts and outcomes
 * @version 1.0.0
 * @date 2025-10-29
 *
 * **SECURITY NOTE**: This logging system is designed to capture security-relevant
 * events while avoiding the exposure of sensitive payment data.
 *
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Payment verification log levels
 */
export type PaymentVerificationLogLevel = 'info' | 'warn' | 'error' | 'security';

/**
 * Payment verification event types
 */
export type PaymentVerificationEventType =
  | 'verification_attempt'
  | 'verification_success'
  | 'verification_failed'
  | 'signature_invalid'
  | 'signature_mismatch'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'subscription_not_found'
  | 'payment_not_found'
  | 'database_error'
  | 'internal_error';

/**
 * Structured payment verification log entry
 */
export interface PaymentVerificationLog {
  timestamp: string;
  level: PaymentVerificationLogLevel;
  event: PaymentVerificationEventType;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  paymentId?: string; // Sanitized: only last 4 characters
  subscriptionId?: string; // Sanitized: only last 4 characters
  signatureLength?: number;
  error?: string;
  errorCode?: string;
  duration?: number; // Verification duration in milliseconds
  metadata?: Record<string, any>;
  security?: {
    threatLevel: 'low' | 'medium' | 'high';
    indicators?: string[];
    details?: Record<string, any>;
  };
}

/**
 * Payment verification metrics
 */
export interface PaymentVerificationMetrics {
  totalAttempts: number;
  successfulVerifications: number;
  failedVerifications: number;
  signatureMismatches: number;
  rateLimitHits: number;
  unauthorizedAttempts: number;
  averageVerificationTime: number;
  successRate: number;
  timeWindow: {
    start: string;
    end: string;
    duration: number; // minutes
  };
}

/**
 * Log configuration
 */
export interface PaymentVerificationLogConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  logLevel: PaymentVerificationLogLevel;
  sanitizeData: boolean;
  includeMetadata: boolean;
  retentionHours: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default logging configuration
 */
export const DEFAULT_LOG_CONFIG: PaymentVerificationLogConfig = {
  enableConsoleLogging: process.env.NODE_ENV !== 'production',
  enableFileLogging: process.env.NODE_ENV === 'production',
  logLevel: 'info',
  sanitizeData: true,
  includeMetadata: true,
  retentionHours: 24 * 7, // 7 days
};

// Current configuration (can be modified at runtime)
let currentLogConfig = { ...DEFAULT_LOG_CONFIG };

// ============================================================================
// In-Memory Log Store (Development)
// ============================================================================

/**
 * In-memory log storage for development and monitoring
 * **DEVELOPMENT ONLY** - Replace with proper logging service in production
 */
class MemoryLogStore {
  private logs: PaymentVerificationLog[] = [];
  private maxSize = 10000; // Maximum logs to keep in memory

  add(log: PaymentVerificationLog): void {
    this.logs.push(log);

    // Trim if exceeding max size
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }
  }

  get(limit?: number): PaymentVerificationLog[] {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return [...this.logs];
  }

  getByUserId(userId: string, limit = 100): PaymentVerificationLog[] {
    return this.logs.filter((log) => log.userId === userId).slice(-limit);
  }

  getByEvent(event: PaymentVerificationEventType, limit = 100): PaymentVerificationLog[] {
    return this.logs.filter((log) => log.event === event).slice(-limit);
  }

  getByLevel(level: PaymentVerificationLogLevel, limit = 100): PaymentVerificationLog[] {
    return this.logs.filter((log) => log.level === level).slice(-limit);
  }

  getSecurityLogs(limit = 100): PaymentVerificationLog[] {
    return this.logs
      .filter((log) => log.level === 'security' || log.security?.threatLevel !== 'low')
      .slice(-limit);
  }

  clear(): void {
    this.logs = [];
  }

  size(): number {
    return this.logs.length;
  }
}

const logStore = new MemoryLogStore();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitize payment ID for logging (keep only last 4 characters)
 */
function sanitizePaymentId(paymentId: string): string {
  if (!paymentId || paymentId.length <= 4) return paymentId;
  return `****${paymentId.slice(-4)}`;
}

/**
 * Sanitize subscription ID for logging (keep only last 4 characters)
 */
function sanitizeSubscriptionId(subscriptionId: string): string {
  if (!subscriptionId || subscriptionId.length <= 4) return subscriptionId;
  return `****${subscriptionId.slice(-4)}`;
}

/**
 * Extract IP address from request
 */
function extractIP(request?: Request): string {
  if (!request) return 'unknown';

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * Extract user agent from request
 */
function extractUserAgent(request?: Request): string {
  if (!request) return 'unknown';
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Determine threat level based on event type
 */
function determineThreatLevel(event: PaymentVerificationEventType): 'low' | 'medium' | 'high' {
  switch (event) {
    case 'verification_success':
    case 'verification_attempt':
      return 'low';

    case 'verification_failed':
    case 'signature_invalid':
    case 'rate_limit_exceeded':
      return 'medium';

    case 'signature_mismatch':
    case 'unauthorized_access':
    case 'subscription_not_found':
    case 'payment_not_found':
      return 'high';

    default:
      return 'low';
  }
}

/**
 * Assess security indicators based on request context
 */
function assessSecurityIndicators(
  event: PaymentVerificationEventType,
  context?: {
    ip?: string;
    userAgent?: string;
    signatureLength?: number;
    error?: string;
  }
): string[] {
  const indicators: string[] = [];

  if (event === 'signature_mismatch') {
    indicators.push('INVALID_SIGNATURE');
  }

  if (event === 'unauthorized_access') {
    indicators.push('UNAUTHORIZED_ATTEMPT');
  }

  if (context?.signatureLength && context.signatureLength !== 64) {
    indicators.push('INVALID_SIGNATURE_LENGTH');
  }

  if (context?.error?.includes('SQL') || context?.error?.includes('database')) {
    indicators.push('POTENTIAL_SQL_INJECTION');
  }

  if (context?.userAgent?.toLowerCase().includes('bot')) {
    indicators.push('SUSPICIOUS_USER_AGENT');
  }

  if (event === 'rate_limit_exceeded') {
    indicators.push('RATE_LIMIT_ABUSE');
  }

  return indicators;
}

// ============================================================================
// Core Logging Functions
// ============================================================================

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: PaymentVerificationLogLevel,
  event: PaymentVerificationEventType,
  data: {
    requestId?: string;
    userId?: string;
    paymentId?: string;
    subscriptionId?: string;
    signatureLength?: number;
    error?: string;
    errorCode?: string;
    duration?: number;
    metadata?: Record<string, any>;
    request?: Request;
  }
): PaymentVerificationLog {
  const timestamp = new Date().toISOString();
  const requestId = data.requestId || generateRequestId();
  const ip = data.request ? extractIP(data.request) : undefined;
  const userAgent = data.request ? extractUserAgent(data.request) : undefined;

  const log: PaymentVerificationLog = {
    timestamp,
    level,
    event,
    requestId,
    userId: currentLogConfig.sanitizeData ? undefined : data.userId,
    ip: currentLogConfig.sanitizeData ? undefined : ip,
    userAgent: currentLogConfig.sanitizeData ? undefined : userAgent,
    paymentId: data.paymentId ? sanitizePaymentId(data.paymentId) : undefined,
    subscriptionId: data.subscriptionId ? sanitizeSubscriptionId(data.subscriptionId) : undefined,
    signatureLength: data.signatureLength,
    error: data.error,
    errorCode: data.errorCode,
    duration: data.duration,
    metadata: currentLogConfig.includeMetadata ? data.metadata : undefined,
  };

  // Add security assessment for security-relevant events
  if (level === 'security' || determineThreatLevel(event) !== 'low') {
    const threatLevel = determineThreatLevel(event);
    const indicators = assessSecurityIndicators(event, {
      ip,
      userAgent,
      signatureLength: data.signatureLength,
      error: data.error,
    });

    log.security = {
      threatLevel,
      indicators: indicators.length > 0 ? indicators : undefined,
      details: {
        event,
        hasUserId: !!data.userId,
        hasSignature: !!data.signatureLength,
        signatureValidLength: data.signatureLength === 64,
      },
    };
  }

  return log;
}

/**
 * Write log entry to console and memory store
 */
function writeLog(log: PaymentVerificationLog): void {
  // Add to memory store
  logStore.add(log);

  // Console logging if enabled
  if (currentLogConfig.enableConsoleLogging) {
    const logMessage = `[${log.timestamp}] ${log.level.toUpperCase()} ${log.event}`;

    switch (log.level) {
      case 'error':
      case 'security':
        console.error(logMessage, {
          requestId: log.requestId,
          userId: log.userId,
          paymentId: log.paymentId,
          error: log.error,
          security: log.security,
        });
        break;

      case 'warn':
        console.warn(logMessage, {
          requestId: log.requestId,
          userId: log.userId,
          paymentId: log.paymentId,
          error: log.error,
        });
        break;

      case 'info':
        console.log(logMessage, {
          requestId: log.requestId,
          userId: log.userId,
          duration: log.duration,
        });
        break;
    }
  }
}

// ============================================================================
// Public Logging API
// ============================================================================

/**
 * Log payment verification attempt
 */
export function logVerificationAttempt(data: {
  requestId?: string;
  userId?: string;
  paymentId?: string;
  subscriptionId?: string;
  request?: Request;
}): void {
  const log = createLogEntry('info', 'verification_attempt', data);
  writeLog(log);
}

/**
 * Log successful payment verification
 */
export function logVerificationSuccess(data: {
  requestId?: string;
  userId?: string;
  paymentId?: string;
  subscriptionId?: string;
  duration?: number;
  metadata?: Record<string, any>;
  request?: Request;
}): void {
  const log = createLogEntry('info', 'verification_success', data);
  writeLog(log);
}

/**
 * Log failed payment verification
 */
export function logVerificationFailure(data: {
  requestId?: string;
  userId?: string;
  paymentId?: string;
  subscriptionId?: string;
  error: string;
  errorCode?: string;
  duration?: number;
  metadata?: Record<string, any>;
  request?: Request;
}): void {
  const log = createLogEntry('error', 'verification_failed', data);
  writeLog(log);
}

/**
 * Log signature mismatch (security event)
 */
export function logSignatureMismatch(data: {
  requestId?: string;
  userId?: string;
  paymentId?: string;
  subscriptionId?: string;
  expectedSignature?: string;
  receivedSignature?: string;
  request?: Request;
}): void {
  const log = createLogEntry('security', 'signature_mismatch', {
    ...data,
    error: 'HMAC signature verification failed',
    errorCode: 'SIGNATURE_MISMATCH',
  });
  writeLog(log);
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(data: {
  requestId?: string;
  userId?: string;
  ip?: string;
  request?: Request;
}): void {
  const log = createLogEntry('warn', 'rate_limit_exceeded', {
    ...data,
    error: 'Rate limit exceeded',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    request: data.request,
  });
  writeLog(log);
}

/**
 * Log unauthorized access attempt
 */
export function logUnauthorizedAccess(data: {
  requestId?: string;
  ip?: string;
  userAgent?: string;
  error?: string;
  request?: Request;
}): void {
  const log = createLogEntry('security', 'unauthorized_access', {
    ...data,
    error: data.error || 'Unauthorized access attempt',
    errorCode: 'UNAUTHORIZED_ACCESS',
    request: data.request,
  });
  writeLog(log);
}

/**
 * Log database errors
 */
export function logDatabaseError(data: {
  requestId?: string;
  userId?: string;
  operation: string;
  error: string;
  errorCode?: string;
  metadata?: Record<string, any>;
  request?: Request;
}): void {
  const log = createLogEntry('error', 'database_error', {
    ...data,
    error: `Database error during ${data.operation}: ${data.error}`,
    metadata: {
      ...data.metadata,
      operation: data.operation,
    },
    request: data.request,
  });
  writeLog(log);
}

/**
 * Log internal server errors
 */
export function logInternalError(data: {
  requestId?: string;
  userId?: string;
  operation: string;
  error: string;
  errorCode?: string;
  metadata?: Record<string, any>;
  request?: Request;
}): void {
  const log = createLogEntry('error', 'internal_error', {
    ...data,
    error: `Internal error during ${data.operation}: ${data.error}`,
    metadata: {
      ...data.metadata,
      operation: data.operation,
    },
    request: data.request,
  });
  writeLog(log);
}

// ============================================================================
// Metrics and Analytics
// ============================================================================

/**
 * Calculate payment verification metrics
 */
export function calculateMetrics(timeWindowMinutes: number = 60): PaymentVerificationMetrics {
  const now = new Date();
  const windowStart = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
  const windowStartStr = windowStart.toISOString();
  const windowEndStr = now.toISOString();

  const logs = logStore.get().filter((log) => log.timestamp >= windowStartStr);

  const totalAttempts = logs.filter((log) => log.event === 'verification_attempt').length;
  const successfulVerifications = logs.filter((log) => log.event === 'verification_success').length;
  const failedVerifications = logs.filter((log) => log.event === 'verification_failed').length;
  const signatureMismatches = logs.filter((log) => log.event === 'signature_mismatch').length;
  const rateLimitHits = logs.filter((log) => log.event === 'rate_limit_exceeded').length;
  const unauthorizedAttempts = logs.filter((log) => log.event === 'unauthorized_access').length;

  // Calculate average verification time
  const verificationTimes = logs
    .filter((log) => log.duration !== undefined && log.duration > 0)
    .map((log) => log.duration!);
  const averageVerificationTime =
    verificationTimes.length > 0
      ? verificationTimes.reduce((sum, time) => sum + time, 0) / verificationTimes.length
      : 0;

  const successRate = totalAttempts > 0 ? (successfulVerifications / totalAttempts) * 100 : 0;

  return {
    totalAttempts,
    successfulVerifications,
    failedVerifications,
    signatureMismatches,
    rateLimitHits,
    unauthorizedAttempts,
    averageVerificationTime,
    successRate,
    timeWindow: {
      start: windowStartStr,
      end: windowEndStr,
      duration: timeWindowMinutes,
    },
  };
}

/**
 * Get security events for monitoring
 */
export function getSecurityEvents(limit: number = 100): PaymentVerificationLog[] {
  return logStore.getSecurityLogs(limit);
}

/**
 * Get recent verification attempts for a user
 */
export function getUserVerificationHistory(
  userId: string,
  limit: number = 50
): PaymentVerificationLog[] {
  return logStore.getByUserId(userId, limit);
}

// ============================================================================
// Configuration Management
// ============================================================================

/**
 * Update logging configuration
 */
export function updateLogConfig(config: Partial<PaymentVerificationLogConfig>): void {
  currentLogConfig = { ...currentLogConfig, ...config };
}

/**
 * Get current logging configuration
 */
export function getLogConfig(): PaymentVerificationLogConfig {
  return { ...currentLogConfig };
}

/**
 * Configure logging for production environment
 */
export function configureProductionLogging(): void {
  updateLogConfig({
    enableConsoleLogging: false,
    enableFileLogging: true,
    logLevel: 'warn',
    sanitizeData: true,
    includeMetadata: false,
    retentionHours: 24 * 30, // 30 days
  });
}

/**
 * Configure logging for development environment
 */
export function configureDevelopmentLogging(): void {
  updateLogConfig({
    enableConsoleLogging: true,
    enableFileLogging: false,
    logLevel: 'info',
    sanitizeData: false,
    includeMetadata: true,
    retentionHours: 24, // 1 day
  });
}

// ============================================================================
// Utility Functions for Testing
// ============================================================================

/**
 * Clear all logs (useful for testing)
 */
export function clearAllLogs(): void {
  logStore.clear();
}

/**
 * Get all logs (useful for testing)
 */
export function getAllLogs(limit?: number): PaymentVerificationLog[] {
  return logStore.get(limit);
}

/**
 * Export logs to JSON (useful for analysis)
 */
export function exportLogs(eventType?: PaymentVerificationEventType): string {
  const logs = eventType ? logStore.getByEvent(eventType) : logStore.get();
  return JSON.stringify(logs, null, 2);
}
