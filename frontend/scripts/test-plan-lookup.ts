#!/usr/bin/env tsx

/**
 * Test Plan Lookup Function
 *
 * This script tests the getPlanId function to ensure it returns the correct plan IDs
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Import the functions from razorpayPlans
import { getPlanId, getPlanPrice, formatPrice } from '../lib/config/razorpayPlans';

function testPlanLookup(): void {
  console.log('🔍 Testing Plan Lookup Functions');
  console.log('==================================\n');

  const testCases = [
    { tier: 'explorer', billing: 'monthly' as const },
    { tier: 'explorer', billing: 'yearly' as const },
    { tier: 'navigator', billing: 'monthly' as const },
    { tier: 'navigator', billing: 'yearly' as const },
    { tier: 'voyager', billing: 'monthly' as const },
    { tier: 'voyager', billing: 'yearly' as const },
    { tier: 'crew', billing: 'monthly' as const },
    { tier: 'fleet', billing: 'monthly' as const },
    { tier: 'armada', billing: 'monthly' as const },
  ];

  console.log('✅ Plan ID Lookups:');
  console.log('─'.repeat(50));

  for (const testCase of testCases) {
    const planId = getPlanId(testCase.tier as any, testCase.billing);
    const planPrice = getPlanPrice(testCase.tier as any, testCase.billing);
    const formattedPrice = formatPrice(planPrice);

    console.log(`${testCase.tier} ${testCase.billing}:`);
    console.log(`  Plan ID: ${planId}`);
    console.log(`  Price: ${formattedPrice} (${planPrice} paise)`);
    console.log('');
  }

  console.log('🎯 Expected vs Actual:');
  console.log('─'.repeat(30));

  const expectedPlanIds = {
    'explorer monthly': 'plan_RZZwywnfGJHTuw', // ₹1,599
    'navigator monthly': 'plan_RZZx05RyiE9bz5', // ₹3,499
    'voyager monthly': 'plan_RZZx1BzIJRZjk7', // ₹6,999
  };

  for (const [key, expectedId] of Object.entries(expectedPlanIds)) {
    const [tier, billing] = key.split(' ');
    const actualId = getPlanId(tier as any, billing as any);
    const isCorrect = actualId === expectedId;

    console.log(`${key}: ${isCorrect ? '✅' : '❌'} ${actualId}`);
    if (!isCorrect) {
      console.log(`  Expected: ${expectedId}`);
      console.log(`  Actual:   ${actualId}`);
    }
  }
}

// Run the test
testPlanLookup();
