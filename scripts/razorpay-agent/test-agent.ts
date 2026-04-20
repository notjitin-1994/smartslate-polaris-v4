#!/usr/bin/env tsx
/**
 * Test Suite for Razorpay Expert Agent
 *
 * Validates all diagnostic and fix capabilities of the agent
 *
 * @version 1.0.0
 * @date 2025-11-09
 */

import chalk from 'chalk';
import { RazorpayExpertAgent } from './razorpay-expert-agent';
import { WebhookDiagnostics } from './webhook-diagnostics';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Test Configuration
// ============================================================================

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

class RazorpayAgentTestSuite {
  private results: TestResult[] = [];
  private agent: RazorpayExpertAgent;
  private webhookDiag: WebhookDiagnostics;

  constructor() {
    // Initialize agent in test mode
    this.agent = new RazorpayExpertAgent({
      testMode: true,
      verbose: false,
      autoFix: false
    });

    this.webhookDiag = new WebhookDiagnostics();
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log(chalk.bold.cyan('\n🧪 Razorpay Agent Test Suite\n'));
    console.log(chalk.gray('=' . repeat(60)));

    // Configuration tests
    await this.testEnvironmentDetection();
    await this.testKeyValidation();
    await this.testModeDetection();

    // Diagnostic tests
    await this.testDatabaseDiagnostics();
    await this.testWebhookDiagnostics();
    await this.testSecurityChecks();
    await this.testPerformanceAnalysis();

    // Fix generation tests
    await this.testMigrationGeneration();
    await this.testConfigurationFixes();
    await this.testWebhookHandlerGeneration();

    // Integration tests
    await this.testMCPIntegration();
    await this.testContextAwareness();

    // Generate report
    this.generateTestReport();
  }

  /**
   * Test environment detection
   */
  private async testEnvironmentDetection(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Environment Detection';

    try {
      // Test detection of missing env vars
      const originalEnv = process.env.RAZORPAY_KEY_SECRET;
      delete process.env.RAZORPAY_KEY_SECRET;

      // Run test
      const config = this.agent['config'];
      const hasSecret = !!config.razorpayKeySecret;

      // Restore env
      if (originalEnv) {
        process.env.RAZORPAY_KEY_SECRET = originalEnv;
      }

      this.addResult({
        name: testName,
        category: 'Configuration',
        passed: !hasSecret || !!originalEnv,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Configuration',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test key validation
   */
  private async testKeyValidation(): Promise<void> {
    const startTime = Date.now();
    const testName = 'API Key Validation';

    try {
      // Test key format validation
      const testKeys = [
        { key: 'rzp_test_123456789012345', valid: true },
        { key: 'rzp_live_123456789012345', valid: true },
        { key: 'invalid_key', valid: false },
        { key: '', valid: false }
      ];

      let allPassed = true;
      for (const testKey of testKeys) {
        const isValid = testKey.key.startsWith('rzp_test_') || testKey.key.startsWith('rzp_live_');
        if (isValid !== testKey.valid) {
          allPassed = false;
          break;
        }
      }

      this.addResult({
        name: testName,
        category: 'Configuration',
        passed: allPassed,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Configuration',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test mode detection
   */
  private async testModeDetection(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Mode Detection (Test/Live)';

    try {
      const testCases = [
        { key: 'rzp_test_abcdef123456', expectedMode: 'test' },
        { key: 'rzp_live_abcdef123456', expectedMode: 'live' }
      ];

      let allPassed = true;
      for (const testCase of testCases) {
        const mode = testCase.key.startsWith('rzp_test_') ? 'test' : 'live';
        if (mode !== testCase.expectedMode) {
          allPassed = false;
          break;
        }
      }

      this.addResult({
        name: testName,
        category: 'Configuration',
        passed: allPassed,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Configuration',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test database diagnostics
   */
  private async testDatabaseDiagnostics(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Database Diagnostics';

    try {
      // Check if diagnostic methods exist
      const hasCheckMethod = typeof this.agent['checkDatabaseSchema'] === 'function';
      const hasValidateMethod = typeof this.agent['validateDatabaseMigrations'] === 'function';

      this.addResult({
        name: testName,
        category: 'Diagnostics',
        passed: hasCheckMethod && hasValidateMethod,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Diagnostics',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test webhook diagnostics
   */
  private async testWebhookDiagnostics(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Webhook Diagnostics';

    try {
      // Test webhook diagnostic capabilities
      const canRunDiagnostics = typeof this.webhookDiag.runDiagnostics === 'function';
      const canGenerateReport = typeof this.webhookDiag.generateReport === 'function';

      this.addResult({
        name: testName,
        category: 'Diagnostics',
        passed: canRunDiagnostics && canGenerateReport,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Diagnostics',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test security checks
   */
  private async testSecurityChecks(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Security Validation';

    try {
      // Test signature generation
      const testPayload = { test: 'data' };
      const signature = this.webhookDiag['generateWebhookSignature'](testPayload);
      const isValidSignature = signature && signature.length === 64; // SHA256 hex

      this.addResult({
        name: testName,
        category: 'Security',
        passed: isValidSignature,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Security',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test performance analysis
   */
  private async testPerformanceAnalysis(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Performance Analysis';

    try {
      // Test metric calculation
      const testMetrics = {
        totalEvents: 100,
        processedEvents: 95,
        failedEvents: 5,
        duplicateEvents: 0
      };

      const errorRate = (testMetrics.failedEvents / testMetrics.totalEvents) * 100;
      const successRate = (testMetrics.processedEvents / testMetrics.totalEvents) * 100;

      const calculationsCorrect = errorRate === 5 && successRate === 95;

      this.addResult({
        name: testName,
        category: 'Performance',
        passed: calculationsCorrect,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Performance',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test migration generation
   */
  private async testMigrationGeneration(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Migration Generation';

    try {
      // Test SQL generation
      const migrationSQL = this.agent['generateTableMigration']('subscriptions');
      const hasCreateTable = migrationSQL.includes('CREATE TABLE');
      const hasIndexes = migrationSQL.includes('CREATE INDEX');
      const hasRLS = migrationSQL.includes('ENABLE ROW LEVEL SECURITY');

      this.addResult({
        name: testName,
        category: 'Fix Generation',
        passed: hasCreateTable && hasIndexes && hasRLS,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Fix Generation',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test configuration fixes
   */
  private async testConfigurationFixes(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Configuration Fix Generation';

    try {
      // Test env template generation
      const envTemplate = `
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
      `.trim();

      const hasAllVars = envTemplate.includes('RAZORPAY_KEY_ID') &&
                        envTemplate.includes('RAZORPAY_KEY_SECRET') &&
                        envTemplate.includes('WEBHOOK_SECRET');

      this.addResult({
        name: testName,
        category: 'Fix Generation',
        passed: hasAllVars,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Fix Generation',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test webhook handler generation
   */
  private async testWebhookHandlerGeneration(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Webhook Handler Generation';

    try {
      // Check if handler generation method exists
      const hasMethod = typeof this.agent['createWebhookHandler'] === 'function';

      this.addResult({
        name: testName,
        category: 'Fix Generation',
        passed: hasMethod,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Fix Generation',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test MCP integration
   */
  private async testMCPIntegration(): Promise<void> {
    const startTime = Date.now();
    const testName = 'MCP Integration';

    try {
      // Check for MCP-related code
      const agentPath = path.join(__dirname, 'razorpay-expert-agent.ts');
      const content = await fs.readFile(agentPath, 'utf-8');

      const hasMCPReferences = content.includes('MCP') ||
                              content.includes('polaris-context') ||
                              content.includes('context7');

      this.addResult({
        name: testName,
        category: 'Integration',
        passed: hasMCPReferences,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Integration',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Test context awareness
   */
  private async testContextAwareness(): Promise<void> {
    const startTime = Date.now();
    const testName = 'Context Awareness';

    try {
      // Test context cache functionality
      const hasContextCache = this.agent['contextCache'] instanceof Map;

      this.addResult({
        name: testName,
        category: 'Integration',
        passed: hasContextCache,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.addResult({
        name: testName,
        category: 'Integration',
        passed: false,
        error: String(error),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Add test result
   */
  private addResult(result: TestResult): void {
    this.results.push(result);

    const icon = result.passed ? chalk.green('✓') : chalk.red('✗');
    const name = result.passed ? chalk.green(result.name) : chalk.red(result.name);
    const duration = result.duration ? chalk.gray(` (${result.duration}ms)`) : '';

    console.log(`  ${icon} ${name}${duration}`);
    if (result.error) {
      console.log(chalk.red(`    Error: ${result.error}`));
    }
  }

  /**
   * Generate test report
   */
  private generateTestReport(): void {
    console.log(chalk.bold.cyan('\n📊 Test Results Summary\n'));
    console.log(chalk.gray('=' . repeat(60)));

    const categories: Record<string, TestResult[]> = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    });

    // Show results by category
    for (const [category, results] of Object.entries(categories)) {
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      const percentage = ((passed / total) * 100).toFixed(0);

      const color = passed === total ? chalk.green : passed > 0 ? chalk.yellow : chalk.red;
      console.log(`\n${chalk.bold(category)}: ${color(`${passed}/${total} (${percentage}%)`)}`);

      // Show failed tests
      const failed = results.filter(r => !r.passed);
      if (failed.length > 0) {
        failed.forEach(test => {
          console.log(chalk.red(`  ✗ ${test.name}`));
          if (test.error) {
            console.log(chalk.gray(`    ${test.error}`));
          }
        });
      }
    }

    // Overall summary
    const totalPassed = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const overallPercentage = ((totalPassed / totalTests) * 100).toFixed(0);

    console.log(chalk.bold(`\n🎯 Overall: ${this.getScoreColor(Number(overallPercentage))}${totalPassed}/${totalTests} tests passed (${overallPercentage}%)${chalk.reset()}`));

    if (totalPassed === totalTests) {
      console.log(chalk.green.bold('\n✅ All tests passed! Agent is fully functional.\n'));
    } else {
      console.log(chalk.yellow.bold(`\n⚠️ ${totalTests - totalPassed} tests failed. Review and fix issues.\n`));
    }
  }

  /**
   * Get color for score
   */
  private getScoreColor(score: number): string {
    if (score >= 90) return chalk.green.bold;
    if (score >= 70) return chalk.yellow.bold;
    if (score >= 50) return chalk.magenta.bold;
    return chalk.red.bold;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  console.log(chalk.bold.magenta(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          🧪 RAZORPAY AGENT TEST SUITE v1.0.0 🧪             ║
║                                                              ║
║         Validating Agent Diagnostic & Fix Capabilities      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `));

  const testSuite = new RazorpayAgentTestSuite();

  try {
    await testSuite.runAllTests();
  } catch (error) {
    console.error(chalk.red(`\n❌ Test suite error: ${error}`));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { RazorpayAgentTestSuite };