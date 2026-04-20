#!/usr/bin/env tsx

/**
 * Create New Razorpay Plans Script
 *
 * Use this script if you cannot edit existing plans (due to active subscriptions)
 * This creates new plans with the correct pricing
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Import Razorpay client
const Razorpay = require('razorpay');

// New plans to create
const NEW_PLANS = [
  // Individual Plans - NEW PRICING
  {
    name: 'Explorer Plan - Monthly (Updated)',
    period: 'monthly',
    amount: 159900, // ₹1,599 in paise
    description: '5 blueprints per month for individual creators',
    tier: 'explorer',
    billing: 'monthly',
  },
  {
    name: 'Explorer Plan - Yearly (Updated)',
    period: 'yearly',
    amount: 1599000, // ₹15,990 in paise
    description: '5 blueprints per month for individual creators (16% discount)',
    tier: 'explorer',
    billing: 'yearly',
  },
  {
    name: 'Navigator Plan - Monthly (Updated)',
    period: 'monthly',
    amount: 349900, // ₹3,499 in paise
    description: '25 blueprints per month for professionals',
    tier: 'navigator',
    billing: 'monthly',
  },
  {
    name: 'Navigator Plan - Yearly (Updated)',
    period: 'yearly',
    amount: 3499000, // ₹34,990 in paise
    description: '25 blueprints per month for professionals (16% discount)',
    tier: 'navigator',
    billing: 'yearly',
  },
  {
    name: 'Voyager Plan - Monthly (Updated)',
    period: 'monthly',
    amount: 699900, // ₹6,999 in paise
    description: '50 blueprints per month for power users',
    tier: 'voyager',
    billing: 'monthly',
  },
  {
    name: 'Voyager Plan - Yearly (Updated)',
    period: 'yearly',
    amount: 6999000, // ₹69,990 in paise
    description: '50 blueprints per month for power users (16% discount)',
    tier: 'voyager',
    billing: 'yearly',
  },
];

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
  const required = ['NEXT_PUBLIC_RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nPlease add these to your .env.local file');
    process.exit(1);
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
  if (!keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    console.error('❌ Invalid NEXT_PUBLIC_RAZORPAY_KEY_ID format');
    console.error('Expected: rzp_test_XXXXX or rzp_live_XXXXX');
    process.exit(1);
  }

  const mode = keyId.startsWith('rzp_test_') ? 'TEST' : 'LIVE';
  console.log(`🔧 Razorpay Mode: ${mode}`);
}

/**
 * Initialize Razorpay client
 */
function initializeRazorpay(): any {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    return razorpay;
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay client:', error);
    process.exit(1);
  }
}

/**
 * Format amount from paise to rupees
 */
function formatAmount(amount: number): string {
  return `₹${(amount / 100).toLocaleString('en-IN')}`;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🆕 Creating New Razorpay Plans');
  console.log('==============================\n');

  // Validate environment
  validateEnvironment();

  // Initialize Razorpay client
  const razorpay = initializeRazorpay();

  try {
    console.log(`📋 Creating ${NEW_PLANS.length} new plans...\n`);

    const createdPlans: any[] = [];

    for (const planConfig of NEW_PLANS) {
      console.log(`🆕 Creating: ${planConfig.name}`);
      console.log(`   Amount: ${formatAmount(planConfig.amount)}`);
      console.log(`   Period: ${planConfig.period}`);

      try {
        const plan = await razorpay.plans.create({
          period: planConfig.period,
          interval: 1,
          item: {
            name: planConfig.name,
            amount: planConfig.amount,
            currency: 'INR',
            description: planConfig.description,
          },
          notes: {
            tier: planConfig.tier,
            billing_cycle: planConfig.billing,
            created_via: 'create-new-plans-script',
            created_at: new Date().toISOString(),
          },
        });

        createdPlans.push({
          tier: planConfig.tier,
          billing: planConfig.billing,
          planId: plan.id,
          name: planConfig.name,
          amount: planConfig.amount,
        });

        console.log(`   ✅ Created successfully: ${plan.id}`);
        console.log(`   Plan ID: ${plan.id}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to create: ${error.error?.description || error.message}`);
      }

      console.log('');
    }

    if (createdPlans.length > 0) {
      console.log('📋 SUMMARY: Created Plans');
      console.log('========================');

      createdPlans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.tier} (${plan.billing})`);
        console.log(`   Plan ID: ${plan.planId}`);
        console.log(`   Amount: ${formatAmount(plan.amount)}`);
        console.log('');
      });

      console.log('📝 NEXT STEPS:');
      console.log('1. Update your razorpayPlans.ts file with these new plan IDs');
      console.log('2. Test the checkout flow with new plans');
      console.log('3. Update any existing subscriptions to use new plans if needed');
      console.log('4. Delete old plans when no longer needed');

      // Generate updated config
      console.log('\n🔧 UPDATED CONFIGURATION:');
      console.log('Add these to your RAZORPAY_PLANS configuration:\n');

      const configUpdates: any = {};
      createdPlans.forEach((plan) => {
        if (!configUpdates[plan.tier]) {
          configUpdates[plan.tier] = {};
        }
        configUpdates[plan.tier][plan.billing] = plan.planId;
      });

      console.log('// Updated plan IDs - add these to RAZORPAY_PLANS');
      Object.entries(configUpdates).forEach(([tier, billing]) => {
        console.log(`${tier}: {`);
        Object.entries(billing as any).forEach(([cycle, id]) => {
          console.log(`  ${cycle}: '${id}',`);
        });
        console.log('},');
      });
    } else {
      console.log('⚠️  No plans were created successfully');
    }
  } catch (error: any) {
    console.error('❌ Failed to create plans:', error.message);
    console.error('This could be due to:');
    console.error('• Invalid API credentials');
    console.error('• Insufficient permissions');
    console.error('• Network connectivity issues');
    console.error('• Rate limiting');

    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
