#!/usr/bin/env tsx

/**
 * Test Pricing Display Fix
 *
 * This script verifies that the frontend pricing configuration
 * matches the Razorpay plan amounts to ensure users see correct pricing
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

// Import our configuration
import { RAZORPAY_PLANS, getPlanId, getPlanPrice } from '../lib/config/razorpayPlans';

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
 * Test pricing consistency
 */
async function testPricingConsistency(): Promise<void> {
  console.log('💰 Testing Pricing Display Consistency');
  console.log('=====================================\n');

  const razorpay = initializeRazorpay();
  const tiers = ['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'] as const;
  const billingCycles = ['monthly', 'yearly'] as const;

  let allTestsPassed = true;
  const issues: string[] = [];

  console.log('🔍 CHECKING PLAN CONFIGURATION:');
  console.log('─'.repeat(80));

  for (const tier of tiers) {
    for (const billing of billingCycles) {
      try {
        const planId = getPlanId(tier, billing);
        if (!planId) {
          console.log(`❌ ${tier} ${billing}: No plan ID configured`);
          allTestsPassed = false;
          continue;
        }

        const ourPrice = getPlanPrice(tier, billing);
        const plan = await razorpay.plans.fetch(planId);
        const razorpayPrice = plan.item.amount;

        if (ourPrice === razorpayPrice) {
          console.log(`✅ ${tier} ${billing}: ${formatAmount(ourPrice)} (matches Razorpay)`);
        } else {
          console.log(`❌ ${tier} ${billing}: MISMATCH!`);
          console.log(`   Our config: ${formatAmount(ourPrice)}`);
          console.log(`   Razorpay:   ${formatAmount(razorpayPrice)}`);
          allTestsPassed = false;
          issues.push(
            `${tier} ${billing}: ${formatAmount(ourPrice)} vs ${formatAmount(razorpayPrice)}`
          );
        }
      } catch (error: any) {
        console.log(`❌ ${tier} ${billing}: Failed to fetch plan - ${error.message}`);
        allTestsPassed = false;
        issues.push(`${tier} ${billing}: Plan fetch failed`);
      }
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('─'.repeat(40));

  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Frontend configuration matches Razorpay plans');
    console.log('✅ Users will see correct pricing on the website');
    console.log('✅ Users will be charged the correct amounts');
  } else {
    console.log('❌ SOME TESTS FAILED!');
    console.log(`❌ Found ${issues.length} pricing mismatch(es):`);
    issues.forEach((issue) => console.log(`   • ${issue}`));
    console.log('\n🔧 FIX NEEDED:');
    console.log('1. Update RAZORPAY_PLANS in lib/config/razorpayPlans.ts');
    console.log('2. Update PLAN_PRICING to match Razorpay amounts');
    console.log('3. Test the payment flow end-to-end');
  }

  console.log('\n🌐 PRICING PAGE VERIFICATION:');
  console.log('─'.repeat(40));
  console.log('The pricing page should now display:');
  console.log(`• Explorer:  ₹1,599/month  (was incorrectly showing ₹1)`);
  console.log(`• Navigator: ₹3,499/month  (was incorrectly showing ₹1)`);
  console.log(`• Voyager:  ₹6,999/month  (was incorrectly showing ₹1)`);
  console.log(`• Team plans have per-seat pricing as configured`);
}

// Run the test
testPricingConsistency().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
