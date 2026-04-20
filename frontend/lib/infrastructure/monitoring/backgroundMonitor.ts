/**
 * Background Monitoring Service
 *
 * Background service that runs periodic monitoring checks,
 * collects metrics, and triggers alerts automatically.
 */

import { errorTracker } from './errorTracking';
import { uptimeMonitor } from './uptimeMonitor';
import { alertingSystem } from './alertingSystem';
import { performanceMonitor } from '@/lib/performance/performanceMonitor';

interface MonitoringConfig {
  enabled: boolean;
  interval: number; // milliseconds
  alertCheckInterval: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  cleanupInterval: number; // milliseconds
  maxEvents: number;
  retentionPeriod: number; // milliseconds
}

interface MonitoringReport {
  timestamp: number;
  duration: number;
  healthChecks: number;
  performanceMetrics: number;
  errorsTracked: number;
  alertsTriggered: number;
  systemMetrics: {
    memory: NodeJS.MemoryUsage;
    uptime: number;
  };
  summary: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
    recommendations: string[];
  };
}

class BackgroundMonitor {
  private config: MonitoringConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private alertIntervalId: NodeJS.Timeout | null = null;
  private healthIntervalId: NodeJS.Timeout | null = null;
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private reports: MonitoringReport[] = [];
  private startTime: number;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enabled: true,
      interval: 60000, // 1 minute
      alertCheckInterval: 30000, // 30 seconds
      healthCheckInterval: 60000, // 1 minute
      cleanupInterval: 300000, // 5 minutes
      maxEvents: 1000,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...config,
    };

    this.startTime = Date.now();
  }

  /**
   * Start background monitoring
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) {
      return;
    }

    this.isRunning = true;
    console.log('Background monitoring started');

    // Main monitoring interval
    this.intervalId = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.interval);

    // Alert checking interval
    this.alertIntervalId = setInterval(() => {
      this.checkAlerts();
    }, this.config.alertCheckInterval);

    // Health check interval
    this.healthIntervalId = setInterval(() => {
      this.checkHealth();
    }, this.config.healthCheckInterval);

    // Cleanup interval
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    // Perform initial monitoring cycle
    this.performMonitoringCycle();
  }

  /**
   * Stop background monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('Background monitoring stopped');

    // Clear all intervals
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.alertIntervalId) {
      clearInterval(this.alertIntervalId);
      this.alertIntervalId = null;
    }
    if (this.healthIntervalId) {
      clearInterval(this.healthIntervalId);
      this.healthIntervalId = null;
    }
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isRunning: boolean;
    uptime: number;
    lastReport?: MonitoringReport;
    reportCount: number;
    config: MonitoringConfig;
  } {
    return {
      isRunning: this.isRunning,
      uptime: Date.now() - this.startTime,
      lastReport: this.reports[this.reports.length - 1],
      reportCount: this.reports.length,
      config: this.config,
    };
  }

  /**
   * Get monitoring reports
   */
  getReports(limit = 50): MonitoringReport[] {
    return this.reports.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    const reports = this.getReports(10);

    if (reports.length === 0) {
      return {
        averageResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        uptime: 0,
        memoryUsage: process.memoryUsage(),
      };
    }

    const totalResponseTime = reports.reduce((sum, report) => sum + report.duration, 0);
    const averageResponseTime = totalResponseTime / reports.length;

    const totalHealthChecks = reports.reduce((sum, report) => sum + report.healthChecks, 0);
    const totalErrors = reports.reduce((sum, report) => sum + report.errorsTracked, 0);
    const totalAlerts = reports.reduce((sum, report) => sum + report.alertsTriggered, 0);

    const errorRate = totalErrors > 0 ? (totalErrors / (totalHealthChecks + totalErrors)) * 100 : 0;
    const uptime = ((Date.now() - this.startTime) / (Date.now() - this.startTime)) * 100; // Simplified uptime calculation

    return {
      averageResponseTime,
      totalRequests: totalHealthChecks,
      errorRate,
      uptime,
      memoryUsage: process.memoryUsage(),
    };
  }

  // Private methods

  private async performMonitoringCycle(): Promise<void> {
    const startTime = Date.now();

    try {
      const report: MonitoringReport = {
        timestamp: startTime,
        duration: 0,
        healthChecks: 0,
        performanceMetrics: 0,
        errorsTracked: 0,
        alertsTriggered: 0,
        systemMetrics: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        },
        summary: {
          overall: 'healthy',
          issues: [],
          recommendations: [],
        },
      };

      // Collect health check metrics
      const healthStatus = await uptimeMonitor.getHealthStatus();
      report.healthChecks = healthStatus.checks.length;

      // Collect performance metrics
      const performanceData = performanceMonitor.getSystemHealth();
      report.performanceMetrics = performanceData.summary.totalMetrics;

      // Collect error metrics
      const errorMetrics = errorTracker.getMetrics();
      report.errorsTracked = errorMetrics.totalErrors;

      // Check for issues and generate recommendations
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Health check issues
      if (healthStatus.summary.unhealthyChecks > 0) {
        issues.push(`${healthStatus.summary.unhealthyChecks} unhealthy services`);
        recommendations.push('Investigate failing health checks immediately');
      }

      if (healthStatus.summary.degradedChecks > 0) {
        issues.push(`${healthStatus.summary.degradedChecks} degraded services`);
        recommendations.push('Monitor degraded services for improvement');
      }

      // Error rate issues
      if (errorMetrics.totalErrors > 10) {
        issues.push(`High error rate: ${errorMetrics.totalErrors} errors`);
        recommendations.push('Review error patterns and implement fixes');
      }

      // Memory usage issues
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      if (memoryUsagePercent > 85) {
        issues.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
        recommendations.push('Investigate memory leaks and optimize usage');
      }

      // Uptime issues
      const uptime = (Date.now() - this.startTime) / (1000 * 60); // minutes
      if (uptime < 60 && errorMetrics.totalErrors > 5) {
        issues.push('Multiple errors detected shortly after startup');
        recommendations.push('Review startup configuration and recent deployments');
      }

      // Alert status issues
      const alertStats = alertingSystem.getStatistics();
      if (alertStats.activeEvents > 0) {
        issues.push(`${alertStats.activeEvents} active alerts`);
        recommendations.push('Resolve active alerts to maintain system stability');
      }

      report.summary.issues = issues;
      report.summary.recommendations = recommendations;

      // Determine overall status
      if (issues.length > 2 || healthStatus.summary.unhealthyChecks > 0) {
        report.summary.overall = 'unhealthy';
      } else if (issues.length > 0 || healthStatus.summary.degradedChecks > 0) {
        report.summary.overall = 'degraded';
      } else {
        report.summary.overall = 'healthy';
      }

      report.duration = Date.now() - startTime;

      // Store report
      this.reports.push(report);

      // Log critical issues
      if (report.summary.overall === 'unhealthy') {
        console.error('🚨 CRITICAL MONITORING ISSUES:', {
          timestamp: new Date(report.timestamp).toISOString(),
          issues: report.summary.issues,
          recommendations: report.summary.recommendations,
        });
      } else if (report.summary.overall === 'degraded') {
        console.warn('⚠️ MONITORING ISSUES DETECTED:', {
          timestamp: new Date(report.timestamp).toISOString(),
          issues: report.summary.issues,
          recommendations: report.summary.recommendations,
        });
      }

      console.log('📊 Monitoring cycle completed:', {
        duration: report.duration,
        healthChecks: report.healthChecks,
        errors: report.errorsTracked,
        alerts: report.alertsTriggered,
        status: report.summary.overall,
      });
    } catch (error) {
      console.error('Background monitoring cycle failed:', error);
      errorTracker.trackError(error, {
        component: 'background-monitor',
        action: 'monitoring-cycle',
      });
    }
  }

  private async checkAlerts(): Promise<void> {
    try {
      const events = await alertingSystem.checkRules();

      if (events.length > 0) {
        console.log(`🚨 ${events.length} alert(s) triggered:`, {
          alerts: events.map((e) => ({
            rule: e.ruleName,
            severity: e.severity,
            message: e.message,
          })),
        });

        // Track alert events
        for (const event of events) {
          errorTracker.trackError(`Alert triggered: ${event.message}`, {
            component: 'background-monitor',
            action: 'alert-check',
            alertRule: event.ruleName,
            severity: event.severity,
          });
        }
      }
    } catch (error) {
      console.error('Alert checking failed:', error);
      errorTracker.trackError(error, {
        component: 'background-monitor',
        action: 'alert-check',
      });
    }
  }

  private async checkHealth(): Promise<void> {
    try {
      const healthStatus = await uptimeMonitor.getHealthStatus();

      if (healthStatus.overall !== 'healthy') {
        console.warn(`🏥 Health check status: ${healthStatus.overall}`, {
          healthy: healthStatus.summary.healthyChecks,
          degraded: healthStatus.summary.degradedChecks,
          unhealthy: healthStatus.summary.unhealthyChecks,
          availability: healthStatus.summary.availability,
        });

        // Track health check issues
        errorTracker.trackError(`Health check status: ${healthStatus.overall}`, {
          component: 'background-monitor',
          action: 'health-check',
          healthyChecks: healthStatus.summary.healthyChecks,
          degradedChecks: healthStatus.summary.degradedChecks,
          unhealthyChecks: healthStatus.summary.unhealthyChecks,
          availability: healthStatus.summary.availability,
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      errorTracker.trackError(error, {
        component: 'background-monitor',
        action: 'health-check',
      });
    }
  }

  private cleanup(): void {
    try {
      // Clean up old reports
      const cutoff = Date.now() - this.config.retentionPeriod;
      this.reports = this.reports.filter((report) => report.timestamp > cutoff);

      // Limit reports
      if (this.reports.length > this.config.maxEvents) {
        this.reports = this.reports
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.config.maxEvents);
      }

      // Clean up error tracker
      errorTracker.clearOldErrors();

      // Clean up uptime monitor
      uptimeMonitor.clearOldErrors();

      console.log('🧹 Background monitoring cleanup completed');
    } catch (error) {
      console.error('Background monitoring cleanup failed:', error);
      errorTracker.trackError(error, {
        component: 'background-monitor',
        action: 'cleanup',
      });
    }
  }

  /**
   * Get system resource usage
   */
  getResourceUsage(): {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    uptime: number;
    timestamp: number;
  } {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  /**
   * Export monitoring data for external services
   */
  exportData(): {
    reports: MonitoringReport[];
    summary: {
      totalReports: number;
      averageResponseTime: number;
      errorRate: number;
      uptime: number;
      lastReport: MonitoringReport | null;
    };
    status: {
      isRunning: boolean;
      config: MonitoringConfig;
      resourceUsage: ReturnType<typeof this.getResourceUsage>;
    };
  } {
    return {
      reports: this.reports,
      summary: {
        totalReports: this.reports.length,
        ...this.getPerformanceSummary(),
      },
      status: {
        isRunning: this.isRunning,
        config: this.config,
        resourceUsage: this.getResourceUsage(),
      },
    };
  }
}

// Global background monitor instance
export const backgroundMonitor = new BackgroundMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  backgroundMonitor.start();
}

// Utility functions
export function startBackgroundMonitoring(): void {
  backgroundMonitor.start();
}

export function stopBackgroundMonitoring(): void {
  backgroundMonitor.stop();
}

export function getMonitoringStatus() {
  return backgroundMonitor.getStatus();
}

export function getMonitoringReports(limit?: number) {
  return backgroundMonitor.getReports(limit);
}

export default backgroundMonitor;
