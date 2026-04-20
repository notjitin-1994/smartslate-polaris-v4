#!/usr/bin/env tsx

/**
 * Debug Live Subscription Creation
 *
 * This script tests the actual Razorpay subscription creation with our plan IDs
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
* Debug live Razorpay subscription plans and simulate subscription creation, logging plan details, mismatches, and a simulated API response.
* @example
* debugLiveSubscription()
* Promise<void> (resolves when all test cases have been processed and logs emitted)
* @returns {Promise<void>} Resolves when all subscription debug checks complete.
**/
async function debugLiveSubscription(): Promise<void> {
  console.log('🔍 Debugging Live Subscription Creation');
  console.log('=======================================\n');

  // Initialize Razorpay client
  const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  // Import our configuration
  const { getPlanId, getPlanPrice } = await import('../lib/config/razorpayPlans.ts');

  const testCases = [
    { tier: 'explorer', billingCycle: 'monthly' },
    { tier: 'navigator', billingCycle: 'monthly' },
    { tier: 'voyager', billingCycle: 'monthly' },
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing ${testCase.tier} ${testCase.billingCycle}:`);
    console.log('─'.repeat(50));

    try {
      // Get our plan configuration
      const planId = getPlanId(testCase.tier as any, testCase.billingCycle as any);
      const expectedPrice = getPlanPrice(testCase.tier as any, testCase.billingCycle as any);

      console.log(`Our plan ID: ${planId}`);
      console.log(`Our expected price: ${expectedPrice} paise (₹${expectedPrice / 100})`);

      // Fetch the actual plan from Razorpay to see what it contains
      const razorpayPlan = await razorpay.plans.fetch(planId);
      console.log(
        `Razorpay plan amount: ${razorpayPlan.item.amount} paise (₹${razorpayPlan.item.amount / 100})`
      );
      console.log(`Razorpay plan name: ${razorpayPlan.item.name}`);
      console.log(`Razorpay plan currency: ${razorpayPlan.item.currency}`);

      // Check if there's a mismatch
      if (razorpayPlan.item.amount !== expectedPrice) {
        console.log('❌ MISMATCH DETECTED!');
        console.log(`   Expected: ₹${expectedPrice / 100}`);
        console.log(`   Actual:   ₹${razorpayPlan.item.amount / 100}`);
        console.log(
          `   Difference: ₹${Math.abs((razorpayPlan.item.amount - expectedPrice) / 100)}`
        );
      } else {
        console.log('✅ Plan amounts match');
      }

      // Test creating a subscription (but don't actually create it)
      console.log('\n📝 Subscription creation test (simulation only):');
      console.log(`Would create subscription with plan_id: ${planId}`);
      console.log(`Subscription would charge: ₹${razorpayPlan.item.amount / 100}`);

      // This is what would be returned to the frontend
      const simulatedApiResponse = {
        success: true,
        data: {
          razorpaySubscriptionId: 'sub_test123',
          planAmount: razorpayPlan.item.amount, // This comes from Razorpay
          planCurrency: razorpayPlan.item.currency,
        },
      };

      console.log(`API would return planAmount: ${simulatedApiResponse.data.planAmount}`);
      console.log(`Frontend would divide by 100: ₹${simulatedApiResponse.data.planAmount / 100}`);

      if (simulatedApiResponse.data.planAmount / 100 === 1) {
        console.log('❌ THIS IS THE Rs. 1 ISSUE!');
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

// Run the test
debugLiveSubscription().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
