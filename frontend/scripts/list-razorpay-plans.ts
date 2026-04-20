#!/usr/bin/env tsx

/**
 * List Razorpay Plans Script
 *
 * @description Lists all existing Razorpay subscription plans with detailed information
 * @version 1.0.0
 * @date 2025-10-29
 *
 * Usage: npm run list-razorpay-plans
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Import Razorpay client (server-side only)
const Razorpay = require('razorpay');

// Current plan IDs from configuration
const CURRENT_PLAN_IDS = [
  'plan_RZZwywnfGJHTuw', // Explorer Monthly (Updated)
  'plan_RZZwzXQ1PJ4ZOn', // Explorer Yearly (Updated)
  'plan_RZZx05RyiE9bz5', // Navigator Monthly (Updated)
  'plan_RZZx0gnrvTUTVP', // Navigator Yearly (Updated)
  'plan_RZZx1BzIJRZjk7', // Voyager Monthly (Updated)
  'plan_RZZx1oIMLCNQ2N', // Voyager Yearly (Updated)
  'plan_RZGfBEA99LRzFq', // Crew Monthly (Keep existing for now)
  'plan_RZGfBkdSfXnmbj', // Crew Yearly (Keep existing for now)
  'plan_RZGfCI7A2I714z', // Fleet Monthly (Keep existing for now)
  'plan_RZGfCtTYD4rC1y', // Fleet Yearly (Keep existing for now)
  'plan_RZGfDTm2erB6km', // Armada Monthly (Keep existing for now)
  'plan_RZGfE89sNsuNMo', // Armada Yearly (Keep existing for now)
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
 * Format date from timestamp
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Determine plan status based on current configuration
 */
function getPlanStatus(planId: string): 'CURRENT' | 'OLD' | 'UNKNOWN' {
  if (CURRENT_PLAN_IDS.includes(planId)) {
    return 'CURRENT';
  }
  return 'OLD';
}

/**
 * Extract tier information from plan name or notes
 */
function extractPlanInfo(plan: any): { tier?: string; billing?: string; isOld?: boolean } {
  const name = plan.item?.name || '';
  const notes = plan.notes || {};

  // Try to extract from plan name first
  const tierMatch = name.match(/(explorer|navigator|voyager|crew|fleet|armada)/i);
  const billingMatch = name.match(/(monthly|yearly)/i);

  const tier = tierMatch ? tierMatch[1].toLowerCase() : notes.tier;
  const billing = billingMatch ? billingMatch[1].toLowerCase() : notes.billing_cycle;

  return {
    tier,
    billing,
    isOld: getPlanStatus(plan.id) === 'OLD',
  };
}

/**
 * Check if plan has active subscriptions
 */
async function checkActiveSubscriptions(razorpay: any, planId: string): Promise<number> {
  try {
    // Razorpay doesn't have a direct way to count subscriptions by plan
    // We'll use the subscriptions API with a reasonable limit
    const subscriptions = await razorpay.subscriptions.all({
      count: 100, // Maximum we can check efficiently
      plan_id: planId,
    });

    return subscriptions.count || 0;
  } catch (error) {
    console.warn(`⚠️  Could not check subscriptions for plan ${planId}:`, error.message);
    return -1; // Unknown
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🔍 Listing Razorpay Plans for SmartSlate Polaris v3');
  console.log('========================================================\n');

  // Validate environment
  validateEnvironment();

  // Initialize Razorpay client
  const razorpay = initializeRazorpay();

  try {
    // Fetch all plans
    console.log('📥 Fetching all plans from Razorpay...');
    const response = await razorpay.plans.all({ count: 100 }); // Get first 100 plans

    if (!response.items || response.items.length === 0) {
      console.log('ℹ️  No plans found in Razorpay account');
      return;
    }

    console.log(`📊 Found ${response.items.length} plan(s) in Razorpay account\n`);

    // Categorize plans
    const currentPlans: any[] = [];
    const oldPlans: any[] = [];
    let plansWithSubscriptions = 0;

    // Analyze each plan
    for (const plan of response.items) {
      const status = getPlanStatus(plan.id);
      const info = extractPlanInfo(plan);
      const activeSubscriptions = await checkActiveSubscriptions(razorpay, plan.id);

      const planData = {
        ...plan,
        ...info,
        activeSubscriptions,
        status,
      };

      if (activeSubscriptions > 0) {
        plansWithSubscriptions++;
      }

      if (status === 'CURRENT') {
        currentPlans.push(planData);
      } else {
        oldPlans.push(planData);
      }
    }

    // Display current plans
    console.log('✅ CURRENT PLANS (In Use):');
    console.log('─'.repeat(80));
    if (currentPlans.length === 0) {
      console.log('⚠️  No current plans found! This might indicate a configuration issue.');
    } else {
      currentPlans.forEach((plan) => {
        console.log(`📋 ${plan.item?.name || 'Unnamed Plan'}`);
        console.log(`   ID: ${plan.id}`);
        console.log(`   Amount: ${formatAmount(plan.item?.amount || 0)}`);
        console.log(
          `   Period: ${plan.period} (every ${plan.interval} ${plan.period}${plan.interval > 1 ? 's' : ''})`
        );
        console.log(`   Created: ${formatDate(plan.created_at)}`);
        console.log(`   Active Subscriptions: ${plan.activeSubscriptions}`);
        console.log(`   Description: ${plan.item?.description || 'No description'}`);
        console.log('');
      });
    }

    // Display old plans
    console.log('\n🗑️  OLD PLANS (Candidates for Deletion):');
    console.log('─'.repeat(80));
    if (oldPlans.length === 0) {
      console.log('✨ No old plans found - your dashboard is clean!');
    } else {
      oldPlans.forEach((plan) => {
        const subscriptionStatus =
          plan.activeSubscriptions > 0
            ? `🔴 ${plan.activeSubscriptions} active - CANNOT DELETE`
            : plan.activeSubscriptions === 0
              ? '✅ No active subscriptions - Safe to delete'
              : '⚠️  Could not verify subscription status';

        console.log(`📋 ${plan.item?.name || 'Unnamed Plan'}`);
        console.log(`   ID: ${plan.id}`);
        console.log(`   Amount: ${formatAmount(plan.item?.amount || 0)}`);
        console.log(
          `   Period: ${plan.period} (every ${plan.interval} ${plan.period}${plan.interval > 1 ? 's' : ''})`
        );
        console.log(`   Created: ${formatDate(plan.created_at)}`);
        console.log(`   Status: ${subscriptionStatus}`);
        console.log(`   Description: ${plan.item?.description || 'No description'}`);
        console.log('');
      });
    }

    // Summary and recommendations
    console.log('📈 SUMMARY:');
    console.log('─'.repeat(40));
    console.log(`Current Plans: ${currentPlans.length}`);
    console.log(`Old Plans: ${oldPlans.length}`);
    console.log(`Plans with Active Subscriptions: ${plansWithSubscriptions}`);

    if (oldPlans.length > 0) {
      const safeToDelete = oldPlans.filter((p) => p.activeSubscriptions === 0).length;
      const cannotDelete = oldPlans.filter((p) => p.activeSubscriptions > 0).length;
      const unknown = oldPlans.filter((p) => p.activeSubscriptions === -1).length;

      console.log(`\n🎯 RECOMMENDATIONS:`);
      console.log(`   • Safe to delete immediately: ${safeToDelete} plan(s)`);
      console.log(`   • Cannot delete (active subscriptions): ${cannotDelete} plan(s)`);
      console.log(`   • Requires manual verification: ${unknown} plan(s)`);

      if (safeToDelete > 0) {
        console.log(`\n✅ NEXT STEPS:`);
        console.log(`   1. Run: npm run delete-old-razorpay-plans --dry-run`);
        console.log(`   2. Review the plans to be deleted`);
        console.log(`   3. Run: npm run delete-old-razorpay-plans --confirm`);
        console.log(`   4. Or manually delete via Razorpay Dashboard`);
      }

      if (cannotDelete > 0) {
        console.log(`\n⚠️  WARNING:`);
        console.log(`   Some old plans have active subscriptions.`);
        console.log(`   You must migrate or cancel these subscriptions before deleting the plans.`);
      }
    } else {
      console.log('\n✨ Your Razorpay dashboard is clean and up-to-date!');
    }

    console.log('\n🔗 Dashboard URL: https://dashboard.razorpay.com/app/subscriptions/plans');
  } catch (error: any) {
    console.error('❌ Failed to fetch plans:', error.message);
    console.error('This could be due to:');
    console.error('• Invalid API credentials');
    console.error('• Network connectivity issues');
    console.error('• Razorpay API being temporarily unavailable');
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
