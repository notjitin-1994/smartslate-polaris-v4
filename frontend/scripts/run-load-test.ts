#!/usr/bin/env tsx

/**
 * Load Testing Script
 *
 * Command-line tool for running load tests against the application
 * Supports multiple test scenarios and configurable parameters.
 */

import { program } from 'commander';
import { loadTester, loadTestConfigs } from '../lib/testing/loadTesting';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface TestOptions {
  concurrency?: number;
  duration?: number;
  rampUp?: number;
  endpoint?: string;
  method?: string;
  body?: string;
  thinkTime?: number;
  timeout?: number;
  output?: string;
  preset?: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'http://localhost:3000';

async function runLoadTest(options: TestOptions) {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;

  console.log('🚀 Starting Load Test');
  console.log(`Base URL: ${baseUrl}`);
  console.log('');

  try {
    let config;

    if (options.preset) {
      // Use preset configuration
      const presetConfig = loadTestConfigs[options.preset as keyof typeof loadTestConfigs];
      if (!presetConfig) {
        console.error(`❌ Unknown preset: ${options.preset}`);
        console.log('Available presets:', Object.keys(loadTestConfigs).join(', '));
        process.exit(1);
      }

      config = {
        ...presetConfig,
        endpoint: `${baseUrl}${presetConfig.endpoint}`,
      };

      console.log(`Using preset: ${options.preset}`);
    } else {
      // Use custom configuration
      if (!options.endpoint) {
        console.error('❌ Endpoint is required when not using a preset');
        process.exit(1);
      }

      config = {
        concurrency: options.concurrency || 10,
        duration: options.duration || 60,
        rampUp: options.rampUp || 10,
        endpoint: options.endpoint.startsWith('http')
          ? options.endpoint
          : `${baseUrl}${options.endpoint}`,
        method: (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
        thinkTime: options.thinkTime || 0,
        timeout: options.timeout || 30000,
      };

      if (options.body) {
        try {
          (config as any).body = JSON.parse(options.body);
        } catch (error) {
          console.error('❌ Invalid JSON in body parameter');
          process.exit(1);
        }
      }

      console.log('Using custom configuration');
    }

    // Override config with command line options
    if (options.concurrency) config.concurrency = options.concurrency;
    if (options.duration) config.duration = options.duration;
    if (options.rampUp) config.rampUp = options.rampUp;
    if (options.thinkTime) config.thinkTime = options.thinkTime;
    if (options.timeout) config.timeout = options.timeout;

    console.log('');
    console.log('Test Configuration:');
    console.log(`  Endpoint: ${config.endpoint}`);
    console.log(`  Method: ${config.method}`);
    console.log(`  Concurrency: ${config.concurrency} users`);
    console.log(`  Duration: ${config.duration} seconds`);
    console.log(`  Ramp-up: ${config.rampUp} seconds`);
    console.log(`  Think Time: ${config.thinkTime}ms`);
    console.log(`  Timeout: ${config.timeout}ms`);
    if ((config as any).body) {
      console.log(`  Body: ${JSON.stringify((config as any).body, null, 2)}`);
    }
    console.log('');

    // Run the load test
    console.log('🏃‍♂️ Running load test...');
    const startTime = Date.now();

    const result = await loadTester.runLoadTest(config);

    const endTime = Date.now();
    const totalTestTime = (endTime - startTime) / 1000;

    console.log('');
    console.log('✅ Load test completed successfully!');
    console.log(`Total test time: ${totalTestTime.toFixed(2)} seconds`);
    console.log('');

    // Display results
    displayResults(result);

    // Save results if output file specified
    if (options.output) {
      const report = loadTester.generateReport(result);
      const outputPath = join(process.cwd(), options.output);

      try {
        writeFileSync(outputPath, report, 'utf8');
        console.log(`📄 Report saved to: ${outputPath}`);
      } catch (error) {
        console.error(`❌ Failed to save report: ${error}`);
      }
    }
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

function displayResults(result: any) {
  const { summary, recommendations } = result;

  console.log('📊 Test Results:');
  console.log('  Total Requests:', summary.totalRequests.toLocaleString());
  console.log('  Successful Requests:', summary.successfulRequests.toLocaleString());
  console.log('  Failed Requests:', summary.failedRequests.toLocaleString());
  console.log('  Success Rate:', `${summary.successRate.toFixed(2)}%`);
  console.log('  Requests/Second:', `${summary.requestsPerSecond.toFixed(2)}`);
  console.log('');

  console.log('⏱️  Response Times:');
  console.log('  Average:', `${summary.averageResponseTime.toFixed(2)}ms`);
  console.log('  Min:', `${summary.minResponseTime}ms`);
  console.log('  Max:', `${summary.maxResponseTime}ms`);
  console.log('  P50:', `${summary.p50.toFixed(2)}ms`);
  console.log('  P90:', `${summary.p90.toFixed(2)}ms`);
  console.log('  P95:', `${summary.p95.toFixed(2)}ms`);
  console.log('  P99:', `${summary.p99.toFixed(2)}ms`);
  console.log('');

  if (summary.errors.length > 0) {
    console.log('❌ Errors:');
    summary.errors.forEach((error: any) => {
      console.log(`  ${error.type}: ${error.count} occurrences`);
    });
    console.log('');
  }

  console.log('💡 Recommendations:');
  recommendations.forEach((rec: string, index: number) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
  console.log('');

  // Performance assessment
  console.log('🎯 Performance Assessment:');
  console.log(`  ${getPerformanceAssessment(summary)}`);
}

function getPerformanceAssessment(summary: any): string {
  if (summary.successRate >= 99.9 && summary.p95 <= 500) {
    return '🟢 Excellent - Performance is outstanding and ready for production';
  }

  if (summary.successRate >= 99 && summary.p95 <= 1000) {
    return '🟡 Good - Performance is acceptable with minor room for improvement';
  }

  if (summary.successRate >= 95 && summary.p95 <= 2000) {
    return '🟠 Fair - Performance needs attention before production deployment';
  }

  return '🔴 Poor - Significant performance issues require immediate attention';
}

async function listPresets() {
  console.log('Available Load Test Presets:');
  console.log('');

  for (const [name, config] of Object.entries(loadTestConfigs)) {
    console.log(`📋 ${name}:`);
    console.log(`  Endpoint: ${config.endpoint}`);
    console.log(`  Method: ${config.method}`);
    console.log(`  Concurrency: ${config.concurrency} users`);
    console.log(`  Duration: ${config.duration} seconds`);
    console.log(`  Ramp-up: ${config.rampUp} seconds`);
    console.log(`  Think Time: ${config.thinkTime}ms`);
    if (config.body) {
      console.log(`  Body: ${JSON.stringify(config.body)}`);
    }
    console.log('');
  }
}

async function runQuickHealthCheck(baseUrl: string) {
  console.log('🏥 Running quick health check...');

  try {
    const config = {
      ...loadTestConfigs.healthCheck,
      endpoint: `${baseUrl}${loadTestConfigs.healthCheck.endpoint}`,
      duration: 10, // Short health check
      concurrency: 10,
    };

    const result = await loadTester.runLoadTest(config);

    if (result.summary.successRate >= 95 && result.summary.p95 <= 1000) {
      console.log('✅ Health check passed - Application is responding normally');
    } else {
      console.log('⚠️  Health check warnings detected:');
      console.log(`  Success Rate: ${result.summary.successRate.toFixed(2)}%`);
      console.log(`  P95 Response Time: ${result.summary.p95.toFixed(2)}ms`);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

// Setup CLI program
program
  .name('load-test')
  .description('Load testing tool for Polaris v3 application')
  .version('1.0.0');

program
  .command('run')
  .description('Run a load test')
  .option('-c, --concurrency <number>', 'Number of concurrent users', '10')
  .option('-d, --duration <seconds>', 'Test duration in seconds', '60')
  .option('-r, --ramp-up <seconds>', 'Ramp-up time in seconds', '10')
  .option('-e, --endpoint <url>', 'Target endpoint URL')
  .option('-m, --method <method>', 'HTTP method (GET, POST, PUT, DELETE)', 'GET')
  .option('-b, --body <json>', 'Request body as JSON string')
  .option('-t, --think-time <ms>', 'Think time between requests in milliseconds', '0')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
  .option('-o, --output <file>', 'Save report to file')
  .option('-p, --preset <name>', 'Use predefined test preset')
  .option('--base-url <url>', `Base URL for endpoints (default: ${DEFAULT_BASE_URL})`)
  .action(runLoadTest);

program.command('presets').description('List available test presets').action(listPresets);

program
  .command('health-check')
  .description('Run quick health check')
  .option(
    '--base-url <url>',
    `Base URL for health check (default: ${DEFAULT_BASE_URL})`,
    DEFAULT_BASE_URL
  )
  .action((options) => runQuickHealthCheck(options.baseUrl));

// Parse command line arguments
program.parse();

// Handle no command provided
if (!process.argv.slice(2).length) {
  console.log('🚀 Polaris v3 Load Testing Tool');
  console.log('');
  console.log('Usage:');
  console.log('  npm run load-test run                    Run custom load test');
  console.log('  npm run load-test run --preset <name>    Run preset test');
  console.log('  npm run load-test presets                 List available presets');
  console.log('  npm run load-test health-check            Run health check');
  console.log('');
  console.log('Examples:');
  console.log('  npm run load-test run --preset pricingPage');
  console.log('  npm run load-test run --preset subscriptionCreation');
  console.log('  npm run load-test run -e /api/test -c 50 -d 120');
  console.log('  npm run load-test health-check');
  console.log('');
  console.log('Run "npm run load-test --help" for detailed options');
  process.exit(0);
}
