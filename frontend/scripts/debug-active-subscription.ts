#!/usr/bin/env tsx

/**
 * Debug Active Subscription
 *
 * This script checks the actual subscription details in Razorpay to see
 * what amount the user will be charged when they complete the payment
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
 * Debug active subscription
 */
async function debugActiveSubscription(): Promise<void> {
  console.log('🔍 Debugging Active Subscription');
  console.log('=================================\n');

  const razorpay = initializeRazorpay();

  // The subscription ID from the logs
  const subscriptionId = 'sub_RZcjrrQTSpbs3l';

  try {
    console.log(`📥 Fetching subscription: ${subscriptionId}`);
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);

    console.log('\n📋 SUBSCRIPTION DETAILS:');
    console.log('─'.repeat(50));
    console.log(`ID: ${subscription.id}`);
    console.log(`Status: ${subscription.status}`);
    console.log(`Plan ID: ${subscription.plan_id}`);
    console.log(`Customer ID: ${subscription.customer_id}`);
    console.log(`Current Start: ${new Date(subscription.current_start * 1000).toLocaleString()}`);
    console.log(`Current End: ${new Date(subscription.current_end * 1000).toLocaleString()}`);
    console.log(`Total Count: ${subscription.total_count}`);
    console.log(`Paid Count: ${subscription.paid_count}`);
    console.log(`Remaining Count: ${subscription.remaining_count}`);

    // Fetch the plan details to see the actual amount
    console.log(`\n💰 FETCHING PLAN DETAILS: ${subscription.plan_id}`);
    const plan = await razorpay.plans.fetch(subscription.plan_id);

    console.log('\n📋 PLAN DETAILS:');
    console.log('─'.repeat(50));
    console.log(`Plan ID: ${plan.id}`);
    console.log(`Plan Name: ${plan.item.name}`);
    console.log(`Amount: ${formatAmount(plan.item.amount)}`);
    console.log(`Currency: ${plan.item.currency}`);
    console.log(`Period: ${plan.period}`);
    console.log(`Interval: ${plan.interval}`);
    console.log(`Created: ${new Date(plan.created_at * 1000).toLocaleString()}`);

    // Check if this is the correct plan
    console.log('\n✅ PLAN VERIFICATION:');
    console.log('─'.repeat(50));

    const expectedPlans = {
      plan_RZZwywnfGJHTuw: { name: 'Explorer Monthly', amount: 159900 },
      plan_RZZx05RyiE9bz5: { name: 'Navigator Monthly', amount: 349900 },
      plan_RZZx1BzIJRZjk7: { name: 'Voyager Monthly', amount: 699900 },
    };

    const expectedPlan = expectedPlans[subscription.plan_id as keyof typeof expectedPlans];

    if (expectedPlan) {
      console.log(`✅ Expected Plan: ${expectedPlan.name} - ${formatAmount(expectedPlan.amount)}`);
      console.log(`✅ Actual Plan: ${plan.item.name} - ${formatAmount(plan.item.amount)}`);

      if (expectedPlan.amount === plan.item.amount) {
        console.log('✅ PLAN AMOUNT MATCHES - User will be charged correctly!');
      } else {
        console.log('❌ PLAN AMOUNT MISMATCH - User will be charged wrong amount!');
        console.log(`❌ Expected: ${formatAmount(expectedPlan.amount)}`);
        console.log(`❌ Actual: ${formatAmount(plan.item.amount)}`);
      }
    } else {
      console.log('⚠️  Plan ID not in our expected configuration');
      console.log('⚠️  This might be an old test plan');
    }

    // Show what the user will see in the checkout
    console.log('\n🌪️  RAZORPAY CHECKOUT EXPERIENCE:');
    console.log('─'.repeat(50));
    console.log(`When user clicks "Pay", Razorpay will show:`);
    console.log(`• Plan: ${plan.item.name}`);
    console.log(`• Amount: ${formatAmount(plan.item.amount)}`);
    console.log(`• Currency: ${plan.item.currency}`);
    console.log(
      `• Billing: ${plan.period} (every ${plan.interval} ${plan.period}${plan.interval > 1 ? 's' : ''})`
    );

    if (plan.item.amount === 100) {
      console.log('\n❌ ISSUE IDENTIFIED:');
      console.log('❌ This is a ₹1 plan (100 paise)');
      console.log('❌ User will see ₹1 in checkout');
      console.log('❌ This is the root cause of the problem');
    } else {
      console.log('\n✅ CHECKOUT SHOULD SHOW CORRECT AMOUNT');
    }
  } catch (error: any) {
    console.error('❌ Failed to debug subscription:', error.message);
    console.error('This could mean:');
    console.error('• Subscription ID is incorrect');
    console.error('• Subscription was cancelled/deleted');
    console.error('• API access issues');
  }
}

// Run the debug
debugActiveSubscription().catch((error) => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});
