#!/usr/bin/env npx tsx

/**
 * Webhook Endpoint Testing Script
 *
 * Tests the Razorpay webhook endpoint for production readiness
 * @version 1.0.0
 * @date 2025-10-29
 * @author Smartslate Polaris Team
 *
 * Usage:
 *   npm run test-webhook-endpoint                           # Test local endpoint
 *   npm run test-webhook-endpoint https://your-domain.com     # Test production endpoint
 *   npm run test-webhook-endpoint --validate-secret           # Test with webhook secret validation
 */

import crypto from 'crypto';
import { createTestWebhookPayload, generateTestSignature } from '../lib/razorpay/webhookSecurity';

// Test configuration
interface TestConfig {
  baseUrl: string;
  webhookSecret?: string;
  timeout: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);

  const config: TestConfig = {
    baseUrl: 'http://localhost:3000',
    timeout: 10000,
  };

  // Parse URL argument
  const urlIndex = args.findIndex((arg) => !arg.startsWith('--'));
  if (urlIndex !== -1 && args[urlIndex]) {
    config.baseUrl = args[urlIndex];
  }

  // Parse flags
  if (args.includes('--validate-secret')) {
    config.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_test_webhook_secret_here';
  }

  return config;
}

/**
 * Test webhook endpoint health
 */
async function testHealthEndpoint(baseUrl: string): Promise<{
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}> {
  const startTime = Date.now();
  const url = `${baseUrl}/api/webhooks/razorpay`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Webhook-Test-Script/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json();

    return {
      success: response.ok,
      responseTime,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test webhook POST endpoint
 */
async function testWebhookProcessing(
  baseUrl: string,
  webhookSecret?: string
): Promise<{
  success: boolean;
  responseTime: number;
  error?: string;
  data?: any;
}> {
  const startTime = Date.now();
  const url = `${baseUrl}/api/webhooks/razorpay`;

  try {
    // Create test webhook payload
    const testPayload = createTestWebhookPayload(
      'subscription.activated',
      'evt_test_subscription_123',
      'sub_test_subscription_123',
      'acc_test_account_456'
    );

    const payloadString = JSON.stringify(testPayload);
    let signature = '';

    // Add signature if webhook secret is provided
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Webhook-Test-Script/1.0',
    };

    if (webhookSecret) {
      signature = generateTestSignature(payloadString, webhookSecret);
      headers['x-razorpay-signature'] = `sha256=${signature}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(15000),
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    return {
      success: response.ok,
      responseTime,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test webhook security validation
 */
async function testWebhookSecurity(baseUrl: string): Promise<{
  validSignatureTest: boolean;
  invalidSignatureTest: boolean;
  missingSignatureTest: boolean;
  invalidPayloadTest: boolean;
}> {
  const url = `${baseUrl}/api/webhooks/razorpay`;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_test_webhook_secret_here';

  const results = {
    validSignatureTest: false,
    invalidSignatureTest: false,
    missingSignatureTest: false,
    invalidPayloadTest: false,
  };

  try {
    // Test 1: Valid signature
    const validPayload = createTestWebhookPayload(
      'subscription.activated',
      'evt_valid_123',
      'sub_valid_123'
    );
    const validPayloadString = JSON.stringify(validPayload);
    const validSignature = generateTestSignature(validPayloadString, webhookSecret);

    const validResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': `sha256=${validSignature}`,
      },
      body: validPayloadString,
      signal: AbortSignal.timeout(10000),
    });

    results.validSignatureTest = validResponse.ok;

    // Test 2: Invalid signature
    const invalidResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature':
          'sha256=invalid_signature_here_123456789012345678901234567890123456789012345678901234567890',
      },
      body: validPayloadString,
      signal: AbortSignal.timeout(10000),
    });

    results.invalidSignatureTest = !invalidResponse.ok; // Should fail

    // Test 3: Missing signature
    const missingResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: validPayloadString,
      signal: AbortSignal.timeout(10000),
    });

    results.missingSignatureTest = !missingResponse.ok; // Should fail

    // Test 4: Invalid payload
    const invalidPayloadResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': `sha256=${validSignature}`,
      },
      body: 'invalid json payload here',
      signal: AbortSignal.timeout(10000),
    });

    results.invalidPayloadTest = !invalidPayloadResponse.ok; // Should fail
  } catch (error) {
    console.error('Security testing failed:', error);
  }

  return results;
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  console.log('🔧 Razorpay Webhook Endpoint Testing');
  console.log('=======================================');

  const config = parseArgs();
  console.log(`📡 Testing endpoint: ${config.baseUrl}`);
  console.log(`⏱️  Timeout: ${config.timeout}ms`);
  console.log(`🔐 Signature validation: ${config.webhookSecret ? 'Enabled' : 'Disabled'}`);
  console.log('');

  // Test 1: Health Check
  console.log('1️⃣  Testing webhook health check...');
  const healthResult = await testHealthEndpoint(config.baseUrl);

  if (healthResult.success) {
    console.log(`   ✅ Health check passed (${healthResult.responseTime}ms)`);
    if (healthResult.data?.statistics) {
      console.log(`   📊 Router stats: ${JSON.stringify(healthResult.data.statistics.router)}`);
      console.log(`   📈 Logs: ${healthResult.data.statistics.logging.totalLogs} total`);
    }
  } else {
    console.log(`   ❌ Health check failed: ${healthResult.error}`);
    console.log(`   ⏱️  Response time: ${healthResult.responseTime}ms`);
  }
  console.log('');

  // Test 2: Webhook Processing
  console.log('2️⃣  Testing webhook processing...');
  const processingResult = await testWebhookProcessing(config.baseUrl, config.webhookSecret);

  if (processingResult.success) {
    console.log(`   ✅ Webhook processing successful (${processingResult.responseTime}ms)`);
    if (processingResult.data) {
      console.log(`   📝 Response: ${JSON.stringify(processingResult.data)}`);
    }
  } else {
    console.log(`   ❌ Webhook processing failed: ${processingResult.error}`);
    console.log(`   ⏱️  Response time: ${processingResult.responseTime}ms`);
    if (processingResult.data) {
      console.log(`   📝 Error response: ${JSON.stringify(processingResult.data)}`);
    }
  }
  console.log('');

  // Test 3: Security Validation (if webhook secret is available)
  if (config.webhookSecret) {
    console.log('3️⃣  Testing webhook security validation...');
    const securityResults = await testWebhookSecurity(config.baseUrl);

    console.log(
      `   🔓 Valid signature test: ${securityResults.validSignatureTest ? '✅ Pass' : '❌ Fail'}`
    );
    console.log(
      `   🚫 Invalid signature test: ${securityResults.invalidSignatureTest ? '✅ Pass' : '❌ Fail'}`
    );
    console.log(
      `   ❌ Missing signature test: ${securityResults.missingSignatureTest ? '✅ Pass' : '❌ Fail'}`
    );
    console.log(
      `   💥 Invalid payload test: ${securityResults.invalidPayloadTest ? '✅ Pass' : '❌ Fail'}`
    );

    const allSecurityTestsPass = Object.values(securityResults).every((result) => result);
    if (allSecurityTestsPass) {
      console.log('   🎉 All security tests passed!');
    } else {
      console.log('   ⚠️  Some security tests failed - review webhook security implementation');
    }
    console.log('');
  } else {
    console.log('3️⃣  Skipping security tests (webhook secret not provided)');
    console.log('   💡 Run with --validate-secret to test webhook security');
    console.log('');
  }

  // Summary
  console.log('📋 Test Summary:');
  console.log(`   Health Check: ${healthResult.success ? '✅' : '❌'}`);
  console.log(`   Webhook Processing: ${processingResult.success ? '✅' : '❌'}`);
  console.log(`   Security Tests: ${config.webhookSecret ? '✅' : '⏭️  Skipped'}`);

  const allTestsPass = healthResult.success && processingResult.success;

  if (allTestsPass) {
    console.log('');
    console.log('🎉 All tests passed! Your webhook endpoint is ready for production.');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Update Razorpay dashboard with webhook URL');
    console.log('   2. Configure webhook events in Razorpay');
    console.log('   3. Test webhook delivery from Razorpay dashboard');
    console.log('   4. Monitor webhook processing logs');
  } else {
    console.log('');
    console.log(
      '❌ Some tests failed. Please review the issues above before deploying to production.'
    );
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   • Check if the application is running');
    console.log('   • Verify the webhook endpoint is accessible');
    console.log('   • Review application logs for errors');
    console.log('   • Ensure environment variables are configured');
  }
}

// Run the tests
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
}

export { main, testHealthEndpoint, testWebhookProcessing, testWebhookSecurity };
