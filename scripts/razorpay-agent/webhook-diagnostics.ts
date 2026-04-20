#!/usr/bin/env tsx
/**
 * Razorpay Webhook Diagnostics Tool
 *
 * Specialized tool for diagnosing and fixing webhook-related issues
 * in the Razorpay integration.
 *
 * @version 1.0.0
 * @date 2025-11-09
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface WebhookDiagnosticResult {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  issues: WebhookIssue[];
  metrics: WebhookMetrics;
  recommendations: string[];
}

interface WebhookIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
  solution?: string;
  affectedComponent?: string;
}

interface WebhookMetrics {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  duplicateEvents: number;
  averageProcessingTime?: number;
  lastEventTimestamp?: string;
  errorRate?: number;
}

interface WebhookEventSimulation {
  eventType: string;
  payload: any;
  expectedBehavior: string;
  testResult?: 'pass' | 'fail' | 'skip';
  error?: string;
}

// ============================================================================
// Webhook Diagnostics Class
// ============================================================================

export class WebhookDiagnostics {
  private supabase: any;
  private webhookSecret: string;
  private webhookUrl: string;
  private issues: WebhookIssue[] = [];
  private metrics: WebhookMetrics = {
    totalEvents: 0,
    processedEvents: 0,
    failedEvents: 0,
    duplicateEvents: 0
  };

  constructor(config: {
    supabaseUrl?: string;
    supabaseKey?: string;
    webhookSecret?: string;
    webhookUrl?: string;
  } = {}) {
    this.webhookSecret = config.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || '';
    this.webhookUrl = config.webhookUrl || 'http://localhost:3000/api/webhooks/razorpay';

    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }
  }

  /**
   * Run complete webhook diagnostics
   */
  async runDiagnostics(): Promise<WebhookDiagnosticResult> {
    console.log(chalk.bold.cyan('\n🔍 Webhook Diagnostics Starting...\n'));

    // 1. Check webhook configuration
    await this.checkWebhookConfiguration();

    // 2. Analyze webhook handler implementation
    await this.analyzeWebhookHandler();

    // 3. Check database schema and events
    await this.checkWebhookDatabase();

    // 4. Validate security implementation
    await this.validateWebhookSecurity();

    // 5. Test idempotency
    await this.testIdempotency();

    // 6. Check error handling
    await this.checkErrorHandling();

    // 7. Analyze performance
    await this.analyzeWebhookPerformance();

    // 8. Test webhook endpoint
    await this.testWebhookEndpoint();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Determine overall status
    const status = this.determineOverallStatus();

    return {
      endpoint: this.webhookUrl,
      status,
      issues: this.issues,
      metrics: this.metrics,
      recommendations
    };
  }

  /**
   * Check webhook configuration
   */
  private async checkWebhookConfiguration(): Promise<void> {
    console.log(chalk.blue('📋 Checking Webhook Configuration...'));

    // Check webhook secret
    if (!this.webhookSecret) {
      this.addIssue({
        severity: 'critical',
        category: 'Configuration',
        message: 'Webhook secret not configured',
        solution: 'Set RAZORPAY_WEBHOOK_SECRET environment variable',
        affectedComponent: 'Environment'
      });
    } else if (this.webhookSecret.length < 20) {
      this.addIssue({
        severity: 'high',
        category: 'Configuration',
        message: 'Webhook secret appears to be invalid',
        solution: 'Get the correct webhook secret from Razorpay Dashboard',
        affectedComponent: 'Environment'
      });
    }

    // Check webhook URL format
    if (!this.webhookUrl.includes('/api/webhooks/razorpay')) {
      this.addIssue({
        severity: 'medium',
        category: 'Configuration',
        message: 'Non-standard webhook URL path',
        solution: 'Consider using /api/webhooks/razorpay for consistency',
        affectedComponent: 'Routing'
      });
    }

    console.log(chalk.green('  ✓ Configuration check complete'));
  }

  /**
   * Analyze webhook handler implementation
   */
  private async analyzeWebhookHandler(): Promise<void> {
    console.log(chalk.blue('📨 Analyzing Webhook Handler...'));

    const handlerPath = path.resolve(
      process.cwd(),
      '../../frontend/app/api/webhooks/razorpay/route.ts'
    );

    try {
      const exists = await fs.access(handlerPath).then(() => true).catch(() => false);

      if (!exists) {
        this.addIssue({
          severity: 'critical',
          category: 'Handler',
          message: 'Webhook handler file not found',
          solution: 'Create webhook handler at app/api/webhooks/razorpay/route.ts',
          affectedComponent: 'API Route'
        });
        return;
      }

      const content = await fs.readFile(handlerPath, 'utf-8');

      // Check for essential components
      const checks = [
        {
          pattern: /validateWebhookSecurity|verifySignature/,
          missing: 'Signature validation not implemented',
          severity: 'critical' as const
        },
        {
          pattern: /checkEventProcessed|idempotency/i,
          missing: 'Idempotency check not implemented',
          severity: 'high' as const
        },
        {
          pattern: /try.*catch/s,
          missing: 'Error handling not implemented',
          severity: 'high' as const
        },
        {
          pattern: /log|logger/i,
          missing: 'Logging not implemented',
          severity: 'medium' as const
        },
        {
          pattern: /rateLimitMiddleware|rateLimit/,
          missing: 'Rate limiting not implemented',
          severity: 'medium' as const
        }
      ];

      for (const check of checks) {
        if (!check.pattern.test(content)) {
          this.addIssue({
            severity: check.severity,
            category: 'Handler',
            message: check.missing,
            solution: `Add ${check.missing.toLowerCase().replace('not implemented', '')} to webhook handler`,
            affectedComponent: 'Webhook Handler'
          });
        }
      }

      // Check for event routing
      const eventTypes = [
        'payment.captured',
        'payment.failed',
        'subscription.activated',
        'subscription.cancelled'
      ];

      const handledEvents = eventTypes.filter(event =>
        content.includes(event) || content.includes(event.replace('.', '_'))
      );

      if (handledEvents.length < eventTypes.length) {
        const missingEvents = eventTypes.filter(e => !handledEvents.includes(e));
        this.addIssue({
          severity: 'medium',
          category: 'Handler',
          message: `Not all critical events are handled: ${missingEvents.join(', ')}`,
          solution: 'Implement handlers for all critical Razorpay events',
          affectedComponent: 'Event Routing'
        });
      }

      console.log(chalk.green('  ✓ Handler analysis complete'));
    } catch (error) {
      console.log(chalk.red(`  ✗ Error analyzing handler: ${error}`));
    }
  }

  /**
   * Check webhook database
   */
  private async checkWebhookDatabase(): Promise<void> {
    console.log(chalk.blue('🗄️ Checking Webhook Database...'));

    if (!this.supabase) {
      console.log(chalk.yellow('  ⚠ Supabase not configured - skipping database checks'));
      return;
    }

    try {
      // Check webhook events table
      const { data, error, count } = await this.supabase
        .from('razorpay_webhook_events')
        .select('*', { count: 'exact', head: false })
        .limit(100)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116') {
          this.addIssue({
            severity: 'critical',
            category: 'Database',
            message: 'Webhook events table does not exist',
            solution: 'Run migration to create razorpay_webhook_events table',
            affectedComponent: 'Database Schema'
          });
        } else {
          this.addIssue({
            severity: 'high',
            category: 'Database',
            message: `Database error: ${error.message}`,
            solution: 'Check database connection and permissions',
            affectedComponent: 'Database'
          });
        }
        return;
      }

      // Analyze events
      if (data) {
        this.metrics.totalEvents = count || 0;

        const processedEvents = data.filter((e: any) => e.processing_status === 'processed');
        const failedEvents = data.filter((e: any) => e.processing_status === 'failed');
        const duplicateEvents = data.filter((e: any) => e.processing_status === 'duplicate');

        this.metrics.processedEvents = processedEvents.length;
        this.metrics.failedEvents = failedEvents.length;
        this.metrics.duplicateEvents = duplicateEvents.length;

        if (data.length > 0) {
          this.metrics.lastEventTimestamp = data[0].created_at;
        }

        // Calculate error rate
        if (this.metrics.totalEvents > 0) {
          this.metrics.errorRate = (this.metrics.failedEvents / this.metrics.totalEvents) * 100;

          if (this.metrics.errorRate > 10) {
            this.addIssue({
              severity: 'high',
              category: 'Performance',
              message: `High error rate: ${this.metrics.errorRate.toFixed(2)}%`,
              solution: 'Investigate failing webhook events and fix underlying issues',
              affectedComponent: 'Event Processing'
            });
          }
        }

        // Check for stuck events
        const pendingEvents = data.filter((e: any) =>
          e.processing_status === 'pending' &&
          new Date(e.created_at).getTime() < Date.now() - 3600000 // Older than 1 hour
        );

        if (pendingEvents.length > 0) {
          this.addIssue({
            severity: 'medium',
            category: 'Processing',
            message: `${pendingEvents.length} webhook events stuck in pending state`,
            solution: 'Implement retry mechanism or manual processing for stuck events',
            affectedComponent: 'Event Processing'
          });
        }
      }

      console.log(chalk.green('  ✓ Database check complete'));
      console.log(chalk.gray(`    Total events: ${this.metrics.totalEvents}`));
      console.log(chalk.gray(`    Processed: ${this.metrics.processedEvents}`));
      console.log(chalk.gray(`    Failed: ${this.metrics.failedEvents}`));
      console.log(chalk.gray(`    Duplicates: ${this.metrics.duplicateEvents}`));
    } catch (error) {
      console.log(chalk.red(`  ✗ Database check error: ${error}`));
    }
  }

  /**
   * Validate webhook security
   */
  private async validateWebhookSecurity(): Promise<void> {
    console.log(chalk.blue('🔒 Validating Webhook Security...'));

    // Check signature validation implementation
    const securityFile = path.resolve(
      process.cwd(),
      '../../frontend/lib/razorpay/webhookSecurity.ts'
    );

    try {
      const exists = await fs.access(securityFile).then(() => true).catch(() => false);

      if (!exists) {
        this.addIssue({
          severity: 'critical',
          category: 'Security',
          message: 'Webhook security module not found',
          solution: 'Create webhookSecurity.ts with signature validation',
          affectedComponent: 'Security Module'
        });
      } else {
        const content = await fs.readFile(securityFile, 'utf-8');

        // Check for HMAC signature validation
        if (!content.includes('createHmac') && !content.includes('crypto')) {
          this.addIssue({
            severity: 'critical',
            category: 'Security',
            message: 'HMAC signature validation not implemented',
            solution: 'Implement HMAC-SHA256 signature validation',
            affectedComponent: 'Security Module'
          });
        }

        // Check for timestamp validation
        if (!content.includes('timestamp')) {
          this.addIssue({
            severity: 'medium',
            category: 'Security',
            message: 'Timestamp validation not implemented',
            solution: 'Add timestamp validation to prevent replay attacks',
            affectedComponent: 'Security Module'
          });
        }
      }

      console.log(chalk.green('  ✓ Security validation complete'));
    } catch (error) {
      console.log(chalk.red(`  ✗ Security validation error: ${error}`));
    }
  }

  /**
   * Test idempotency
   */
  private async testIdempotency(): Promise<void> {
    console.log(chalk.blue('🔄 Testing Idempotency...'));

    const idempotencyFile = path.resolve(
      process.cwd(),
      '../../frontend/lib/razorpay/idempotency.ts'
    );

    try {
      const exists = await fs.access(idempotencyFile).then(() => true).catch(() => false);

      if (!exists) {
        this.addIssue({
          severity: 'high',
          category: 'Idempotency',
          message: 'Idempotency module not found',
          solution: 'Create idempotency.ts to handle duplicate events',
          affectedComponent: 'Idempotency Module'
        });
      } else {
        const content = await fs.readFile(idempotencyFile, 'utf-8');

        // Check for essential idempotency components
        const components = [
          { pattern: /checkEventProcessed/, name: 'Event checking' },
          { pattern: /recordEvent/, name: 'Event recording' },
          { pattern: /markEventProcessed/, name: 'Event marking' }
        ];

        for (const component of components) {
          if (!component.pattern.test(content)) {
            this.addIssue({
              severity: 'high',
              category: 'Idempotency',
              message: `${component.name} not implemented`,
              solution: `Implement ${component.name.toLowerCase()} in idempotency module`,
              affectedComponent: 'Idempotency Module'
            });
          }
        }
      }

      // Check duplicate rate
      if (this.metrics.totalEvents > 0) {
        const duplicateRate = (this.metrics.duplicateEvents / this.metrics.totalEvents) * 100;
        if (duplicateRate > 5) {
          this.addIssue({
            severity: 'medium',
            category: 'Idempotency',
            message: `High duplicate rate: ${duplicateRate.toFixed(2)}%`,
            solution: 'Review webhook configuration in Razorpay Dashboard',
            affectedComponent: 'Webhook Configuration'
          });
        }
      }

      console.log(chalk.green('  ✓ Idempotency test complete'));
    } catch (error) {
      console.log(chalk.red(`  ✗ Idempotency test error: ${error}`));
    }
  }

  /**
   * Check error handling
   */
  private async checkErrorHandling(): Promise<void> {
    console.log(chalk.blue('⚠️ Checking Error Handling...'));

    const errorHandlingFile = path.resolve(
      process.cwd(),
      '../../frontend/lib/razorpay/errorHandling.ts'
    );

    try {
      const exists = await fs.access(errorHandlingFile).then(() => true).catch(() => false);

      if (!exists) {
        this.addIssue({
          severity: 'medium',
          category: 'Error Handling',
          message: 'Error handling module not found',
          solution: 'Create errorHandling.ts for centralized error management',
          affectedComponent: 'Error Module'
        });
      } else {
        const content = await fs.readFile(errorHandlingFile, 'utf-8');

        // Check for retry logic
        if (!content.includes('retry') && !content.includes('exponentialBackoff')) {
          this.addIssue({
            severity: 'medium',
            category: 'Error Handling',
            message: 'Retry logic not implemented',
            solution: 'Add exponential backoff retry for transient failures',
            affectedComponent: 'Error Module'
          });
        }

        // Check for error classification
        if (!content.includes('isRetryable') && !content.includes('shouldRetry')) {
          this.addIssue({
            severity: 'low',
            category: 'Error Handling',
            message: 'Error classification not implemented',
            solution: 'Add logic to classify retryable vs non-retryable errors',
            affectedComponent: 'Error Module'
          });
        }
      }

      console.log(chalk.green('  ✓ Error handling check complete'));
    } catch (error) {
      console.log(chalk.red(`  ✗ Error handling check error: ${error}`));
    }
  }

  /**
   * Analyze webhook performance
   */
  private async analyzeWebhookPerformance(): Promise<void> {
    console.log(chalk.blue('⚡ Analyzing Webhook Performance...'));

    if (!this.supabase) {
      console.log(chalk.yellow('  ⚠ Supabase not configured - skipping performance analysis'));
      return;
    }

    try {
      // Get recent events with processing times
      const { data, error } = await this.supabase
        .from('razorpay_webhook_events')
        .select('created_at, processed_at, processing_status')
        .eq('processing_status', 'processed')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        // Calculate average processing time
        const processingTimes = data
          .filter((e: any) => e.processed_at)
          .map((e: any) => {
            const created = new Date(e.created_at).getTime();
            const processed = new Date(e.processed_at).getTime();
            return processed - created;
          });

        if (processingTimes.length > 0) {
          const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
          this.metrics.averageProcessingTime = avgTime;

          if (avgTime > 5000) { // More than 5 seconds
            this.addIssue({
              severity: 'medium',
              category: 'Performance',
              message: `Slow average processing time: ${(avgTime / 1000).toFixed(2)}s`,
              solution: 'Optimize webhook processing logic and database queries',
              affectedComponent: 'Processing Pipeline'
            });
          }

          // Check for outliers
          const slowEvents = processingTimes.filter(t => t > 10000).length;
          if (slowEvents > processingTimes.length * 0.1) { // More than 10% are slow
            this.addIssue({
              severity: 'medium',
              category: 'Performance',
              message: `${slowEvents} events took over 10 seconds to process`,
              solution: 'Investigate slow queries and implement caching',
              affectedComponent: 'Processing Pipeline'
            });
          }
        }
      }

      console.log(chalk.green('  ✓ Performance analysis complete'));
      if (this.metrics.averageProcessingTime) {
        console.log(chalk.gray(`    Average processing time: ${(this.metrics.averageProcessingTime / 1000).toFixed(2)}s`));
      }
    } catch (error) {
      console.log(chalk.red(`  ✗ Performance analysis error: ${error}`));
    }
  }

  /**
   * Test webhook endpoint
   */
  private async testWebhookEndpoint(): Promise<void> {
    console.log(chalk.blue('🎯 Testing Webhook Endpoint...'));

    try {
      // Test GET request (health check)
      const getResponse = await axios.get(this.webhookUrl, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (getResponse.status === 200) {
        console.log(chalk.green('  ✓ Health check endpoint working'));
      } else if (getResponse.status === 405) {
        console.log(chalk.yellow('  ⚠ No GET handler (POST only)'));
      } else {
        this.addIssue({
          severity: 'medium',
          category: 'Endpoint',
          message: `Unexpected health check response: ${getResponse.status}`,
          solution: 'Implement GET handler for health checks',
          affectedComponent: 'API Route'
        });
      }

      // Simulate webhook POST
      if (this.webhookSecret) {
        const testPayload = this.createTestWebhookPayload();
        const signature = this.generateWebhookSignature(testPayload);

        const postResponse = await axios.post(
          this.webhookUrl,
          testPayload,
          {
            headers: {
              'X-Razorpay-Signature': signature,
              'X-Razorpay-Event-Id': 'test_event_' + Date.now(),
              'Content-Type': 'application/json'
            },
            timeout: 5000,
            validateStatus: () => true
          }
        );

        if (postResponse.status === 200) {
          console.log(chalk.green('  ✓ Webhook endpoint accepts valid payloads'));
        } else if (postResponse.status === 401) {
          console.log(chalk.green('  ✓ Webhook endpoint rejects invalid signatures'));
        } else {
          this.addIssue({
            severity: 'high',
            category: 'Endpoint',
            message: `Unexpected webhook response: ${postResponse.status}`,
            solution: 'Check webhook handler implementation',
            affectedComponent: 'Webhook Handler'
          });
        }
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        this.addIssue({
          severity: 'low',
          category: 'Endpoint',
          message: 'Development server not running',
          solution: 'Start the development server to test webhook endpoint',
          affectedComponent: 'Development Environment'
        });
      } else {
        this.addIssue({
          severity: 'medium',
          category: 'Endpoint',
          message: `Endpoint test failed: ${error.message}`,
          solution: 'Check webhook endpoint configuration',
          affectedComponent: 'API Route'
        });
      }
    }

    console.log(chalk.green('  ✓ Endpoint test complete'));
  }

  /**
   * Create test webhook payload
   */
  private createTestWebhookPayload(): any {
    return {
      entity: 'event',
      account_id: 'acc_test_' + Date.now(),
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_test_' + Date.now(),
            amount: 10000,
            currency: 'INR',
            status: 'captured',
            method: 'card',
            captured: true,
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      },
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Generate webhook signature
   */
  private generateWebhookSignature(payload: any): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Critical issues recommendations
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('🔴 Address critical issues immediately to ensure webhook functionality');
    }

    // Performance recommendations
    if (this.metrics.errorRate && this.metrics.errorRate > 5) {
      recommendations.push('⚡ Investigate and fix high error rate in webhook processing');
    }

    if (this.metrics.averageProcessingTime && this.metrics.averageProcessingTime > 3000) {
      recommendations.push('⚡ Optimize webhook processing to reduce latency');
    }

    // Security recommendations
    const securityIssues = this.issues.filter(i => i.category === 'Security');
    if (securityIssues.length > 0) {
      recommendations.push('🔒 Strengthen webhook security implementation');
    }

    // Database recommendations
    if (this.metrics.totalEvents > 10000) {
      recommendations.push('🗄️ Consider archiving old webhook events to maintain performance');
    }

    // General recommendations
    if (this.issues.length === 0) {
      recommendations.push('✅ Webhook implementation is healthy - continue monitoring');
    } else if (this.issues.length < 3) {
      recommendations.push('👍 Address minor issues to achieve optimal webhook performance');
    }

    // Add monitoring recommendation
    if (!this.metrics.lastEventTimestamp) {
      recommendations.push('📊 Implement webhook monitoring and alerting');
    }

    return recommendations;
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(): 'healthy' | 'degraded' | 'critical' | 'unknown' {
    const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
    const highCount = this.issues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount > 2) return 'critical';
    if (highCount > 0 || this.issues.length > 5) return 'degraded';
    if (this.issues.length === 0) return 'healthy';

    return 'degraded';
  }

  /**
   * Add issue to list
   */
  private addIssue(issue: WebhookIssue): void {
    this.issues.push(issue);
  }

  /**
   * Generate detailed report
   */
  generateReport(result: WebhookDiagnosticResult): void {
    console.log(chalk.bold.cyan('\n📊 Webhook Diagnostics Report\n'));
    console.log(chalk.gray('=' . repeat(60)));

    // Overall status
    const statusColors = {
      healthy: chalk.green,
      degraded: chalk.yellow,
      critical: chalk.red,
      unknown: chalk.gray
    };

    console.log(`\n${chalk.bold('Overall Status:')} ${statusColors[result.status](result.status.toUpperCase())}`);
    console.log(`${chalk.bold('Endpoint:')} ${result.endpoint}`);

    // Metrics
    console.log(chalk.bold('\nMetrics:'));
    console.log(`  Total Events: ${result.metrics.totalEvents}`);
    console.log(`  Processed: ${result.metrics.processedEvents}`);
    console.log(`  Failed: ${result.metrics.failedEvents} (${result.metrics.errorRate?.toFixed(2) || 0}%)`);
    console.log(`  Duplicates: ${result.metrics.duplicateEvents}`);
    if (result.metrics.averageProcessingTime) {
      console.log(`  Avg Processing Time: ${(result.metrics.averageProcessingTime / 1000).toFixed(2)}s`);
    }
    if (result.metrics.lastEventTimestamp) {
      console.log(`  Last Event: ${new Date(result.metrics.lastEventTimestamp).toLocaleString()}`);
    }

    // Issues
    if (result.issues.length > 0) {
      console.log(chalk.bold('\nIssues Found:'));

      const groupedIssues: Record<string, WebhookIssue[]> = {};
      result.issues.forEach(issue => {
        if (!groupedIssues[issue.category]) {
          groupedIssues[issue.category] = [];
        }
        groupedIssues[issue.category].push(issue);
      });

      for (const [category, issues] of Object.entries(groupedIssues)) {
        console.log(`\n  ${chalk.cyan(category)}:`);
        issues.forEach(issue => {
          const severityIcon = {
            critical: chalk.red('🔴'),
            high: chalk.yellow('🟠'),
            medium: chalk.blue('🔵'),
            low: chalk.gray('⚪')
          }[issue.severity];

          console.log(`    ${severityIcon} ${issue.message}`);
          if (issue.solution) {
            console.log(chalk.green(`       → ${issue.solution}`));
          }
        });
      }
    } else {
      console.log(chalk.green('\n✅ No issues found!'));
    }

    // Recommendations
    if (result.recommendations.length > 0) {
      console.log(chalk.bold('\nRecommendations:'));
      result.recommendations.forEach(rec => {
        console.log(`  ${rec}`);
      });
    }

    console.log(chalk.gray('\n' + '=' . repeat(60)));
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  console.log(chalk.bold.magenta(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          🔗 WEBHOOK DIAGNOSTICS TOOL v1.0.0 🔗              ║
║                                                              ║
║        Comprehensive Webhook Health Check & Analysis        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `));

  const diagnostics = new WebhookDiagnostics({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  });

  try {
    const result = await diagnostics.runDiagnostics();
    diagnostics.generateReport(result);

    // Exit code based on status
    if (result.status === 'critical') {
      process.exit(1);
    } else if (result.status === 'degraded') {
      process.exit(0);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Diagnostics error: ${error}`));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use as module
export { WebhookDiagnostics, type WebhookDiagnosticResult, type WebhookIssue };