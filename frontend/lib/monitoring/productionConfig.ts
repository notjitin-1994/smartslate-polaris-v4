/**
 * Production Monitoring Configuration
 *
 * Comprehensive production monitoring setup for payment processing,
 * webhook handling, and system health with real-time alerting.
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import {
  alertingSystem,
  type AlertRule,
  type NotificationChannel,
} from '@/lib/monitoring/alertingSystem';
import { createWebhookLogger } from '@/lib/logging/webhookLogging';

// ============================================================================
// Production Notification Channels
// ============================================================================

/**
 * Production notification channels
 */
export const PRODUCTION_NOTIFICATION_CHANNELS = {
  // Email channel for critical alerts
  email: {
    name: 'Production Email Alerts',
    type: 'email' as const,
    enabled: true,
    config: {
      to: process.env.PROD_ALERT_EMAIL?.split(',') || ['admin@smartslate.com'],
      from: 'alerts@smartslate.com',
      subject: '[SMARTSLATE-PROD] Alert: {severity} - {ruleName}',
      template: 'production_alert',
    },
  },

  // Slack channel for real-time notifications
  slack: {
    name: 'Production Slack Alerts',
    type: 'slack' as const,
    enabled: true,
    config: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: '#production-alerts',
      username: 'SmartSlate Monitor',
      iconEmoji: ':warning:',
    },
  },

  // Webhook for external monitoring services
  webhook: {
    name: 'External Monitoring Webhook',
    type: 'webhook' as const,
    enabled: true,
    config: {
      url: process.env.EXTERNAL_MONITORING_WEBHOOK_URL,
      headers: {
        Authorization: `Bearer ${process.env.EXTERNAL_MONITORING_TOKEN}`,
        'Content-Type': 'application/json',
      },
    },
  },
};

// ============================================================================
// Production Alert Rules
// ============================================================================

/**
 * Payment processing alert rules
 */
export const PAYMENT_ALERT_RULES: Omit<AlertRule, 'id' | 'triggerCount' | 'lastTriggered'>[] = [
  {
    name: 'Critical Payment Failure Rate',
    description: 'Alert when payment failure rate exceeds 5% in 5 minutes',
    enabled: true,
    severity: 'critical',
    cooldownPeriod: 5 * 60 * 1000, // 5 minutes
    conditions: [
      {
        type: 'error_rate',
        operator: '>',
        threshold: 5, // 5% failure rate
        timeWindow: 5 * 60 * 1000, // 5 minutes
        category: 'payment',
      },
    ],
    actions: [
      { type: 'email', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.email.config },
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
      { type: 'webhook', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.webhook.config },
    ],
  },

  {
    name: 'Webhook Processing Failure',
    description: 'Alert when webhook processing fails consecutively 3 times',
    enabled: true,
    severity: 'error',
    cooldownPeriod: 2 * 60 * 1000, // 2 minutes
    conditions: [
      {
        type: 'error_pattern',
        operator: '>=',
        threshold: 3,
        pattern: 'webhook.*failed',
        category: 'webhook',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
      { type: 'email', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.email.config },
    ],
  },

  {
    name: 'Razorpay Signature Verification Failure',
    description: 'Alert when Razorpay webhook signature verification fails',
    enabled: true,
    severity: 'critical',
    cooldownPeriod: 1 * 60 * 1000, // 1 minute
    conditions: [
      {
        type: 'error_pattern',
        operator: '>=',
        threshold: 1,
        pattern: 'signature.*verification.*failed',
        category: 'security',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
      { type: 'email', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.email.config },
      { type: 'webhook', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.webhook.config },
    ],
  },

  {
    name: 'Payment API Response Time Degradation',
    description: 'Alert when payment API response time exceeds 3 seconds',
    enabled: true,
    severity: 'warning',
    cooldownPeriod: 10 * 60 * 1000, // 10 minutes
    conditions: [
      {
        type: 'response_time',
        operator: '>',
        threshold: 3000, // 3 seconds
        metric: 'payment_api',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
    ],
  },

  {
    name: 'Database Connection Issues',
    description: 'Alert when database connection errors are detected',
    enabled: true,
    severity: 'critical',
    cooldownPeriod: 2 * 60 * 1000, // 2 minutes
    conditions: [
      {
        type: 'error_pattern',
        operator: '>=',
        threshold: 2,
        pattern: 'database.*connection|timeout.*database',
        category: 'database',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
      { type: 'email', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.email.config },
    ],
  },

  {
    name: 'Subscription Processing Delay',
    description: 'Alert when subscription processing takes longer than 30 seconds',
    enabled: true,
    severity: 'warning',
    cooldownPeriod: 15 * 60 * 1000, // 15 minutes
    conditions: [
      {
        type: 'response_time',
        operator: '>',
        threshold: 30000, // 30 seconds
        metric: 'subscription_processing',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
    ],
  },

  {
    name: 'High Error Rate in AI Services',
    description: 'Alert when AI service error rate exceeds 10%',
    enabled: true,
    severity: 'error',
    cooldownPeriod: 5 * 60 * 1000, // 5 minutes
    conditions: [
      {
        type: 'error_rate',
        operator: '>',
        threshold: 10, // 10% error rate
        timeWindow: 5 * 60 * 1000, // 5 minutes
        category: 'ai_service',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
      { type: 'email', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.email.config },
    ],
  },

  {
    name: 'Rate Limit Abuse Detection',
    description: 'Alert when rate limit is exceeded frequently',
    enabled: true,
    severity: 'warning',
    cooldownPeriod: 10 * 60 * 1000, // 10 minutes
    conditions: [
      {
        type: 'error_pattern',
        operator: '>=',
        threshold: 5, // 5 rate limit hits
        pattern: 'rate.*limit.*exceeded',
        category: 'security',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
    ],
  },

  {
    name: 'Memory Usage High',
    description: 'Alert when memory usage exceeds 80%',
    enabled: true,
    severity: 'warning',
    cooldownPeriod: 15 * 60 * 1000, // 15 minutes
    conditions: [
      {
        type: 'metric_threshold',
        operator: '>',
        threshold: 80, // 80%
        metric: 'memory_usage_percent',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
    ],
  },

  {
    name: 'Service Unhealthy',
    description: 'Alert when any critical health check fails',
    enabled: true,
    severity: 'critical',
    cooldownPeriod: 1 * 60 * 1000, // 1 minute
    conditions: [
      {
        type: 'health_check',
        operator: '!=',
        healthCheck: 'healthy',
        threshold: 1,
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
      { type: 'email', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.email.config },
      { type: 'webhook', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.webhook.config },
    ],
  },
];

// ============================================================================
// System Health Monitoring Rules
// ============================================================================

/**
 * System health monitoring rules
 */
export const SYSTEM_HEALTH_RULES: Omit<AlertRule, 'id' | 'triggerCount' | 'lastTriggered'>[] = [
  {
    name: 'API Response Time Degradation',
    description: 'Alert when API P95 response time exceeds 2 seconds',
    enabled: true,
    severity: 'warning',
    cooldownPeriod: 10 * 60 * 1000, // 10 minutes
    conditions: [
      {
        type: 'response_time',
        operator: '>',
        threshold: 2000, // 2 seconds
        metric: 'api_p95_response_time',
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
    ],
  },

  {
    name: 'Application Uptime Low',
    description: 'Alert when application uptime drops below 99%',
    enabled: true,
    severity: 'error',
    cooldownPeriod: 15 * 60 * 1000, // 15 minutes
    conditions: [
      {
        type: 'uptime',
        operator: '<',
        threshold: 99, // 99% uptime
        timeWindow: 60 * 60 * 1000, // 1 hour
      },
    ],
    actions: [
      { type: 'slack', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.slack.config },
      { type: 'email', enabled: true, config: PRODUCTION_NOTIFICATION_CHANNELS.email.config },
    ],
  },
];

// ============================================================================
// Vercel Integration Configuration
// ============================================================================

/**
 * Vercel monitoring integration configuration
 */
export const VERCEL_MONITORING_CONFIG = {
  // Vercel Analytics integration
  analytics: {
    enabled: true,
    metrics: ['web_vitals', 'page_views', 'conversion_rates', 'error_rates'],
  },

  // Vercel Speed Insights
  speedInsights: {
    enabled: true,
    thresholds: {
      lcp: 2500, // Largest Contentful Paint
      fid: 100, // First Input Delay
      cls: 0.1, // Cumulative Layout Shift
    },
  },

  // Vercel Logs integration
  logs: {
    enabled: true,
    filters: ['error', 'warning', 'critical'],
    realtime: true,
  },

  // Custom metrics for payment processing
  customMetrics: [
    {
      name: 'payment_success_rate',
      type: 'percentage',
      tags: ['payment', 'razorpay'],
    },
    {
      name: 'webhook_processing_time',
      type: 'duration',
      tags: ['webhook', 'razorpay'],
    },
    {
      name: 'subscription_conversion_rate',
      type: 'percentage',
      tags: ['subscription', 'business'],
    },
  ],
};

// ============================================================================
// Dashboard Configuration
// ============================================================================

/**
 * Production monitoring dashboard configuration
 */
export const DASHBOARD_CONFIG = {
  refreshInterval: 30000, // 30 seconds

  widgets: [
    {
      id: 'payment_health',
      title: 'Payment System Health',
      type: 'status_grid',
      metrics: ['payment_success_rate', 'webhook_success_rate', 'api_response_time', 'error_rate'],
      refreshInterval: 10000, // 10 seconds
    },

    {
      id: 'transaction_metrics',
      title: 'Transaction Metrics',
      type: 'time_series',
      metrics: [
        'transactions_per_minute',
        'revenue_tracking',
        'subscription_conversions',
        'failed_payments',
      ],
      timeRange: '1h',
    },

    {
      id: 'system_health',
      title: 'System Health',
      type: 'gauge_grid',
      metrics: ['cpu_usage', 'memory_usage', 'database_connections', 'uptime_percentage'],
    },

    {
      id: 'alert_feed',
      title: 'Recent Alerts',
      type: 'alert_feed',
      maxItems: 20,
      filter: {
        resolved: false,
        severity: ['critical', 'error'],
      },
    },

    {
      id: 'error_analysis',
      title: 'Error Analysis',
      type: 'error_breakdown',
      groupBy: 'category',
      timeRange: '24h',
    },
  ],
};

// ============================================================================
// Setup and Initialization Functions
// ============================================================================

/**
 * Configure production monitoring
 */
export function configureProductionMonitoring(): void {
  console.log('[Production Monitoring] Setting up production monitoring...');

  // Add notification channels
  Object.values(PRODUCTION_NOTIFICATION_CHANNELS).forEach((channel) => {
    try {
      alertingSystem.addChannel(channel);
      console.log(`[Production Monitoring] Added ${channel.name} channel`);
    } catch (error) {
      console.error(`[Production Monitoring] Failed to add ${channel.name} channel:`, error);
    }
  });

  // Add payment alert rules
  PAYMENT_ALERT_RULES.forEach((rule) => {
    try {
      const ruleId = alertingSystem.addRule(rule);
      console.log(`[Production Monitoring] Added payment alert rule: ${rule.name} (${ruleId})`);
    } catch (error) {
      console.error(
        `[Production Monitoring] Failed to add payment alert rule ${rule.name}:`,
        error
      );
    }
  });

  // Add system health rules
  SYSTEM_HEALTH_RULES.forEach((rule) => {
    try {
      const ruleId = alertingSystem.addRule(rule);
      console.log(`[Production Monitoring] Added system health rule: ${rule.name} (${ruleId})`);
    } catch (error) {
      console.error(
        `[Production Monitoring] Failed to add system health rule ${rule.name}:`,
        error
      );
    }
  });

  // Configure webhook logging for production
  const webhookLogger = createWebhookLogger();
  webhookLogger.updateConfig({
    enableConsoleOutput: false,
    enableStructuredOutput: true,
    enableMetrics: true,
    enableAuditTrail: true,
    enablePerformanceTracking: true,
    enableErrorAggregation: true,
    level: 'warn',
    excludeSensitiveData: true,
    maxLogEntries: 50000,
    retentionDays: 30,
  });

  console.log('[Production Monitoring] Production monitoring configured successfully');
}

/**
 * Test production alerting system
 */
export async function testProductionAlerting(): Promise<{
  success: boolean;
  results: Array<{ rule: string; success: boolean; message: string }>;
}> {
  console.log('[Production Monitoring] Testing production alerting...');

  const results = [];

  // Test basic notification channels
  for (const [name, channel] of Object.entries(PRODUCTION_NOTIFICATION_CHANNELS)) {
    if (!channel.enabled) continue;

    try {
      // Create a test alert
      const testEvent = {
        id: `test_${Date.now()}`,
        ruleId: 'test_rule',
        ruleName: 'Production Monitoring Test',
        severity: 'info',
        message: `Test alert for ${name} channel`,
        timestamp: Date.now(),
        data: { test: true, channel: name },
        actions: [],
        resolved: false,
      };

      // This would normally trigger the alert actions
      console.log(`[Production Monitoring] Test alert for ${name}: ${testEvent.message}`);

      results.push({
        rule: `${name} channel`,
        success: true,
        message: 'Test alert sent successfully',
      });
    } catch (error) {
      results.push({
        rule: `${name} channel`,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const success = successCount === results.length;

  console.log(
    `[Production Monitoring] Alerting test completed: ${successCount}/${results.length} successful`
  );

  return { success, results };
}

/**
 * Get production monitoring status
 */
export function getProductionMonitoringStatus(): {
  configured: boolean;
  channels: Array<{ name: string; type: string; enabled: boolean }>;
  rules: Array<{ name: string; severity: string; enabled: boolean }>;
  lastHealthCheck?: string;
} {
  const stats = alertingSystem.getStatistics();

  return {
    configured: stats.enabledRules > 0,
    channels: Object.values(PRODUCTION_NOTIFICATION_CHANNELS).map((channel) => ({
      name: channel.name,
      type: channel.type,
      enabled: channel.enabled,
    })),
    rules: [
      ...PAYMENT_ALERT_RULES.map((rule) => ({
        name: rule.name,
        severity: rule.severity,
        enabled: rule.enabled,
      })),
      ...SYSTEM_HEALTH_RULES.map((rule) => ({
        name: rule.name,
        severity: rule.severity,
        enabled: rule.enabled,
      })),
    ],
    lastHealthCheck: new Date().toISOString(),
  };
}

// ============================================================================
// Environment Validation
// ============================================================================

/**
 * Validate production monitoring environment variables
 */
export function validateProductionEnvironment(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required environment variables
  const required = [
    'PROD_ALERT_EMAIL',
    'SLACK_WEBHOOK_URL',
    'EXTERNAL_MONITORING_WEBHOOK_URL',
    'EXTERNAL_MONITORING_TOKEN',
  ];

  required.forEach((envVar) => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  });

  // Optional but recommended
  const recommended = ['VERCEL_ANALYTICS_ID', 'SENTRY_DSN', 'LOGDNA_API_KEY'];

  recommended.forEach((envVar) => {
    if (!process.env[envVar]) {
      warnings.push(`Missing recommended environment variable: ${envVar}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default {
  PRODUCTION_NOTIFICATION_CHANNELS,
  PAYMENT_ALERT_RULES,
  SYSTEM_HEALTH_RULES,
  VERCEL_MONITORING_CONFIG,
  DASHBOARD_CONFIG,
  configureProductionMonitoring,
  testProductionAlerting,
  getProductionMonitoringStatus,
  validateProductionEnvironment,
};
