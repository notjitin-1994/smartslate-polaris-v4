#!/usr/bin/env tsx

/**
 * Create Razorpay Plans Script
 *
 * @description Automatically creates all required subscription plans in Razorpay
 * @version 1.0.0
 * @date 2025-10-29
 *
 * Usage: npm run create-razorpay-plans
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

// Plan configuration with correct pricing as per task requirements
const PLAN_CONFIG = [
  {
    tier: 'explorer',
    name: 'Explorer Plan - Monthly',
    description: 'Perfect for individual learners starting their journey',
    amount: 159900, // ₹1,599 in paise (as per task requirements)
    currency: 'INR',
    period: 'monthly', // billing period
    notes: {
      tier: 'explorer',
      billing_cycle: 'monthly',
      blueprints_limit: '5',
      target_audience: 'individual_creators',
    },
  },
  {
    tier: 'explorer',
    name: 'Explorer Plan - Yearly',
    description: 'Perfect for individual learners starting their journey (16% discount)',
    amount: 1599000, // ₹15,990 in paise (as per task requirements)
    currency: 'INR',
    period: 'yearly', // billing period
    notes: {
      tier: 'explorer',
      billing_cycle: 'yearly',
      blueprints_limit: '5',
      target_audience: 'individual_creators',
      discount: '16_percent',
    },
  },
  {
    tier: 'navigator',
    name: 'Navigator Plan - Monthly',
    description: 'Ideal for professionals and serious creators',
    amount: 329900, // ₹3,299 in paise (as per task requirements)
    currency: 'INR',
    period: 'monthly', // billing period
    notes: {
      tier: 'navigator',
      billing_cycle: 'monthly',
      blueprints_limit: '25',
      target_audience: 'professionals',
    },
  },
  {
    tier: 'navigator',
    name: 'Navigator Plan - Yearly',
    description: 'Ideal for professionals and serious creators (16% discount)',
    amount: 3299000, // ₹32,990 in paise (as per task requirements)
    currency: 'INR',
    period: 'yearly', // billing period
    notes: {
      tier: 'navigator',
      billing_cycle: 'yearly',
      blueprints_limit: '25',
      target_audience: 'professionals',
      discount: '16_percent',
    },
  },
  {
    tier: 'voyager',
    name: 'Voyager Plan - Monthly',
    description: 'Comprehensive solution for power users and experts',
    amount: 669900, // ₹6,699 in paise (as per task requirements)
    currency: 'INR',
    period: 'monthly', // billing period
    notes: {
      tier: 'voyager',
      billing_cycle: 'monthly',
      blueprints_limit: '50',
      target_audience: 'power_users',
    },
  },
  {
    tier: 'voyager',
    name: 'Voyager Plan - Yearly',
    description: 'Comprehensive solution for power users and experts (16% discount)',
    amount: 6699000, // ₹66,990 in paise (as per task requirements)
    currency: 'INR',
    period: 'yearly', // billing period
    notes: {
      tier: 'voyager',
      billing_cycle: 'yearly',
      blueprints_limit: '50',
      target_audience: 'power_users',
      discount: '16_percent',
    },
  },
  {
    tier: 'crew',
    name: 'Crew Plan - Monthly (per seat)',
    description: 'Team collaboration for small groups and startups',
    amount: 199900, // ₹1,999 in paise per seat (as per task requirements)
    currency: 'INR',
    period: 'monthly', // billing period
    notes: {
      tier: 'crew',
      billing_cycle: 'monthly',
      blueprints_limit: '10_per_seat',
      target_audience: 'small_teams',
      pricing_model: 'per_seat',
    },
  },
  {
    tier: 'crew',
    name: 'Crew Plan - Yearly (per seat)',
    description: 'Team collaboration for small groups and startups (16% discount)',
    amount: 1999000, // ₹19,990 in paise per seat (as per task requirements)
    currency: 'INR',
    period: 'yearly', // billing period
    notes: {
      tier: 'crew',
      billing_cycle: 'yearly',
      blueprints_limit: '10_per_seat',
      target_audience: 'small_teams',
      pricing_model: 'per_seat',
      discount: '16_percent',
    },
  },
  {
    tier: 'fleet',
    name: 'Fleet Plan - Monthly (per seat)',
    description: 'Advanced team features for growing organizations',
    amount: 539900, // ₹5,399 in paise per seat (as per task requirements)
    currency: 'INR',
    period: 'monthly', // billing period
    notes: {
      tier: 'fleet',
      billing_cycle: 'monthly',
      blueprints_limit: '30_per_seat',
      target_audience: 'medium_teams',
      pricing_model: 'per_seat',
    },
  },
  {
    tier: 'fleet',
    name: 'Fleet Plan - Yearly (per seat)',
    description: 'Advanced team features for growing organizations (16% discount)',
    amount: 5399000, // ₹53,990 in paise per seat (as per task requirements)
    currency: 'INR',
    period: 'yearly', // billing period
    notes: {
      tier: 'fleet',
      billing_cycle: 'yearly',
      blueprints_limit: '30_per_seat',
      target_audience: 'medium_teams',
      pricing_model: 'per_seat',
      discount: '16_percent',
    },
  },
  {
    tier: 'armada',
    name: 'Armada Plan - Monthly (per seat)',
    description: 'Enterprise-grade solution for large teams',
    amount: 1089900, // ₹10,899 in paise per seat (as per task requirements)
    currency: 'INR',
    period: 'monthly', // billing period
    notes: {
      tier: 'armada',
      billing_cycle: 'monthly',
      blueprints_limit: '60_per_seat',
      target_audience: 'large_teams',
      pricing_model: 'per_seat',
    },
  },
  {
    tier: 'armada',
    name: 'Armada Plan - Yearly (per seat)',
    description: 'Enterprise-grade solution for large teams (16% discount)',
    amount: 10899000, // ₹108,990 in paise per seat (as per task requirements)
    currency: 'INR',
    period: 'yearly', // billing period
    notes: {
      tier: 'armada',
      billing_cycle: 'yearly',
      blueprints_limit: '60_per_seat',
      target_audience: 'large_teams',
      pricing_model: 'per_seat',
      discount: '16_percent',
    },
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
 * Create a single plan in Razorpay
 */
async function createPlan(razorpay: any, planConfig: any): Promise<string | null> {
  try {
    console.log(`📝 Creating plan: ${planConfig.name}...`);

    const plan = await razorpay.plans.create({
      period: planConfig.period,
      interval: 1,
      item: {
        name: planConfig.name,
        description: planConfig.description,
        amount: planConfig.amount,
        currency: planConfig.currency,
      },
      notes: {
        ...planConfig.notes,
        created_by: 'create-razorpay-plans-script',
        created_at: new Date().toISOString(),
        app_name: 'SmartSlate Polaris v3',
      },
    });

    console.log(`✅ Created plan: ${plan.id} - ${planConfig.name}`);
    return plan.id;
  } catch (error: any) {
    console.error(`❌ Failed to create plan: ${planConfig.name}`);
    console.error(`   Error: ${error.error?.description || error.message}`);
    return null;
  }
}

/**
 * Generate updated razorpayPlans.ts content
 */
function generateUpdatedConfig(createdPlans: Map<string, string>): string {
  const configLines = [
    'export const RAZORPAY_PLANS: RazorpayPlanMapping = {',
    '  /**',
    "   * Free Tier (No Razorpay plan - users don't pay)",
    '   */',
    '  free: {',
    '    monthly: null,',
    '    yearly: null,',
    '  },',
    '',
  ];

  const tiers = ['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];

  tiers.forEach((tier) => {
    const monthlyPlanId = createdPlans.get(`${tier}-monthly`);
    const yearlyPlanId = createdPlans.get(`${tier}-yearly`);

    configLines.push(`  /**`);
    configLines.push(`   * ${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`);
    configLines.push(`   * Plan IDs automatically generated by create-razorpay-plans script`);
    configLines.push(`   * Generated on: ${new Date().toISOString()}`);
    configLines.push(`   */`);
    configLines.push(`  ${tier}: {`);
    configLines.push(
      `    monthly: ${monthlyPlanId ? `'${monthlyPlanId}'` : 'null'}, // Plan ID for monthly billing`
    );
    configLines.push(
      `    yearly: ${yearlyPlanId ? `'${yearlyPlanId}'` : 'null'},   // Plan ID for yearly billing`
    );
    configLines.push(`  },`);
    configLines.push('');
  });

  configLines.push('} as const;');

  return configLines.join('\n');
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🚀 Creating Razorpay Plans for SmartSlate Polaris v3');
  console.log('================================================\n');

  // Validate environment
  validateEnvironment();

  // Initialize Razorpay client
  const razorpay = initializeRazorpay();
  const createdPlans = new Map<string, string>();
  const failedPlans: string[] = [];

  // Create all plans
  for (const planConfig of PLAN_CONFIG) {
    const key = `${planConfig.tier}-${planConfig.period === 1 ? 'monthly' : 'yearly'}`;
    const planId = await createPlan(razorpay, planConfig);

    if (planId) {
      createdPlans.set(key, planId);
    } else {
      failedPlans.push(key);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${createdPlans.size} plans`);
  console.log(`❌ Failed to create: ${failedPlans.length} plans`);

  if (failedPlans.length > 0) {
    console.log('\n❌ Failed plans:');
    failedPlans.forEach((plan) => console.log(`   - ${plan}`));
  }

  if (createdPlans.size > 0) {
    console.log('\n📝 Generated Plan IDs:');
    createdPlans.forEach((planId, key) => {
      console.log(`   ${key}: ${planId}`);
    });

    // Generate updated configuration
    const updatedConfig = generateUpdatedConfig(createdPlans);

    console.log('\n📄 Updated razorpayPlans.ts content:');
    console.log('─'.repeat(50));
    console.log(updatedConfig);
    console.log('─'.repeat(50));

    console.log('\n🔧 Next steps:');
    console.log('1. Copy the generated configuration above');
    console.log('2. Update frontend/lib/config/razorpayPlans.ts');
    console.log('3. Replace the RAZORPAY_PLANS object with the new content');
    console.log('4. Restart your development server');
  }

  console.log('\n🎉 Script completed!');
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
