/**
 * Alerting System
 *
 * Comprehensive alerting system with configurable rules, notification channels,
 * and escalation policies for critical system events.
 */

import { errorTracker } from './errorTracking';
import { uptimeMonitor } from './uptimeMonitor';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownPeriod: number; // milliseconds
  lastTriggered?: number;
  triggerCount: number;
}

interface AlertCondition {
  type:
    | 'error_rate'
    | 'response_time'
    | 'error_pattern'
    | 'uptime'
    | 'metric_threshold'
    | 'health_check';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  timeWindow?: number; // milliseconds
  category?: string;
  pattern?: string;
  metric?: string;
  healthCheck?: string;
}

interface AlertAction {
  type: 'log' | 'webhook' | 'email' | 'slack' | 'pagerduty' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  message: string;
  timestamp: number;
  data: Record<string, any>;
  actions: Array<{
    type: string;
    status: 'pending' | 'success' | 'failed';
    message?: string;
    timestamp: number;
  }>;
  resolved: boolean;
  resolvedAt?: number;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'webhook' | 'email' | 'slack' | 'console';
  enabled: boolean;
  config: Record<string, any>;
}

class AlertingSystem {
  private rules: Map<string, AlertRule> = new Map();
  private events: Map<string, AlertEvent> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private maxEvents = 10000;
  private isEnabled = true;

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }

  /**
   * Add an alert rule
   */
  addRule(rule: Omit<AlertRule, 'id' | 'triggerCount' | 'lastTriggered'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullRule: AlertRule = {
      ...rule,
      id,
      triggerCount: 0,
      lastTriggered: undefined,
    };

    this.rules.set(id, fullRule);
    return id;
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Update an alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  /**
   * Add a notification channel
   */
  addChannel(channel: Omit<NotificationChannel, 'id'>): string {
    const id = `channel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullChannel: NotificationChannel = {
      ...channel,
      id,
    };

    this.channels.set(id, fullChannel);
    return id;
  }

  /**
   * Remove a notification channel
   */
  removeChannel(channelId: string): boolean {
    return this.channels.delete(channelId);
  }

  /**
   * Enable/disable the alerting system
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check all alert rules
   */
  async checkRules(): Promise<AlertEvent[]> {
    if (!this.isEnabled) return [];

    const triggeredEvents: AlertEvent[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      if (rule.lastTriggered && Date.now() - rule.lastTriggered < rule.cooldownPeriod) {
        continue;
      }

      try {
        const shouldTrigger = await this.evaluateRule(rule);
        if (shouldTrigger) {
          const event = await this.triggerAlert(rule);
          triggeredEvents.push(event);
        }
      } catch (error) {
        console.error(`Failed to evaluate alert rule ${rule.name}:`, error);
      }
    }

    // Clean up old events
    this.cleanupOldEvents();

    return triggeredEvents;
  }

  /**
   * Get recent alert events
   */
  getEvents(limit = 50, resolved?: boolean): AlertEvent[] {
    const events = Array.from(this.events.values());

    const filtered =
      resolved !== undefined ? events.filter((event) => event.resolved === resolved) : events;

    return filtered.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Resolve an alert event
   */
  resolveEvent(eventId: string, reason?: string): boolean {
    const event = this.events.get(eventId);
    if (!event) return false;

    event.resolved = true;
    event.resolvedAt = Date.now();

    // Log resolution
    console.log(`Alert resolved: ${event.message}`, {
      eventId,
      reason: reason || 'Manual resolution',
      resolvedAt: new Date(event.resolvedAt).toISOString(),
    });

    return true;
  }

  /**
   * Get alert statistics
   */
  getStatistics(): {
    totalRules: number;
    enabledRules: number;
    totalEvents: number;
    activeEvents: number;
    resolvedEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByRule: Record<string, number>;
    averageResolutionTime: number;
  } {
    const rules = Array.from(this.rules.values());
    const events = Array.from(this.events.values());

    const enabledRules = rules.filter((rule) => rule.enabled).length;
    const activeEvents = events.filter((event) => !event.resolved).length;
    const resolvedEvents = events.filter((event) => event.resolved).length;

    const eventsBySeverity: Record<string, number> = {};
    const eventsByRule: Record<string, number> = {};

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const event of events) {
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

      // Count by rule
      eventsByRule[event.ruleName] = (eventsByRule[event.ruleName] || 0) + 1;

      // Calculate resolution time
      if (event.resolved && event.resolvedAt) {
        totalResolutionTime += event.resolvedAt - event.timestamp;
        resolvedCount++;
      }
    }

    return {
      totalRules: rules.length,
      enabledRules,
      totalEvents: events.length,
      activeEvents,
      resolvedEvents,
      eventsBySeverity,
      eventsByRule,
      averageResolutionTime: resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0,
    };
  }

  // Private methods

  private initializeDefaultRules(): void {
    // High error rate rule
    this.addRule({
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds threshold',
      enabled: true,
      severity: 'error',
      cooldownPeriod: 5 * 60 * 1000, // 5 minutes
      conditions: [
        {
          type: 'error_rate',
          operator: '>',
          threshold: 10, // 10% error rate
          timeWindow: 5 * 60 * 1000, // 5 minutes
        },
      ],
      actions: [
        {
          type: 'console',
          enabled: true,
          config: { level: 'error' },
        },
        {
          type: 'log',
          enabled: true,
          config: { level: 'error' },
        },
      ],
    });

    // Slow response time rule
    this.addRule({
      name: 'Slow Response Time',
      description: 'Alert when API response time is too slow',
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
        {
          type: 'console',
          enabled: true,
          config: { level: 'warn' },
        },
      ],
    });

    // Service health check rule
    this.addRule({
      name: 'Service Unhealthy',
      description: 'Alert when a service health check fails',
      enabled: true,
      severity: 'critical',
      cooldownPeriod: 2 * 60 * 1000, // 2 minutes
      conditions: [
        {
          type: 'health_check',
          operator: '!=',
          healthCheck: 'healthy',
          threshold: 1,
        },
      ],
      actions: [
        {
          type: 'console',
          enabled: true,
          config: { level: 'error' },
        },
        {
          type: 'log',
          enabled: true,
          config: { level: 'error' },
        },
      ],
    });

    // Specific error pattern rule
    this.addRule({
      name: 'Critical Error Pattern',
      description: 'Alert when critical error patterns are detected',
      enabled: true,
      severity: 'critical',
      cooldownPeriod: 1 * 60 * 1000, // 1 minute
      conditions: [
        {
          type: 'error_pattern',
          operator: '==',
          threshold: 1,
          pattern: 'database|connection|timeout|memory',
          category: 'database',
        },
      ],
      actions: [
        {
          type: 'console',
          enabled: true,
          config: { level: 'error' },
        },
        {
          type: 'log',
          enabled: true,
          config: { level: 'error' },
        },
      ],
    });

    // Uptime rule
    this.addRule({
      name: 'Low Uptime',
      description: 'Alert when service uptime drops below threshold',
      enabled: true,
      severity: 'error',
      cooldownPeriod: 15 * 60 * 1000, // 15 minutes
      conditions: [
        {
          type: 'uptime',
          operator: '<',
          threshold: 95, // 95% uptime
          timeWindow: 60 * 60 * 1000, // 1 hour
        },
      ],
      actions: [
        {
          type: 'console',
          enabled: true,
          config: { level: 'error' },
        },
      ],
    });
  }

  private initializeDefaultChannels(): void {
    // Console channel
    this.addChannel({
      name: 'Console',
      type: 'console',
      enabled: true,
      config: {
        timestamp: true,
        color: true,
      },
    });

    // Log channel
    this.addChannel({
      name: 'Log',
      type: 'log',
      enabled: true,
      config: {
        timestamp: true,
        level: 'info',
      },
    });
  }

  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    for (const condition of rule.conditions) {
      const result = await this.evaluateCondition(condition);
      if (result) return true;
    }
    return false;
  }

  private async evaluateCondition(condition: AlertCondition): Promise<boolean> {
    switch (condition.type) {
      case 'error_rate':
        return this.evaluateErrorRate(condition);
      case 'response_time':
        return this.evaluateResponseTime(condition);
      case 'error_pattern':
        return this.evaluateErrorPattern(condition);
      case 'health_check':
        return this.evaluateHealthCheck(condition);
      case 'uptime':
        return this.evaluateUptime(condition);
      case 'metric_threshold':
        return this.evaluateMetricThreshold(condition);
      default:
        return false;
    }
  }

  private async evaluateErrorRate(condition: AlertCondition): Promise<boolean> {
    const metrics = errorTracker.getMetrics();
    const totalErrors = metrics.totalErrors;
    const timeWindow = condition.timeWindow || 5 * 60 * 1000;

    // Calculate error rate in the time window
    const now = Date.now();
    const windowStart = now - timeWindow;

    // In a real implementation, you'd query errors by timestamp
    // For now, use overall error rate
    const errorRate =
      totalErrors > 0 ? ((metrics.errorsBySeverity.high || 0) / totalErrors) * 100 : 0;

    return this.compareValues(errorRate, condition.operator, condition.threshold);
  }

  private async evaluateResponseTime(condition: AlertCondition): Promise<boolean> {
    // Get performance metrics
    const { performanceMonitor } = await import('@/lib/performance/performanceMonitor');
    const healthStatus = await performanceMonitor.getSystemHealth();

    // Find the metric for the specified service
    if (condition.metric && healthStatus.categories[condition.metric]) {
      const stats = healthStatus.categories[condition.metric].stats;
      const responseTime = stats.p95; // Use P95 response time

      return this.compareValues(responseTime, condition.operator, condition.threshold);
    }

    return false;
  }

  private async evaluateErrorPattern(condition: AlertCondition): Promise<boolean> {
    if (!condition.pattern) return false;

    const errors = errorTracker.getErrorsByCategory(condition.category);
    const { safeRegExp } = await import('@/lib/utils/safeRegex');
    const regex = safeRegExp(condition.pattern, 'i');

    if (!regex) {
      console.warn('Invalid regex pattern in alert condition');
      return false;
    }

    const matchingErrors = errors.filter(
      (error) => regex.test(error.message) || regex.test(error.stack || '')
    );

    return this.compareValues(matchingErrors.length, condition.operator, condition.threshold);
  }

  private async evaluateHealthCheck(condition: AlertCondition): Promise<boolean> {
    if (!condition.healthCheck) return false;

    const healthStatus = await uptimeMonitor.getHealthStatus();
    const check = healthStatus.checkes.find((c) => c.name === condition.healthCheck);

    if (!check) return false;

    const isHealthy = check.status === 'healthy';
    const result = this.compareValues(isHealthy ? 1 : 0, condition.operator, condition.threshold);

    return result;
  }

  private async evaluateUptime(condition: AlertCondition): Promise<boolean> {
    const timeWindow = condition.timeWindow || 60 * 60 * 1000;
    const metrics = uptimeMonitor.getMetrics();

    // Calculate uptime in the time window
    let uptimePercent = 100;

    for (const [name, metric] of Object.entries(metrics)) {
      const uptime =
        (metric.uptime / (Date.now() - metric.incidents[0]?.timestamp || Date.now())) * 100;
      uptimePercent = Math.min(uptimePercent, uptime);
    }

    return this.compareValues(uptimePercent, condition.operator, condition.threshold);
  }

  private async evaluateMetricThreshold(condition: AlertCondition): Promise<boolean> {
    if (!condition.metric) return false;

    // This would integrate with your metrics system
    // For now, return false
    return false;
  }

  private compareValues(actual: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>':
        return actual > threshold;
      case '<':
        return actual < threshold;
      case '>=':
        return actual >= threshold;
      case '<=':
        return actual <= threshold;
      case '==':
        return actual === threshold;
      case '!=':
        return actual !== threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule): Promise<AlertEvent> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const event: AlertEvent = {
      id: eventId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `Alert triggered: ${rule.description}`,
      timestamp: Date.now(),
      data: {
        ruleId: rule.id,
        triggerCount: rule.triggerCount + 1,
        conditions: rule.conditions,
      },
      actions: [],
      resolved: false,
    };

    // Update rule
    rule.triggerCount++;
    rule.lastTriggered = Date.now();

    // Execute actions
    for (const action of rule.actions) {
      if (action.enabled) {
        try {
          const actionResult = await this.executeAction(action, event);
          event.actions.push({
            type: action.type,
            status: actionResult.success ? 'success' : 'failed',
            message: actionResult.message,
            timestamp: Date.now(),
          });
        } catch (error) {
          event.actions.push({
            type: action.type,
            status: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          });
        }
      }
    }

    // Store event
    this.events.set(eventId, event);

    return event;
  }

  private async executeAction(
    action: AlertAction,
    event: AlertEvent
  ): Promise<{ success: boolean; message: string }> {
    switch (action.type) {
      case 'console':
        return this.executeConsoleAction(action, event);
      case 'log':
        return this.executeLogAction(action, event);
      case 'webhook':
        return this.executeWebhookAction(action, event);
      case 'email':
        return this.executeEmailAction(action, event);
      case 'slack':
        return this.executeSlackAction(action, event);
      default:
        return { success: false, message: `Unknown action type: ${action.type}` };
    }
  }

  private async executeConsoleAction(
    action: AlertAction,
    event: AlertEvent
  ): Promise<{ success: boolean; message: string }> {
    const level = action.config.level || 'info';
    const message = `[${event.severity.toUpperCase()}] ${event.message}`;

    switch (level) {
      case 'error':
        console.error(message, event.data);
        break;
      case 'warn':
        console.warn(message, event.data);
        break;
      default:
        console.log(message, event.data);
    }

    return { success: true, message: 'Console alert sent' };
  }

  private async executeLogAction(
    action: AlertAction,
    event: AlertEvent
  ): Promise<{ success: boolean; message: string }> {
    const level = action.config.level || 'info';
    const logData = {
      timestamp: new Date(event.timestamp).toISOString(),
      level,
      message: event.message,
      event: event.data,
    };

    // In a real implementation, this would send to your logging service
    console.log('LOG:', logData);

    return { success: true, message: 'Log entry created' };
  }

  private async executeWebhookAction(
    action: AlertAction,
    event: AlertEvent
  ): Promise<{ success: boolean; message: string }> {
    const url = action.config.url;
    if (!url) {
      return { success: false, message: 'Webhook URL not configured' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.config.headers,
        },
        body: JSON.stringify({
          event,
          rule: action.config.additionalData || {},
        }),
      });

      if (response.ok) {
        return { success: true, message: 'Webhook sent successfully' };
      } else {
        return {
          success: false,
          message: `Webhook failed: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async executeEmailAction(
    action: AlertAction,
    event: AlertEvent
  ): Promise<{ success: boolean; message: string }> {
    // In a real implementation, this would integrate with your email service
    console.log('EMAIL ALERT:', {
      to: action.config.to,
      subject: `[${event.severity.toUpperCase()}] ${event.ruleName}`,
      message: event.message,
      data: event.data,
    });

    return { success: true, message: 'Email alert sent (simulated)' };
  }

  private async executeSlackAction(
    action: AlertAction,
    event: AlertEvent
  ): Promise<{ success: boolean; message: string }> {
    const webhookUrl = action.config.webhookUrl;
    if (!webhookUrl) {
      return { success: false, message: 'Slack webhook URL not configured' };
    }

    try {
      const slackMessage = {
        text: `🚨 ${event.severity.toUpperCase()} Alert: ${event.message}`,
        attachments: [
          {
            color: this.getSlackColor(event.severity),
            fields: [
              { title: 'Rule', value: event.ruleName, short: true },
              { title: 'Severity', value: event.severity, short: true },
              { title: 'Time', value: new Date(event.timestamp).toISOString(), short: true },
            ],
            timestamp: Math.floor(event.timestamp / 1000),
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });

      if (response.ok) {
        return { success: true, message: 'Slack alert sent' };
      } else {
        return { success: false, message: `Slack webhook failed: ${response.status}` };
      }
    } catch (error) {
      return {
        success: false,
        message: `Slack error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private getSlackColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'good';
    }
  }

  private cleanupOldEvents(): void {
    const now = Date.now();
    const cutoff = now - 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [id, event] of this.events.entries()) {
      if (event.timestamp < cutoff) {
        this.events.delete(id);
      }
    }

    // Limit total events
    if (this.events.size > this.maxEvents) {
      const events = Array.from(this.events.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const toDelete = events.slice(0, events.length - this.maxEvents);
      for (const [id] of toDelete) {
        this.events.delete(id);
      }
    }
  }
}

// Global alerting system instance
export const alertingSystem = new AlertingSystem();

// Utility functions
export function addAlertRule(
  rule: Omit<AlertRule, 'id' | 'triggerCount' | 'lastTriggered'>
): string {
  return alertingSystem.addRule(rule);
}

export function addNotificationChannel(channel: Omit<NotificationChannel, 'id'>): string {
  return alertingSystem.addChannel(channel);
}

export async function checkAlerts(): Promise<AlertEvent[]> {
  return alertingSystem.checkRules();
}

export function getAlertEvents(limit?: number, resolved?: boolean): AlertEvent[] {
  return alertingSystem.getEvents(limit, resolved);
}

export function getAlertStatistics() {
  return alertingSystem.getStatistics();
}

export default alertingSystem;
