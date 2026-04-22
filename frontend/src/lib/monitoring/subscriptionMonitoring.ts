/**
 * Subscription Monitoring and Alerting System
 *
 * @description Comprehensive monitoring for subscription operations with
 * real-time alerts, metrics collection, and health checks
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { NextRequest } from 'next/server';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MonitoringEvent {
  id: string;
  type: 'subscription' | 'payment' | 'webhook' | 'system' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  title: string;
  description: string;
  data?: Record<string, any>;
  userId?: string;
  subscriptionId?: string;
  requestId?: string;
  timestamp: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition: (event: MonitoringEvent) => boolean;
  action: (event: MonitoringEvent) => Promise<void>;
  cooldown: number; // milliseconds
  cooldownUntil?: Date;
  lastTriggered?: Date;
  severityThreshold?: 'warning' | 'error' | 'critical';
}

export interface MonitoringMetrics {
  timestamp: Date;
  activeSubscriptions: number;
  totalRevenue: number;
  churnRate: number;
  conversionRate: number;
  failedTransactions: number;
  successfulTransactions: number;
  averageTransactionDuration: number;
  webhookProcessingTime: number;
  rateLimitViolations: number;
  securityEvents: number;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    responseTime?: number;
    lastChecked: Date;
  }>;
  overallScore: number; // 0-100
  timestamp: Date;
}

// ============================================================================
// Monitoring Configuration
// ============================================================================

const MONITORING_CONFIG = {
  // Event retention periods (in days)
  retentionPeriods: {
    info: 7,
    warning: 30,
    error: 90,
    critical: 365,
  },

  // Alert thresholds
  thresholds: {
    failedTransactionsRate: 0.05, // 5%
    webhookProcessingTime: 5000, // 5 seconds
    averageTransactionDuration: 10000, // 10 seconds
    rateLimitViolationsPerHour: 50,
    securityEventsPerHour: 10,
    churnRateIncrease: 0.2, // 20% increase
  },

  // Health check timeouts
  healthCheckTimeouts: {
    database: 5000,
    razorpay: 3000,
    webhooks: 2000,
    rateLimiter: 1000,
  },

  // Alert cooldowns (in milliseconds)
  alertCooldowns: {
    failedTransactions: 300000, // 5 minutes
    webhookFailures: 600000, // 10 minutes
    rateLimitViolations: 900000, // 15 minutes
    securityEvents: 60000, // 1 minute
    systemErrors: 120000, // 2 minutes
  },
};

// ============================================================================
// In-Memory Event Storage
// ============================================================================

class MonitoringStore {
  private events: MonitoringEvent[] = [];
  private metrics: MonitoringMetrics[] = [];
  private alerts: AlertRule[] = [];
  private healthCheck: HealthCheck | null = null;

  constructor() {
    this.initializeDefaultAlerts();
    // Cleanup old events periodically
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }

  addEvent(event: MonitoringEvent): void {
    event.timestamp = new Date();
    this.events.push(event);

    // Keep only recent events (limit memory usage)
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000);
    }

    // Check alerts
    this.checkAlerts(event);

    // Log to console for development
    console.log(`[Monitoring] ${event.severity.toUpperCase()}: ${event.title}`, {
      type: event.type,
      category: event.category,
      userId: event.userId,
      subscriptionId: event.subscriptionId,
    });
  }

  getEvents(filters?: {
    type?: string;
    severity?: string;
    category?: string;
    userId?: string;
    since?: Date;
    limit?: number;
  }): MonitoringEvent[] {
    let filtered = [...this.events];

    if (filters?.type) {
      filtered = filtered.filter((e) => e.type === filters.type);
    }
    if (filters?.severity) {
      filtered = filtered.filter((e) => e.severity === filters.severity);
    }
    if (filters?.category) {
      filtered = filtered.filter((e) => e.category === filters.category);
    }
    if (filters?.userId) {
      filtered = filtered.filter((e) => e.userId === filters.userId);
    }
    if (filters?.since) {
      filtered = filtered.filter((e) => e.timestamp >= filters.since);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      return filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  addAlert(alert: AlertRule): void {
    this.alerts.push(alert);
  }

  getMetrics(): MonitoringMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  updateMetrics(metrics: Partial<MonitoringMetrics>): void {
    const current = this.getMetrics() || {
      timestamp: new Date(),
      activeSubscriptions: 0,
      totalRevenue: 0,
      churnRate: 0,
      conversionRate: 0,
      failedTransactions: 0,
      successfulTransactions: 0,
      averageTransactionDuration: 0,
      webhookProcessingTime: 0,
      rateLimitViolations: 0,
      securityEvents: 0,
    };

    this.metrics.push({
      ...current,
      ...metrics,
      timestamp: new Date(),
    });

    // Keep only last 24 hours of metrics
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter((m) => m.timestamp > oneDayAgo);
  }

  private async checkAlerts(event: MonitoringEvent): Promise<void> {
    for (const alert of this.alerts) {
      if (!alert.enabled) continue;

      // Check cooldown
      if (alert.cooldownUntil && new Date() < alert.cooldownUntil) continue;
      if (
        alert.severityThreshold &&
        this.getSeverityWeight(event.severity) < this.getSeverityWeight(alert.severityThreshold)
      )
        continue;

      try {
        if (alert.condition(event)) {
          await alert.action(event);
          alert.lastTriggered = new Date();
          alert.cooldownUntil = new Date(Date.now() + alert.cooldown);
        }
      } catch (error) {
        console.error(`[Monitoring] Alert action failed for ${alert.name}:`, error);
      }
    }
  }

  private getSeverityWeight(severity: string): number {
    const weights = { info: 1, warning: 2, error: 3, critical: 4 };
    return weights[severity as keyof typeof weights] || 0;
  }

  private initializeDefaultAlerts(): void {
    // High transaction failure rate alert
    this.addAlert({
      id: 'high-transaction-failure-rate',
      name: 'High Transaction Failure Rate',
      description: 'Alert when transaction failure rate exceeds threshold',
      enabled: true,
      condition: (event) => {
        return event.type === 'system' && event.category === 'transaction_failed';
      },
      action: async (event) => {
        await this.sendSlackAlert({
          title: '🚨 High Transaction Failure Rate',
          color: 'danger',
          text: `Transaction failure detected: ${event.description}`,
          fields: [
            { title: 'User ID', value: event.userId || 'Unknown', short: true },
            { title: 'Subscription ID', value: event.subscriptionId || 'Unknown', short: true },
            { title: 'Request ID', value: event.requestId || 'Unknown', short: true },
          ],
        });
      },
      cooldown: MONITORING_CONFIG.alertCooldowns.failedTransactions,
      severityThreshold: 'error',
    });

    // Webhook processing failures
    this.addAlert({
      id: 'webhook-processing-failures',
      name: 'Webhook Processing Failures',
      description: 'Alert when webhook processing fails',
      enabled: true,
      condition: (event) => {
        return event.type === 'webhook' && event.severity === 'error';
      },
      action: async (event) => {
        await this.sendSlackAlert({
          title: '⚠️ Webhook Processing Failure',
          color: 'warning',
          text: `Webhook processing failed: ${event.description}`,
          fields: [
            { title: 'Event Type', value: event.data?.eventType || 'Unknown', short: true },
            { title: 'Subscription ID', value: event.subscriptionId || 'Unknown', short: true },
          ],
        });
      },
      cooldown: MONITORING_CONFIG.alertCooldowns.webhookFailures,
      severityThreshold: 'error',
    });

    // Rate limit violations
    this.addAlert({
      id: 'rate-limit-violations',
      name: 'Rate Limit Violations',
      description: 'Alert when rate limits are exceeded',
      enabled: true,
      condition: (event) => {
        return event.type === 'security' && event.category === 'rate_limit_exceeded';
      },
      action: async (event) => {
        await this.sendSlackAlert({
          title: '🛡️ Rate Limit Violation',
          color: 'warning',
          text: `Rate limit exceeded: ${event.description}`,
          fields: [
            { title: 'IP Address', value: event.data?.ipAddress || 'Unknown', short: true },
            { title: 'User ID', value: event.userId || 'Unknown', short: true },
            { title: 'Endpoint', value: event.data?.endpoint || 'Unknown', short: true },
          ],
        });
      },
      cooldown: MONITORING_CONFIG.alertCooldowns.rateLimitViolations,
      severityThreshold: 'warning',
    });

    // Security events
    this.addAlert({
      id: 'security-events',
      name: 'Security Events',
      description: 'Alert for security-related events',
      enabled: true,
      condition: (event) => {
        return event.type === 'security' && event.severity === 'critical';
      },
      action: async (event) => {
        await this.sendSlackAlert({
          title: '🚨 Security Event Detected',
          color: 'danger',
          text: `Security event: ${event.description}`,
          fields: [
            { title: 'Event Type', value: event.category, short: true },
            { title: 'User ID', value: event.userId || 'Unknown', short: true },
            { title: 'IP Address', value: event.data?.ipAddress || 'Unknown', short: true },
            { title: 'User Agent', value: event.data?.userAgent || 'Unknown', short: false },
          ],
        });
      },
      cooldown: MONITORING_CONFIG.alertCooldowns.securityEvents,
      severityThreshold: 'critical',
    });
  }

  private async sendSlackAlert(alert: {
    title: string;
    color: string;
    text: string;
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }): Promise<void> {
    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Slack Alert] ${alert.title}`, {
        color: alert.color,
        text: alert.text,
        fields: alert.fields,
      });
      return;
    }

    // In production, send to Slack webhook
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('Slack webhook URL not configured, skipping alert');
      return;
    }

    try {
      const payload = {
        attachments: [
          {
            color: alert.color,
            title: alert.title,
            text: alert.text,
            fields: alert.fields,
            ts: Math.floor(Date.now() / 1000),
            footer: 'Polaris Monitoring',
            footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
          },
        ],
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  private cleanup(): void {
    const now = new Date();
    const retentionPeriods = MONITORING_CONFIG.retentionPeriods;

    this.events = this.events.filter((event) => {
      const daysOld = (now.getTime() - event.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      const maxDays = retentionPeriods[event.severity] || 7;
      return daysOld <= maxDays;
    });
  }
}

const monitoringStore = new MonitoringStore();

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Create a monitoring event
 */
export function createMonitoringEvent(params: {
  type: MonitoringEvent['type'];
  severity: MonitoringEvent['severity'];
  category: string;
  title: string;
  description: string;
  data?: Record<string, any>;
  userId?: string;
  subscriptionId?: string;
  requestId?: string;
  tags?: string[];
}): MonitoringEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    ...params,
  };
}

/**
 * Log a monitoring event
 */
export function logEvent(event: MonitoringEvent): void {
  monitoringStore.addEvent(event);
}

/**
 * Log subscription events
 */
export function logSubscriptionEvent(params: {
  action: string;
  status: 'success' | 'failure' | 'pending';
  userId: string;
  subscriptionId?: string;
  requestId?: string;
  data?: Record<string, any>;
  duration?: number;
}): void {
  const severity =
    params.status === 'failure' ? 'error' : params.status === 'pending' ? 'warning' : 'info';

  const event = createMonitoringEvent({
    type: 'subscription',
    severity,
    category: params.action,
    title: `Subscription ${params.action} ${params.status}`,
    description: `Subscription ${params.action} ${params.status}${params.duration ? ` (${params.duration}ms)` : ''}`,
    userId: params.userId,
    subscriptionId: params.subscriptionId,
    requestId: params.requestId,
    data: {
      ...params.data,
      duration: params.duration,
      status: params.status,
    },
    tags: ['subscription', params.action, params.status],
  });

  logEvent(event);
}

/**
 * Log payment events
 */
export function logPaymentEvent(params: {
  action: string;
  status: 'success' | 'failure' | 'pending';
  userId: string;
  amount?: number;
  currency?: string;
  paymentId?: string;
  requestId?: string;
  data?: Record<string, any>;
}): void {
  const severity =
    params.status === 'failure' ? 'error' : params.status === 'pending' ? 'warning' : 'info';

  const event = createMonitoringEvent({
    type: 'payment',
    severity,
    category: params.action,
    title: `Payment ${params.action} ${params.status}`,
    description: `Payment ${params.action} ${params.status}${params.amount ? ` (${params.currency || 'INR'} ${params.amount})` : ''}`,
    userId: params.userId,
    requestId: params.requestId,
    data: {
      ...params.data,
      amount: params.amount,
      currency: params.currency,
      paymentId: params.paymentId,
      status: params.status,
    },
    tags: ['payment', params.action, params.status],
  });

  logEvent(event);
}

/**
 * Log webhook events
 */
export function logWebhookEvent(params: {
  eventType: string;
  status: 'success' | 'failure' | 'retrying';
  subscriptionId?: string;
  requestId?: string;
  processingTime?: number;
  data?: Record<string, any>;
}): void {
  const severity =
    params.status === 'failure' ? 'error' : params.status === 'retrying' ? 'warning' : 'info';

  const event = createMonitoringEvent({
    type: 'webhook',
    severity,
    category: 'webhook_processing',
    title: `Webhook ${params.eventType} ${params.status}`,
    description: `Webhook ${params.eventType} ${params.status}${params.processingTime ? ` (${params.processingTime}ms)` : ''}`,
    subscriptionId: params.subscriptionId,
    requestId: params.requestId,
    data: {
      ...params.data,
      eventType: params.eventType,
      processingTime: params.processingTime,
      status: params.status,
    },
    tags: ['webhook', params.eventType, params.status],
  });

  logEvent(event);
}

/**
 * Log security events
 */
export function logSecurityEvent(params: {
  category: string;
  title: string;
  description: string;
  severity: 'warning' | 'error' | 'critical';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  data?: Record<string, any>;
}): void {
  const event = createMonitoringEvent({
    type: 'security',
    severity: params.severity,
    category: params.category,
    title: params.title,
    description: params.description,
    userId: params.userId,
    requestId: params.requestId,
    data: {
      ...params.data,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
    tags: ['security', params.category, params.severity],
  });

  logEvent(event);
}

/**
 * Log rate limit violations
 */
export function logRateLimitViolation(params: {
  userId?: string;
  ipAddress: string;
  endpoint: string;
  limitType: string;
  limit: number;
  currentUsage: number;
  resetTime: Date;
  requestId?: string;
}): void {
  const event = createMonitoringEvent({
    type: 'security',
    severity: 'warning',
    category: 'rate_limit_exceeded',
    title: 'Rate Limit Exceeded',
    description: `Rate limit exceeded for ${params.endpoint}: ${params.currentUsage}/${params.limit}`,
    userId: params.userId,
    requestId: params.requestId,
    data: {
      ipAddress: params.ipAddress,
      endpoint: params.endpoint,
      limitType: params.limitType,
      limit: params.limit,
      currentUsage: params.currentUsage,
      resetTime: params.resetTime.toISOString(),
    },
    tags: ['security', 'rate_limit', params.endpoint],
  });

  logEvent(event);
}

/**
 * Get monitoring dashboard data
 */
export function getMonitoringDashboard(): {
  summary: {
    totalEvents: number;
    criticalEvents: number;
    errorEvents: number;
    warningEvents: number;
    infoEvents: number;
  };
  recentEvents: MonitoringEvent[];
  metrics: MonitoringMetrics | null;
  healthStatus: HealthCheck | null;
} {
  const events = monitoringStore.getEvents();

  const summary = {
    totalEvents: events.length,
    criticalEvents: events.filter((e) => e.severity === 'critical').length,
    errorEvents: events.filter((e) => e.severity === 'error').length,
    warningEvents: events.filter((e) => e.severity === 'warning').length,
    infoEvents: events.filter((e) => e.severity === 'info').length,
  };

  const recentEvents = monitoringStore.getEvents({ limit: 100 });
  const metrics = monitoringStore.getMetrics();
  const healthStatus = monitoringStore.healthCheck;

  return {
    summary,
    recentEvents,
    metrics,
    healthStatus,
  };
}

/**
 * Update monitoring metrics
 */
export function updateMonitoringMetrics(metrics: Partial<MonitoringMetrics>): void {
  monitoringStore.updateMetrics(metrics);
}

/**
 * Get monitoring events with filters
 */
export function getMonitoringEvents(filters?: {
  type?: string;
  severity?: string;
  category?: string;
  userId?: string;
  since?: Date;
  limit?: number;
}): MonitoringEvent[] {
  return monitoringStore.getEvents(filters);
}

export default {
  logEvent,
  logSubscriptionEvent,
  logPaymentEvent,
  logWebhookEvent,
  logSecurityEvent,
  logRateLimitViolation,
  getMonitoringDashboard,
  updateMonitoringMetrics,
  getMonitoringEvents,
  createMonitoringEvent,
};
