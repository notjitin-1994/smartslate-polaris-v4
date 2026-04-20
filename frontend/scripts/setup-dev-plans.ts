#!/usr/bin/env tsx

/**
 * Development Razorpay Plans Setup Script
 *
 * @description Sets up Razorpay plan configuration for development
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This script provides two approaches:
 * 1. Try to create actual plans in Razorpay (test mode only)
 * 2. Generate mock plan IDs for development when Razorpay isn't configured
 *
 * Usage: npm run setup-dev-plans
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

/**
 * Mock plan IDs for development when Razorpay isn't configured
 * These follow Razorpay's plan ID format but are for development only
 */
const MOCK_PLAN_IDS = {
  explorer: {
    monthly: 'plan_mock_explorer_monthly_20251029',
    yearly: 'plan_mock_explorer_yearly_20251029',
  },
  navigator: {
    monthly: 'plan_mock_navigator_monthly_20251029',
    yearly: 'plan_mock_navigator_yearly_20251029',
  },
  voyager: {
    monthly: 'plan_mock_voyager_monthly_20251029',
    yearly: 'plan_mock_voyager_yearly_20251029',
  },
  crew: {
    monthly: 'plan_mock_crew_monthly_20251029',
    yearly: 'plan_mock_crew_yearly_20251029',
  },
  fleet: {
    monthly: 'plan_mock_fleet_monthly_20251029',
    yearly: 'plan_mock_fleet_yearly_20251029',
  },
  armada: {
    monthly: 'plan_mock_armada_monthly_20251029',
    yearly: 'plan_mock_armada_yearly_20251029',
  },
};

/**
 * Generate updated razorpayPlans.ts content
 */
function generateUpdatedConfig(
  useRealPlans: boolean = false,
  createdPlans?: Map<string, string>
): string {
  const configLines = [
    'export const RAZORPAY_PLANS: RazorpayPlanMapping = {',
    '  /**',
    "   * Free Tier (No Razorpay plan - users don't pay)",
    '   */',
    '  free: {',
    '    monthly: null,',
    '    yearly: null,',
    '  },',
    '',
  ];

  const tiers = ['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];

  tiers.forEach((tier) => {
    const monthlyPlanId =
      useRealPlans && createdPlans
        ? createdPlans.get(`${tier}-monthly`) || null
        : MOCK_PLAN_IDS[tier as keyof typeof MOCK_PLAN_IDS].monthly;

    const yearlyPlanId =
      useRealPlans && createdPlans
        ? createdPlans.get(`${tier}-yearly`) || null
        : MOCK_PLAN_IDS[tier as keyof typeof MOCK_PLAN_IDS].yearly;

    configLines.push(`  /**`);
    configLines.push(`   * ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`);
    if (useRealPlans) {
      configLines.push(`   * Plan IDs created via Razorpay API`);
    } else {
      configLines.push(`   * Mock plan IDs for development - replace with real Razorpay plan IDs`);
      configLines.push(`   * To create real plans: npm run create-razorpay-plans`);
    }
    configLines.push(`   * Generated on: ${new Date().toISOString()}`);
    configLines.push(`   */`);
    configLines.push(`  ${tier}: {`);
    configLines.push(
      `    monthly: ${monthlyPlanId ? `'${monthlyPlanId}'` : 'null'}, // Plan ID for monthly billing`
    );
    configLines.push(
      `    yearly: ${yearlyPlanId ? `'${yearlyPlanId}'` : 'null'},   // Plan ID for yearly billing`
    );
    configLines.push(`  },`);
    configLines.push('');
  });

  configLines.push('} as const;');

  return configLines.join('\n');
}

/**
 * Check if Razorpay environment is properly configured
 */
function checkRazorpayConfiguration(): { isConfigured: boolean; mode: string; reason: string } {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      isConfigured: false,
      mode: 'none',
      reason: 'Missing NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables',
    };
  }

  if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    return {
      isConfigured: false,
      mode: 'invalid',
      reason:
        'Invalid NEXT_PUBLIC_RAZORPAY_KEY_ID format. Expected: rzp_test_XXXXX or rzp_live_XXXXX',
    };
  }

  const mode = keyId.startsWith('rzp_test_') ? 'test' : 'live';

  if (mode === 'live' && process.env.NODE_ENV === 'development') {
    return {
      isConfigured: false,
      mode: 'production_in_dev',
      reason:
        'Using live mode keys in development environment. Consider switching to test mode (rzp_test_) for development.',
    };
  }

  return {
    isConfigured: true,
    mode,
    reason: 'Razorpay environment is properly configured',
  };
}

/**
 * Try to create real Razorpay plans (test mode only)
 */
async function tryCreateRealPlans(): Promise<Map<string, string>> {
  console.log('🔍 Attempting to create real Razorpay plans...');

  try {
    // Import Razorpay only if we're going to use it
    const Razorpay = require('razorpay');

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const createdPlans = new Map<string, string>();
    const planConfigs = [
      {
        tier: 'explorer',
        name: 'Explorer Plan - Monthly',
        description: '5 blueprints per month for individual creators',
        amount: 1900,
        currency: 'INR',
        period: 1,
        key: 'explorer-monthly',
      },
      {
        tier: 'explorer',
        name: 'Explorer Plan - Yearly',
        description: '5 blueprints per month for individual creators (16% discount)',
        amount: 19000,
        currency: 'INR',
        period: 12,
        key: 'explorer-yearly',
      },
      // Add more plan configurations as needed for testing
    ];

    for (const config of planConfigs) {
      try {
        console.log(`📝 Creating ${config.name}...`);
        const plan = await razorpay.plans.create({
          period: config.period,
          interval: 1,
          item: {
            name: config.name,
            description: config.description,
            amount: config.amount,
            currency: config.currency,
          },
          notes: {
            tier: config.tier,
            created_by: 'dev-setup-script',
            environment: 'development',
          },
        });

        createdPlans.set(config.key, plan.id);
        console.log(`✅ Created: ${plan.id}`);
      } catch (error: any) {
        console.log(
          `❌ Failed to create ${config.name}: ${error.error?.description || error.message}`
        );
      }
    }

    return createdPlans;
  } catch (error) {
    console.log('❌ Failed to initialize Razorpay client:', error);
    return new Map();
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🚀 Setting up Razorpay Plans for SmartSlate Polaris v3');
  console.log('================================================\n');

  const config = checkRazorpayConfiguration();

  console.log(
    `🔧 Razorpay Configuration Status: ${config.isConfigured ? '✅ Configured' : '❌ Not Configured'}`
  );
  console.log(`   Mode: ${config.mode.toUpperCase()}`);
  console.log(`   Reason: ${config.reason}\n`);

  let useRealPlans = false;
  let createdPlans: Map<string, string> | undefined;

  if (config.isConfigured && config.mode === 'test') {
    console.log('🔍 Razorpay is configured in test mode. Attempting to create real plans...');
    createdPlans = await tryCreateRealPlans();

    if (createdPlans.size > 0) {
      useRealPlans = true;
      console.log(`✅ Successfully created ${createdPlans.size} real Razorpay plans`);
    } else {
      console.log('❌ Could not create real plans. Using mock plan IDs for development.');
    }
  } else if (config.isConfigured && config.mode === 'live') {
    console.log('⚠️  Razorpay is configured in LIVE mode.');
    console.log('   For safety, using mock plan IDs in development.');
    console.log('   To create real plans, switch to test mode keys (rzp_test_)');
  } else {
    console.log('ℹ️  Razorpay is not configured or configured for production.');
    console.log('   Using mock plan IDs for development.');
    console.log('\n📋 To configure Razorpay:');
    console.log('   1. Get Razorpay test keys from dashboard.razorpay.com');
    console.log('   2. Add to .env.local:');
    console.log('      NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXX');
    console.log('      RAZORPAY_KEY_SECRET=your_secret_here');
    console.log('   3. Run this script again to create real plans');
  }

  // Generate configuration
  const updatedConfig = generateUpdatedConfig(useRealPlans, createdPlans);

  console.log('\n📄 Generated razorpayPlans.ts configuration:');
  console.log('─'.repeat(60));
  console.log(updatedConfig);
  console.log('─'.repeat(60));

  console.log('\n🔧 Next steps:');
  console.log('1. Copy the generated configuration above');
  console.log('2. Update frontend/lib/config/razorpayPlans.ts');
  console.log('3. Replace the RAZORPAY_PLANS object with the new content');
  console.log('4. Restart your development server');
  console.log('5. Test the subscription functionality');

  if (!useRealPlans) {
    console.log('\n⚠️  Development Mode Notice:');
    console.log('   - Using mock plan IDs for development');
    console.log('   - Real payment processing will not work');
    console.log(
      '   - To enable real payments, configure Razorpay and run: npm run create-razorpay-plans'
    );
  }

  console.log('\n🎉 Setup completed!');
}

// Run the script
main().catch((error) => {
  console.error('❌ Setup script failed:', error);
  process.exit(1);
});
