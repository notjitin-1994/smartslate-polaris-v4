#!/usr/bin/env tsx

/**
 * Delete All Razorpay Plans Script
 *
 * @description Deletes ALL plans from Razorpay dashboard
 * @version 1.0.0
 * @date 2025-10-29
 *
 * WARNING: This script will delete ALL plans in your Razorpay dashboard
 * Use with caution. This is typically used for complete cleanup before recreating plans.
 *
 * Usage: npm run delete-all-razorpay-plans --confirm
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
 * List all plans with details
 */
async function listAllPlans(razorpay: any): Promise<any[]> {
  try {
    console.log('📋 Fetching all plans from Razorpay dashboard...');

    let allPlans: any[] = [];
    let hasMore = true;
    let count = 0;
    const skip = 10; // Razorpay API default limit

    while (hasMore) {
      const response = await razorpay.plans.all({
        count: 100,
        skip: count,
      });

      if (response.items && response.items.length > 0) {
        allPlans = allPlans.concat(response.items);
        count += response.items.length;
        console.log(`   Found ${response.items.length} plans (Total: ${count})`);
        hasMore = response.items.length === 100; // Continue if we got a full page
      } else {
        hasMore = false;
      }
    }

    return allPlans;
  } catch (error: any) {
    console.error('❌ Failed to fetch plans:', error.error?.description || error.message);
    return [];
  }
}

/**
 * Check if a plan has active subscriptions
 */
async function checkActiveSubscriptions(razorpay: any, planId: string): Promise<number> {
  try {
    const subscriptions = await razorpay.subscriptions.all({
      plan_id: planId,
      status: 'active',
      count: 1, // Just need to know if there are any
    });

    return subscriptions.items ? subscriptions.items.length : 0;
  } catch (error: any) {
    console.warn(
      `   ⚠️  Could not check subscriptions for plan ${planId}: ${error.error?.description || error.message}`
    );
    return 0;
  }
}

/**
 * Delete a single plan
 */
async function deletePlan(razorpay: any, plan: any, force: boolean = false): Promise<boolean> {
  try {
    // Check for active subscriptions unless force delete
    if (!force) {
      const activeCount = await checkActiveSubscriptions(razorpay, plan.id);
      if (activeCount > 0) {
        console.log(`   ⚠️  SKIPPED: Plan has ${activeCount} active subscriptions`);
        console.log(`        Plan ID: ${plan.id}`);
        console.log(`        Plan Name: ${plan.item.name}`);
        console.log(`        To force delete, use --force flag`);
        return false;
      }
    }

    await razorpay.plans.delete(plan.id);
    console.log(`   ✅ DELETED: ${plan.item.name} (${plan.id})`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ FAILED: ${plan.item.name} (${plan.id})`);
    console.error(`        Error: ${error.error?.description || error.message}`);
    return false;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🚨 Delete All Razorpay Plans Script');
  console.log('=====================================\n');

  const isDryRun = !process.argv.includes('--confirm');
  const isForce = process.argv.includes('--force');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No plans will be deleted');
    console.log('   To execute deletion, add --confirm flag');
    console.log('   To force delete plans with active subscriptions, add --force flag\n');
  } else {
    console.log('⚠️  LIVE DELETION MODE');
    if (isForce) {
      console.log('   🔥 FORCE DELETE ENABLED - Will delete plans with active subscriptions');
    }
    console.log('   This action cannot be undone!\n');
  }

  // Validate environment
  validateEnvironment();

  // Initialize Razorpay client
  const razorpay = initializeRazorpay();

  // Get all plans
  const allPlans = await listAllPlans(razorpay);

  if (allPlans.length === 0) {
    console.log('✅ No plans found in Razorpay dashboard');
    return;
  }

  console.log(`\n📊 Found ${allPlans.length} plan(s) in Razorpay dashboard:\n`);

  // Display all plans
  allPlans.forEach((plan, index) => {
    const amount = plan.item.amount || 0;
    const currency = plan.item.currency || 'INR';
    const price =
      currency === 'INR'
        ? `₹${(amount / 100).toLocaleString('en-IN')}`
        : `$${(amount / 100).toLocaleString('en-US')}`;
    const period =
      plan.period === 1 ? 'monthly' : plan.period === 12 ? 'yearly' : `${plan.period} months`;

    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${plan.item.name}`);
    console.log(`    ID: ${plan.id}`);
    console.log(`    Price: ${price}/${period}`);
    console.log(`    Created: ${new Date(plan.created_at).toLocaleDateString()}`);
    console.log(`    Description: ${plan.item.description || 'No description'}`);
    console.log('');
  });

  if (isDryRun) {
    console.log('📋 Dry run completed. No plans were deleted.');
    console.log('   To delete these plans, run: npm run delete-all-razorpay-plans --confirm');
    return;
  }

  // Ask for confirmation
  console.log(`⚠️  Are you sure you want to delete ALL ${allPlans.length} plan(s)?`);
  console.log('   This will permanently remove them from Razorpay dashboard.');
  console.log('   Type "DELETE ALL PLANS" to confirm:');

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  const answer = await new Promise<string>((resolve) => {
    process.stdin.on('data', (data) => {
      resolve(data.toString().trim());
      process.stdin.pause();
    });
  });

  if (answer !== 'DELETE ALL PLANS') {
    console.log('❌ Confirmation failed. Aborting deletion.');
    process.exit(0);
  }

  console.log('\n🗑️  Starting deletion process...\n');

  // Delete all plans
  let deletedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const plan of allPlans) {
    const success = await deletePlan(razorpay, plan, isForce);
    if (success) {
      deletedCount++;
    } else if (isForce) {
      failedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n📊 Deletion Summary:');
  console.log(`✅ Successfully deleted: ${deletedCount} plans`);
  console.log(`❌ Failed to delete: ${failedCount} plans`);
  if (!isForce) {
    console.log(`⚠️  Skipped (active subscriptions): ${skippedCount} plans`);
  }

  if (deletedCount > 0) {
    console.log('\n🎉 All plans have been deleted from your Razorpay dashboard!');
    console.log('   You can now recreate plans using: npm run create-razorpay-plans');
  } else {
    console.log('\n⚠️  No plans were deleted.');
  }

  process.exit(0);
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n❌ Script interrupted by user');
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
