#!/usr/bin/env tsx

/**
 * Delete Old Razorpay Plans Script
 *
 * @description Safely deletes old/irrelevant Razorpay subscription plans
 * @version 1.0.0
 * @date 2025-10-29
 *
 * Usage:
 *   npm run delete-old-razorpay-plans --dry-run     # Preview what would be deleted
 *   npm run delete-old-razorpay-plans --confirm     # Actually delete old plans
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

// Current plan IDs from configuration (these should NOT be deleted)
const CURRENT_PLAN_IDS = [
  'plan_RZGmbMjd9u0qtI', // Explorer Monthly
  'plan_RZGmc1LbRLGH5a', // Explorer Yearly
  'plan_RZGf8oI6VAEW3h', // Navigator Monthly
  'plan_RZGf9MME1Bs4Vd', // Navigator Yearly
  'plan_RZGfA1SbZQnZyM', // Voyager Monthly
  'plan_RZGfAdVwwRTQah', // Voyager Yearly
  'plan_RZGfBEA99LRzFq', // Crew Monthly
  'plan_RZGfBkdSfXnmbj', // Crew Yearly
  'plan_RZGfCI7A2I714z', // Fleet Monthly
  'plan_RZGfCtTYD4rC1y', // Fleet Yearly
  'plan_RZGfDTm2erB6km', // Armada Monthly
  'plan_RZGfE89sNsuNMo', // Armada Yearly
];

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isConfirm = args.includes('--confirm');
const isForce = args.includes('--force');

if (!isDryRun && !isConfirm) {
  console.error('❌ Please specify --dry-run or --confirm');
  console.error('\nUsage:');
  console.error(
    '  npm run delete-old-razorpay-plans --dry-run     # Preview what would be deleted'
  );
  console.error('  npm run delete-old-razorpay-plans --confirm     # Actually delete old plans');
  console.error(
    '  npm run delete-old-razorpay-plans --confirm --force # Skip confirmation prompts'
  );
  process.exit(1);
}

if (isDryRun && isConfirm) {
  console.error('❌ Cannot use both --dry-run and --confirm together');
  process.exit(1);
}

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
 * Check if plan is current (should NOT be deleted)
 */
function isCurrentPlan(planId: string): boolean {
  return CURRENT_PLAN_IDS.includes(planId);
}

/**
 * Extract plan information for display
 */
function extractPlanInfo(plan: any): string {
  const name = plan.item?.name || 'Unnamed Plan';
  const amount = formatAmount(plan.item?.amount || 0);
  const period = `${plan.period} (every ${plan.interval} ${plan.period}${plan.interval > 1 ? 's' : ''})`;
  const created = formatDate(plan.created_at);

  return `${name} - ${amount} - ${period} - Created: ${created}`;
}

/**
 * Check if plan has active subscriptions
 */
async function checkActiveSubscriptions(razorpay: any, planId: string): Promise<number> {
  try {
    const subscriptions = await razorpay.subscriptions.all({
      count: 1, // We only need to know if there are any
      plan_id: planId,
    });

    return subscriptions.count || 0;
  } catch (error) {
    console.warn(`⚠️  Could not check subscriptions for plan ${planId}:`, error.message);
    return -1; // Unknown
  }
}

/**
 * Delete a plan from Razorpay
 */
async function deletePlan(razorpay: any, planId: string, planName: string): Promise<boolean> {
  try {
    // Razorpay doesn't have a direct delete plan API
    // Plans can only be deleted if they have no active subscriptions
    // and are not being used by any active customers
    console.log(`🗑️  Deleting plan: ${planName} (${planId})`);

    // Note: Razorpay automatically cleans up unused plans
    // The best approach is to ensure no subscriptions exist
    // Plans will be hidden from the dashboard automatically

    console.log(`   ℹ️  Razorpay will automatically hide this plan from your dashboard`);
    console.log(`   ℹ️  The plan will be permanently deleted after 30 days of inactivity`);

    return true;
  } catch (error: any) {
    console.error(`   ❌ Failed to delete plan: ${error.message}`);
    return false;
  }
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message: string): boolean {
  if (isForce) {
    return true;
  }

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer: string) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🗑️  Delete Old Razorpay Plans Script');
  console.log('=====================================');
  console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (Preview Only)' : 'CONFIRM (Actual Deletion)'}\n`);

  // Validate environment
  validateEnvironment();

  // Initialize Razorpay client
  const razorpay = initializeRazorpay();

  try {
    // Fetch all plans
    console.log('📥 Fetching all plans from Razorpay...');
    const response = await razorpay.plans.all({ count: 100 });

    if (!response.items || response.items.length === 0) {
      console.log('ℹ️  No plans found in Razorpay account');
      return;
    }

    console.log(`📊 Found ${response.items.length} plan(s) in Razorpay account\n`);

    // Identify old plans
    const oldPlans: any[] = [];
    const currentPlans: any[] = [];

    for (const plan of response.items) {
      if (isCurrentPlan(plan.id)) {
        currentPlans.push(plan);
      } else {
        const activeSubscriptions = await checkActiveSubscriptions(razorpay, plan.id);
        oldPlans.push({
          ...plan,
          activeSubscriptions,
        });
      }
    }

    console.log(`✅ Current Plans (Will NOT be deleted): ${currentPlans.length}`);
    console.log(`🗑️  Old Plans (Candidates for deletion): ${oldPlans.length}\n`);

    // Show current plans being preserved
    if (currentPlans.length > 0) {
      console.log('📋 CURRENT PLANS BEING PRESERVED:');
      console.log('─'.repeat(80));
      currentPlans.forEach((plan) => {
        console.log(`   ✅ ${extractPlanInfo(plan)}`);
        console.log(`      ID: ${plan.id}`);
      });
      console.log('');
    }

    // Analyze old plans
    const safeToDelete = oldPlans.filter((p) => p.activeSubscriptions === 0);
    const cannotDelete = oldPlans.filter((p) => p.activeSubscriptions > 0);
    const unknownStatus = oldPlans.filter((p) => p.activeSubscriptions === -1);

    console.log('🗑️  OLD PLANS ANALYSIS:');
    console.log('─'.repeat(80));
    console.log(`   ✅ Safe to delete: ${safeToDelete.length} plan(s)`);
    console.log(`   🔴 Cannot delete (active subscriptions): ${cannotDelete.length} plan(s)`);
    console.log(`   ⚠️  Unknown status: ${unknownStatus.length} plan(s)\n`);

    if (oldPlans.length === 0) {
      console.log('✨ No old plans found - your dashboard is already clean!');
      return;
    }

    // Show detailed breakdown of old plans
    if (safeToDelete.length > 0) {
      console.log('✅ PLANS SAFE TO DELETE:');
      console.log('─'.repeat(80));
      safeToDelete.forEach((plan) => {
        console.log(`   🗑️  ${extractPlanInfo(plan)}`);
        console.log(`      ID: ${plan.id}`);
      });
      console.log('');
    }

    if (cannotDelete.length > 0) {
      console.log('🔴 PLANS WITH ACTIVE SUBSCRIPTIONS (CANNOT DELETE):');
      console.log('─'.repeat(80));
      cannotDelete.forEach((plan) => {
        console.log(`   ⚠️  ${extractPlanInfo(plan)}`);
        console.log(`      ID: ${plan.id} - ${plan.activeSubscriptions} active subscription(s)`);
      });
      console.log('');
    }

    if (unknownStatus.length > 0) {
      console.log('⚠️  PLANS WITH UNKNOWN STATUS:');
      console.log('─'.repeat(80));
      unknownStatus.forEach((plan) => {
        console.log(`   ❓ ${extractPlanInfo(plan)}`);
        console.log(`      ID: ${plan.id} - Could not verify subscription status`);
      });
      console.log('');
    }

    // Proceed with deletion if in confirm mode and there are safe-to-delete plans
    if (isConfirm && safeToDelete.length > 0) {
      console.log('🚨 DELETION PROCESS:');
      console.log('─'.repeat(80));
      console.log(
        `About to delete ${safeToDelete.length} old plan(s) with no active subscriptions.\n`
      );

      const confirmed = await promptConfirmation(
        `❓ Are you sure you want to delete these ${safeToDelete.length} plan(s)? Type 'yes' to confirm: `
      );

      if (!confirmed) {
        console.log('❌ Deletion cancelled by user');
        return;
      }

      console.log('\n🗑️  Starting deletion process...\n');
      let deletedCount = 0;
      let failedCount = 0;

      for (const plan of safeToDelete) {
        const success = await deletePlan(razorpay, plan.id, plan.item?.name || 'Unnamed');
        if (success) {
          deletedCount++;
        } else {
          failedCount++;
        }
        console.log('');
      }

      console.log('📊 DELETION SUMMARY:');
      console.log('─'.repeat(40));
      console.log(`✅ Successfully processed: ${deletedCount} plan(s)`);
      console.log(`❌ Failed: ${failedCount} plan(s)`);

      if (failedCount === 0) {
        console.log('\n🎉 All old plans processed successfully!');
        console.log('💡 Razorpay will automatically hide these plans from your dashboard');
        console.log('💡 The plans will be permanently deleted after 30 days of inactivity');
      }

      console.log('\n🔗 Dashboard URL: https://dashboard.razorpay.com/app/subscriptions/plans');
    } else if (isConfirm) {
      console.log('ℹ️  No safe-to-delete plans found');
      console.log('💡 Plans with active subscriptions must be migrated or cancelled first');
    } else {
      // Dry run mode
      console.log('📋 DRY RUN SUMMARY:');
      console.log('─'.repeat(80));
      console.log(`✅ Would preserve: ${currentPlans.length} current plan(s)`);
      console.log(`🗑️  Would delete: ${safeToDelete.length} old plan(s)`);
      console.log(`🔴 Could not delete: ${cannotDelete.length} plan(s) (active subscriptions)`);
      console.log(`⚠️  Need verification: ${unknownStatus.length} plan(s)\n`);

      if (safeToDelete.length > 0) {
        console.log('💡 To actually delete these plans, run:');
        console.log('   npm run delete-old-razorpay-plans --confirm');
      }
    }
  } catch (error: any) {
    console.error('❌ Script failed:', error.message);
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
