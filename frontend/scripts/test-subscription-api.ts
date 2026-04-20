#!/usr/bin/env tsx

/**
 * Test Subscription API
 *
 * This script tests what the subscription API returns for different tiers
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testSubscriptionAPI(): Promise<void> {
  console.log('🧪 Testing Subscription API Response');
  console.log('===================================\n');

  const testCases = [
    { tier: 'explorer', billingCycle: 'monthly' },
    { tier: 'navigator', billingCycle: 'monthly' },
    { tier: 'voyager', billingCycle: 'monthly' },
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing ${testCase.tier} ${testCase.billingCycle}:`);
    console.log('─'.repeat(40));

    try {
      // This would normally require authentication
      // For now, let's simulate what the API would return by checking our configuration
      const { getPlanId, getPlanPrice, formatPrice } = await import(
        '../lib/config/razorpayPlans.ts'
      );

      const planId = getPlanId(testCase.tier as any, testCase.billingCycle as any);
      const planPriceInPaise = getPlanPrice(testCase.tier as any, testCase.billingCycle as any);
      const planPriceInRupees = planPriceInPaise / 100;

      console.log(`Plan ID: ${planId}`);
      console.log(`Plan Price (paise): ${planPriceInPaise}`);
      console.log(`Plan Price (rupees): ₹${planPriceInRupees.toLocaleString('en-IN')}`);

      // Simulate what Razorpay would return
      const simulatedRazorpayResponse = {
        id: planId,
        item: {
          name: `${testCase.tier.charAt(0).toUpperCase() + testCase.tier.slice(1)} Plan - Monthly`,
          amount: planPriceInPaise, // Razorpay returns amount in paise
          currency: 'INR',
        },
      };

      console.log(`Razorpay would return: ₹${simulatedRazorpayResponse.item.amount / 100}`);

      // Check what the API would return
      const simulatedAPIResponse = {
        success: true,
        data: {
          razorpaySubscriptionId: 'sub_test123',
          planAmount: simulatedRazorpayResponse.item.amount, // This is in paise
          planCurrency: 'INR',
          customerName: 'Test User',
          customerEmail: 'test@example.com',
        },
      };

      console.log(`API would return planAmount: ${simulatedAPIResponse.data.planAmount} paise`);
      console.log(`After dividing by 100: ₹${simulatedAPIResponse.data.planAmount / 100}`);

      // This is what gets passed to Razorpay checkout
      const checkoutPrice = simulatedAPIResponse.data.planAmount / 100;
      console.log(`Final checkout price: ₹${checkoutPrice}`);

      if (checkoutPrice === 1) {
        console.log('❌ ISSUE DETECTED: Price is ₹1');
      } else {
        console.log('✅ Price looks correct');
      }
    } catch (error: any) {
      console.error(`❌ Error testing ${testCase.tier}:`, error.message);
    }
  }
}

// Run the test
testSubscriptionAPI().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
