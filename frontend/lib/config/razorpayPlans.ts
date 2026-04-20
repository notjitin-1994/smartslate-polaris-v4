/**
 * Razorpay Plan Configuration
 *
 * @description Central configuration for all Razorpay subscription plans
 * Maps subscription tiers to Razorpay plan IDs for both monthly and yearly billing
 *
 * @version 1.0.0
 * @date 2025-10-29
 *
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md - Section 13: Pricing Configuration
 * @see docs/RAZORPAY_SETUP_MANUAL_STEPS.md - Plan creation instructions
 */

import type { SubscriptionTier, BillingCycle, RazorpayPlanMapping } from '../../types/razorpay';

// ============================================================================
// Plan IDs Configuration
// ============================================================================

/**
 * Razorpay Plan IDs for each subscription tier
 *
 * **IMPORTANT SETUP INSTRUCTIONS**:
 * These are the LIVE Razorpay plan IDs with CORRECT PRICING as verified on 2025-10-30
 *
 * **Verification Details**:
 * - Test script confirmed these plans have correct amounts in Razorpay dashboard
 * - Individual plans: ₹1,599, ₹3,499, ₹6,999 (NOT ₹1 test plans)
 * - Team plans: ₹1,999, ₹5,399, ₹10,899 (per seat)
 *
 * **Plan ID Format**:
 * - Live Mode: Starts with `plan_RZ` (e.g., `plan_RZZwywnfGJHTuw`)
 * - All plan IDs below have been verified to exist and have correct pricing
 *
 * **CRITICAL**: Do NOT use old test plans (plan_RZGf7WWLT1bBQp, etc.) which have ₹1 pricing
 */
export const RAZORPAY_PLANS: RazorpayPlanMapping = {
  /**
   * Free Tier (No Razorpay plan - users don't pay)
   */
  free: {
    monthly: null,
    yearly: null,
  },

  /**
   * Explorer Tier - INDIVIDUAL PLANS
   * ✅ VERIFIED CORRECT PRICING (₹1,599 monthly, ₹15,990 yearly)
   * These are the ACTIVE plans with proper pricing from Razorpay dashboard
   */
  explorer: {
    monthly: 'plan_RZZwywnfGJHTuw', // ✅ VERIFIED: ₹1,599 monthly (NOT ₹1)
    yearly: 'plan_RZZwzXQ1PJ4ZOn', // ✅ VERIFIED: ₹15,990 yearly (NOT ₹1)
  },

  /**
   * Navigator Tier - INDIVIDUAL PLANS
   * ✅ VERIFIED CORRECT PRICING (₹3,499 monthly, ₹34,990 yearly)
   * These are the ACTIVE plans with proper pricing from Razorpay dashboard
   */
  navigator: {
    monthly: 'plan_RZZx05RyiE9bz5', // ✅ VERIFIED: ₹3,499 monthly (NOT ₹1)
    yearly: 'plan_RZZx0gnrvTUTVP', // ✅ VERIFIED: ₹34,990 yearly (NOT ₹1)
  },

  /**
   * Voyager Tier - INDIVIDUAL PLANS
   * ✅ VERIFIED CORRECT PRICING (₹6,999 monthly, ₹69,990 yearly)
   * These are the ACTIVE plans with proper pricing from Razorpay dashboard
   */
  voyager: {
    monthly: 'plan_RZZx1BzIJRZjk7', // ✅ VERIFIED: ₹6,999 monthly (NOT ₹1)
    yearly: 'plan_RZZx1oIMLCNQ2N', // ✅ VERIFIED: ₹69,990 yearly (NOT ₹1)
  },

  /**
   * Crew Tier - TEAM PLANS (per seat pricing)
   * ✅ VERIFIED CORRECT PRICING (₹1,999 monthly, ₹19,990 yearly per seat)
   * These are the ACTIVE team plans from Razorpay dashboard
   */
  crew: {
    monthly: 'plan_RZGvU14apsuv5m', // ✅ VERIFIED: ₹1,999 monthly per seat
    yearly: 'plan_RZGvUZ1hWQBjQ0', // ✅ VERIFIED: ₹19,990 yearly per seat
  },

  /**
   * Fleet Tier - TEAM PLANS (per seat pricing)
   * ✅ VERIFIED CORRECT PRICING (₹5,399 monthly, ₹53,990 yearly per seat)
   * These are the ACTIVE team plans from Razorpay dashboard
   */
  fleet: {
    monthly: 'plan_RZGvVAS3xe2Bsa', // ✅ VERIFIED: ₹5,399 monthly per seat
    yearly: 'plan_RZGvVfimUUckhh', // ✅ VERIFIED: ₹53,990 yearly per seat
  },

  /**
   * Armada Tier - TEAM PLANS (per seat pricing)
   * ✅ VERIFIED CORRECT PRICING (₹10,899 monthly, ₹1,08,990 yearly per seat)
   * These are the ACTIVE team plans from Razorpay dashboard
   */
  armada: {
    monthly: 'plan_RZGvWAoBBsdPVp', // ✅ VERIFIED: ₹10,899 monthly per seat
    yearly: 'plan_RZGvWpVjLdDakb', // ✅ VERIFIED: ₹1,08,990 yearly per seat
  },
} as const;

// ============================================================================
// Plan Pricing Configuration (For Display Purposes)
// ============================================================================

/**
 * Plan pricing in INR (paise)
 * 1 INR = 100 paise
 * Used for creating plans and displaying prices
 *
 * Note: To enable USD pricing, you need to activate international payments
 * in your Razorpay dashboard at https://dashboard.razorpay.com/
 */
export const PLAN_PRICING = {
  explorer: {
    monthly: 159900, // ₹1,599 per month (corrected pricing)
    yearly: 1599000, // ₹15,990 per year (corrected pricing)
  },
  navigator: {
    monthly: 349900, // ₹3,499 per month (corrected pricing)
    yearly: 3499000, // ₹34,990 per year (corrected pricing)
  },
  voyager: {
    monthly: 699900, // ₹6,999 per month (corrected pricing)
    yearly: 6999000, // ₹69,990 per year (corrected pricing)
  },
  crew: {
    monthly: 199900, // ₹1,999 per seat per month (verified pricing)
    yearly: 1999000, // ₹19,990 per seat per year (verified pricing)
  },
  fleet: {
    monthly: 539900, // ₹5,399 per seat per month (verified pricing)
    yearly: 5399000, // ₹53,990 per seat per year (verified pricing)
  },
  armada: {
    monthly: 1089900, // ₹10,899 per seat per month (verified pricing)
    yearly: 10899000, // ₹108,990 per seat per year (verified pricing)
  },
} as const;

/**
 * Plan limits (blueprints per month)
 */
export const PLAN_LIMITS = {
  free: 2, // Lifetime free tier: 2 blueprints/month
  explorer: 5,
  navigator: 25,
  voyager: 50,
  crew: 10, // per seat
  fleet: 30, // per seat
  armada: 60, // per seat
} as const;

/**
 * Team-based tiers (require seat management)
 */
export const TEAM_TIERS: SubscriptionTier[] = ['crew', 'fleet', 'armada'];

/**
 * Individual tiers
 */
export const INDIVIDUAL_TIERS: SubscriptionTier[] = ['free', 'explorer', 'navigator', 'voyager'];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Razorpay plan ID for a specific tier and billing cycle
 *
 * @param tier - Subscription tier (e.g., 'navigator', 'voyager')
 * @param billing - Billing cycle ('monthly' or 'yearly')
 * @returns Razorpay plan ID string or null if not configured
 *
 * @example
 * ```typescript
 * const planId = getPlanId('navigator', 'monthly');
 * // Returns: 'plan_XXXXX' or null if not set
 * ```
 */
export function getPlanId(tier: SubscriptionTier, billing: BillingCycle): string | null {
  // Free tier doesn't have a plan ID
  if (tier === 'free') {
    return null;
  }

  const plan = RAZORPAY_PLANS[tier as keyof typeof RAZORPAY_PLANS];
  if (!plan) {
    console.error(`[Razorpay Config] Invalid tier: ${tier}`);
    return null;
  }

  const planId = plan[billing];
  if (!planId) {
    console.warn(
      `[Razorpay Config] Plan ID not configured for tier "${tier}" with billing "${billing}". ` +
        'Please create the plan in Razorpay dashboard and update razorpayPlans.ts'
    );
    return null;
  }

  return planId;
}

/**
 * Get plan pricing in paise for a specific tier and billing cycle
 *
 * @param tier - Subscription tier
 * @param billing - Billing cycle ('monthly' or 'yearly')
 * @returns Price in paise or 0 for free tier
 *
 * @example
 * ```typescript
 * const price = getPlanPrice('navigator', 'monthly');
 * // Returns: 3900 (₹39 in paise)
 * ```
 */
export function getPlanPrice(tier: SubscriptionTier, billing: BillingCycle): number {
  if (tier === 'free') {
    return 0;
  }

  const pricing = PLAN_PRICING[tier as keyof typeof PLAN_PRICING];
  return pricing ? pricing[billing] : 0;
}

/**
 * Convert paise to rupees for display
 *
 * @param paise - Amount in paise
 * @returns Amount in rupees as number
 *
 * @example
 * ```typescript
 * const rupees = paiseToRupees(3900);
 * // Returns: 39
 * ```
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Convert rupees to paise for API calls
 *
 * @param rupees - Amount in rupees
 * @returns Amount in paise as number
 *
 * @example
 * ```typescript
 * const paise = rupeesToPaise(39);
 * // Returns: 3900
 * ```
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format price for display with currency symbol
 *
 * @param paise - Amount in paise
 * @param currency - Currency symbol (default: '₹')
 * @returns Formatted price string
 *
 * @example
 * ```typescript
 * const formatted = formatPrice(3900);
 * // Returns: "₹39"
 *
 * const formattedWithDecimals = formatPrice(3950);
 * // Returns: "₹39.50"
 * ```
 */
export function formatPrice(paise: number, currency: string = '₹'): string {
  const rupees = paiseToRupees(paise);
  return `${currency}${rupees.toLocaleString('en-IN')}`;
}

/**
 * Check if a tier is a team-based plan
 *
 * @param tier - Subscription tier
 * @returns true if team-based, false otherwise
 *
 * @example
 * ```typescript
 * isTeamTier('crew');     // true
 * isTeamTier('navigator'); // false
 * ```
 */
export function isTeamTier(tier: SubscriptionTier): boolean {
  return TEAM_TIERS.includes(tier);
}

/**
 * Get blueprint limit for a specific tier
 *
 * @param tier - Subscription tier
 * @returns Blueprint limit per month
 *
 * @example
 * ```typescript
 * const limit = getPlanLimit('navigator');
 * // Returns: 25
 * ```
 */
export function getPlanLimit(tier: SubscriptionTier): number {
  return PLAN_LIMITS[tier] || 0;
}

/**
 * Validate that all required plan IDs are configured
 *
 * @param billing - Billing cycle to validate ('monthly' or 'yearly')
 * @returns Object with validation result and missing plans
 *
 * @example
 * ```typescript
 * const validation = validatePlanConfiguration('monthly');
 * if (!validation.isValid) {
 *   console.error('Missing plan IDs:', validation.missing);
 * }
 * ```
 */
export function validatePlanConfiguration(billing: BillingCycle = 'monthly'): {
  isValid: boolean;
  missing: SubscriptionTier[];
} {
  const missing: SubscriptionTier[] = [];

  // Exclude 'free' tier as it doesn't need a plan ID
  const tiersToCheck: SubscriptionTier[] = [
    'explorer',
    'navigator',
    'voyager',
    'crew',
    'fleet',
    'armada',
  ];

  for (const tier of tiersToCheck) {
    const planId = getPlanId(tier, billing);
    if (!planId) {
      missing.push(tier);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

// ============================================================================
// Development Mode Warnings
// ============================================================================

/**
 * Check plan configuration and log warnings in development
 * This runs automatically when the module is imported
 */
if (process.env.NODE_ENV === 'development') {
  const monthlyValidation = validatePlanConfiguration('monthly');
  const yearlyValidation = validatePlanConfiguration('yearly');

  if (!monthlyValidation.isValid || !yearlyValidation.isValid) {
    console.warn(
      '⚠️  [Razorpay Config] Some plan IDs are not configured:\n' +
        `   Monthly: ${monthlyValidation.missing.length > 0 ? monthlyValidation.missing.join(', ') : 'All configured ✅'}\n` +
        `   Yearly: ${yearlyValidation.missing.length > 0 ? yearlyValidation.missing.join(', ') : 'All configured ✅'}\n` +
        '\n' +
        '   To fix this:\n' +
        '   1. Create plans in Razorpay Dashboard\n' +
        '   2. Or run: npm run create-razorpay-plans\n' +
        '   3. Update RAZORPAY_PLANS in lib/config/razorpayPlans.ts\n'
    );
  }
}
