#!/usr/bin/env tsx

/**
 * Test Razorpay Plan Configuration
 *
 * This script verifies that the correct plan IDs and amounts are being used
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
 * Test configuration against actual Razorpay plans
 */
async function testConfiguration(): Promise<void> {
  console.log('🧪 Testing Razorpay Plan Configuration');
  console.log('=====================================\n');

  // Initialize Razorpay client
  const razorpay = initializeRazorpay();

  // Current configuration from razorpayPlans.ts
  const configuredPlans = {
    explorer: {
      monthly: 'plan_RZZwywnfGJHTuw', // Should be ₹1,599
      yearly: 'plan_RZZwzXQ1PJ4ZOn', // Should be ₹15,990
    },
    navigator: {
      monthly: 'plan_RZZx05RyiE9bz5', // Should be ₹3,499
      yearly: 'plan_RZZx0gnrvTUTVP', // Should be ₹34,990
    },
    voyager: {
      monthly: 'plan_RZZx1BzIJRZjk7', // Should be ₹6,999
      yearly: 'plan_RZZx1oIMLCNQ2N', // Should be ₹69,990
    },
  };

  const testPlans = {
    explorer: {
      monthly: 'plan_RZGf7WWLT1bBQp', // Should be ₹19 (OLD TEST PLAN)
      yearly: 'plan_RZGf8BFEN4OqI9', // Should be ₹190 (OLD TEST PLAN)
    },
    navigator: {
      monthly: 'plan_RZGf8oI6VAEW3h', // Should be ₹39 (OLD TEST PLAN)
      yearly: 'plan_RZGf9MME1Bs4Vd', // Should be ₹390 (OLD TEST PLAN)
    },
    voyager: {
      monthly: 'plan_RZGfA1SbZQnZyM', // Should be ₹79 (OLD TEST PLAN)
      yearly: 'plan_RZGfAdVwwRTQah', // Should be ₹790 (OLD TEST PLAN)
    },
  };

  console.log('✅ CHECKING CONFIGURED PLANS (Correct amounts):');
  console.log('─'.repeat(60));

  for (const [tier, plans] of Object.entries(configuredPlans)) {
    for (const [billing, planId] of Object.entries(plans)) {
      try {
        const plan = await razorpay.plans.fetch(planId);
        console.log(`🔹 ${tier} ${billing}: ${formatAmount(plan.item.amount)} (${planId}) ✅`);
      } catch (error: any) {
        console.log(`❌ ${tier} ${billing}: FAILED to fetch plan ${planId} - ${error.message}`);
      }
    }
  }

  console.log('\n⚠️  CHECKING OLD TEST PLANS (Wrong amounts):');
  console.log('─'.repeat(60));

  for (const [tier, plans] of Object.entries(testPlans)) {
    for (const [billing, planId] of Object.entries(plans)) {
      try {
        const plan = await razorpay.plans.fetch(planId);
        console.log(
          `🔸 ${tier} ${billing}: ${formatAmount(plan.item.amount)} (${planId}) ⚠️  OLD TEST PLAN`
        );
      } catch (error: any) {
        console.log(`✅ ${tier} ${billing}: OLD plan ${planId} not found or deleted - Good!`);
      }
    }
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('─'.repeat(30));
  console.log('1. Ensure your code uses the CORRECT plan IDs from configuredPlans');
  console.log('2. The OLD test plans should be deleted to avoid confusion');
  console.log('3. Verify the frontend uses the updated razorpayPlans.ts configuration');
  console.log('4. Test the payment flow to ensure correct amounts are charged');
}

// Run the test
testConfiguration().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
