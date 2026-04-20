#!/usr/bin/env tsx

/**
 * Update Razorpay Plan Prices Script
 *
 * This script updates existing Razorpay plans with new pricing
 * Run this if you can't edit plans in the dashboard
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

// Plan updates required
const PLAN_UPDATES = [
  // Individual Plans - NEW PRICING
  {
    planId: 'plan_RZGmbMjd9u0qtI', // Explorer Monthly
    name: 'Explorer Plan - Monthly',
    amount: 159900, // ₹1,599 in paise
    description: '5 blueprints per month for individual creators',
  },
  {
    planId: 'plan_RZGmc1LbRLGH5a', // Explorer Yearly
    name: 'Explorer Plan - Yearly',
    amount: 1599000, // ₹15,990 in paise
    description: '5 blueprints per month for individual creators (16% discount)',
  },
  {
    planId: 'plan_RZGf8oI6VAEW3h', // Navigator Monthly
    name: 'Navigator Plan - Monthly',
    amount: 349900, // ₹3,499 in paise
    description: '25 blueprints per month for professionals',
  },
  {
    planId: 'plan_RZGf9MME1Bs4Vd', // Navigator Yearly
    name: 'Navigator Plan - Yearly',
    amount: 3499000, // ₹34,990 in paise
    description: '25 blueprints per month for professionals (16% discount)',
  },
  {
    planId: 'plan_RZGfA1SbZQnZyM', // Voyager Monthly
    name: 'Voyager Plan - Monthly',
    amount: 699900, // ₹6,999 in paise
    description: '50 blueprints per month for power users',
  },
  {
    planId: 'plan_RZGfAdVwwRTQah', // Voyager Yearly
    name: 'Voyager Plan - Yearly',
    amount: 6999000, // ₹69,990 in paise
    description: '50 blueprints per month for power users (16% discount)',
  },
  // Team Plans - VERIFY (should already be correct)
  {
    planId: 'plan_RZGfBEA99LRzFq', // Crew Monthly
    name: 'Crew Plan - Monthly (per seat)',
    amount: 199900, // ₹1,999 in paise
    description: '10 blueprints per seat per month for small teams',
  },
  {
    planId: 'plan_RZGfBkdSfXnmbj', // Crew Yearly
    name: 'Crew Plan - Yearly (per seat)',
    amount: 1999000, // ₹19,990 in paise
    description: '10 blueprints per seat per month for small teams (16% discount)',
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
  console.log('🔄 Updating Razorpay Plan Prices');
  console.log('===================================\n');

  // Validate environment
  validateEnvironment();

  // Initialize Razorpay client
  const razorpay = initializeRazorpay();

  try {
    console.log(`📋 Updating ${PLAN_UPDATES.length} plans...\n`);

    for (const plan of PLAN_UPDATES) {
      console.log(`🔄 Updating: ${plan.name}`);
      console.log(`   Plan ID: ${plan.planId}`);
      console.log(`   New Amount: ${formatAmount(plan.amount)}`);

      try {
        // Get current plan details first
        const currentPlan = await razorpay.plans.fetch(plan.planId);
        console.log(`   Current Amount: ${formatAmount(currentPlan.item.amount)}`);

        // Update the plan
        const updatedPlan = await razorpay.plans.edit(plan.planId, {
          item: {
            name: plan.name,
            amount: plan.amount,
            currency: currentPlan.item.currency,
            description: plan.description,
          },
        });

        console.log(`   ✅ Updated successfully: ${formatAmount(updatedPlan.item.amount)}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to update: ${error.error?.description || error.message}`);

        // If update fails, it might be because the plan has active subscriptions
        if (error.error?.code === 'BAD_REQUEST_ERROR') {
          console.log(
            `   💡 Note: Plan might have active subscriptions. Consider creating a new plan instead.`
          );
        }
      }

      console.log('');
    }

    console.log('✅ Plan update process completed');
    console.log('\n📝 Next Steps:');
    console.log('1. Verify the updated prices in Razorpay dashboard');
    console.log('2. Test the checkout flow to ensure correct pricing');
    console.log('3. Run: npm test -- __tests__/integration/razorpay/razorpay-plans.test.ts');
  } catch (error: any) {
    console.error('❌ Failed to update plans:', error.message);
    console.error('This could be due to:');
    console.error('• Invalid API credentials');
    console.error('• Plans with active subscriptions (cannot be edited)');
    console.error('• Insufficient permissions');
    console.error('• Network connectivity issues');

    console.log('\n💡 Alternative Solutions:');
    console.log('1. Create new plans instead of updating existing ones');
    console.log('2. Contact Razorpay support for assistance');
    console.log('3. Use the dashboard if available');

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
