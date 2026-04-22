/**
 * Tier Display Utilities
 *
 * Centralized logic for displaying subscription tier names to users.
 *
 * **Business Rule**: All authenticated users default to "Free Tier"
 * unless they have explicitly subscribed to a paid plan.
 *
 * **Updated System (2025-10-25)**:
 * - Roles: User (default), Developer, Admin
 * - Tiers: Free, Explorer, Navigator, Voyager, Crew Member, Fleet Member, Armada Member
 * - Enterprise tier has been removed
 * - All users are Free tier by default unless they have a subscription or are manually made a Developer
 *
 * @module tierDisplay
 */

/**
 * User role type
 * - user: Default role for all users
 * - developer: Admin-level access for development
 * - admin: Full system administrative access
 */
export type UserRole = 'user' | 'developer' | 'admin';

/**
 * Subscription tier type
 * - free: Default free tier (2 blueprints/month) - ALL users start here
 * - explorer, navigator, voyager: Individual paid tiers
 * - crew, fleet, armada: Team/organization tiers
 * - Note: Developer is a role, not a tier - developers have unlimited access
 */
export type SubscriptionTier =
  | 'free'
  | 'explorer'
  | 'navigator'
  | 'voyager'
  | 'crew'
  | 'fleet'
  | 'armada';

/**
 * Get the user-facing display name for a subscription tier
 *
 * @param tier - The subscription tier from the database
 * @returns The formatted display name for the tier
 *
 * @example
 * getTierDisplayName('free') // returns "Free Tier"
 * getTierDisplayName('explorer') // returns "Explorer"
 * getTierDisplayName('navigator') // returns "Navigator"
 * getTierDisplayName('crew') // returns "Crew Member"
 */
export function getTierDisplayName(tier: string | null | undefined): string {
  const normalizedTier = (tier || 'free').toLowerCase();

  switch (normalizedTier) {
    case 'free':
      return 'Free Tier';
    case 'explorer':
      return 'Explorer';
    case 'navigator':
      return 'Navigator';
    case 'voyager':
      return 'Voyager';
    case 'crew':
      return 'Crew Member';
    case 'fleet':
      return 'Fleet Member';
    case 'armada':
      return 'Armada Member';
    default:
      return 'Free Tier';
  }
}

/**
 * Get the user-facing display name for a user role
 *
 * @param role - The user role from the database
 * @returns The formatted display name for the role
 *
 * @example
 * getRoleDisplayName('user') // returns "User"
 * getRoleDisplayName('developer') // returns "Developer"
 * getRoleDisplayName('admin') // returns "Admin"
 */
export function getRoleDisplayName(role: string | null | undefined): string {
  const normalizedRole = (role || 'user').toLowerCase();

  switch (normalizedRole) {
    case 'user':
      return 'User';
    case 'developer':
      return 'Developer';
    case 'admin':
      return 'Admin';
    default:
      return 'User';
  }
}

/**
 * Get a short tier display name (without "Member" suffix)
 * Used in compact UI contexts like badges and cards
 *
 * @param tier - The subscription tier from the database
 * @returns The short display name for the tier
 *
 * @example
 * getTierDisplayNameShort('free') // returns "Free"
 * getTierDisplayNameShort('explorer') // returns "Explorer"
 * getTierDisplayNameShort('navigator') // returns "Navigator"
 */
export function getTierDisplayNameShort(tier: string | null | undefined): string {
  const normalizedTier = (tier || 'free').toLowerCase();

  switch (normalizedTier) {
    case 'free':
      return 'Free';
    case 'explorer':
      return 'Explorer';
    case 'navigator':
      return 'Navigator';
    case 'voyager':
      return 'Voyager';
    case 'crew':
      return 'Crew';
    case 'fleet':
      return 'Fleet';
    case 'armada':
      return 'Armada';
    default:
      return 'Free';
  }
}

/**
 * Check if a tier is a paid subscription
 *
 * @param tier - The subscription tier from the database
 * @returns true if the tier is paid, false if free
 */
export function isPaidTier(tier: string | null | undefined): boolean {
  const normalizedTier = (tier || 'free').toLowerCase();
  return normalizedTier !== 'free';
}

/**
 * Check if a tier is the free tier
 *
 * @param tier - The subscription tier from the database
 * @returns true if the tier is the free tier
 */
export function isFreeTier(tier: string | null | undefined): boolean {
  const normalizedTier = (tier || 'free').toLowerCase();
  return normalizedTier === 'free';
}

/**
 * Check if a user has developer role
 *
 * @param role - The user role from the database
 * @returns true if the user has developer role
 */
export function isDeveloperRole(role: string | null | undefined): boolean {
  const normalizedRole = (role || 'user').toLowerCase();
  return normalizedRole === 'developer';
}

/**
 * Check if a user has admin role
 *
 * @param role - The user role from the database
 * @returns true if the user has admin role
 */
export function isAdminRole(role: string | null | undefined): boolean {
  const normalizedRole = (role || 'user').toLowerCase();
  return normalizedRole === 'admin';
}

/**
 * Check if a user has admin or developer privileges
 *
 * @param role - The user role from the database
 * @returns true if the user has admin or developer role
 */
export function hasAdminAccess(role: string | null | undefined): boolean {
  const normalizedRole = (role || 'user').toLowerCase();
  return ['admin', 'developer'].includes(normalizedRole);
}

/**
 * Get tier information including display name, icon color, and metadata
 *
 * @param tier - The subscription tier from the database
 * @returns Object containing tier display information
 */
export function getTierInfo(tier: string | null | undefined) {
  const normalizedTier = (tier || 'free').toLowerCase();

  const tierMap: Record<
    string,
    {
      displayName: string;
      shortName: string;
      color: string;
      isPaid: boolean;
      description: string;
      maxGenerations: number;
      maxSaved: number;
    }
  > = {
    free: {
      displayName: 'Free Tier',
      shortName: 'Free',
      color: 'from-blue-500 to-cyan-500',
      isPaid: false,
      description: 'Get started with 2 blueprints per month',
      maxGenerations: 2,
      maxSaved: 2,
    },
    explorer: {
      displayName: 'Explorer',
      shortName: 'Explorer',
      color: 'from-purple-500 to-indigo-500',
      isPaid: true,
      description: '5 blueprint generations and saves per month',
      maxGenerations: 5,
      maxSaved: 5,
    },
    navigator: {
      displayName: 'Navigator',
      shortName: 'Navigator',
      color: 'from-emerald-500 to-teal-500',
      isPaid: true,
      description: '25 blueprint generations and saves per month',
      maxGenerations: 25,
      maxSaved: 25,
    },
    voyager: {
      displayName: 'Voyager',
      shortName: 'Voyager',
      color: 'from-yellow-500 to-amber-500',
      isPaid: true,
      description: '40 blueprint generations and saves per month',
      maxGenerations: 40,
      maxSaved: 40,
    },
    crew: {
      displayName: 'Crew Member',
      shortName: 'Crew',
      color: 'from-pink-500 to-rose-500',
      isPaid: true,
      description: '10 blueprint generations and saves per month',
      maxGenerations: 10,
      maxSaved: 10,
    },
    fleet: {
      displayName: 'Fleet Member',
      shortName: 'Fleet',
      color: 'from-violet-500 to-purple-500',
      isPaid: true,
      description: '30 blueprint generations and saves per month',
      maxGenerations: 30,
      maxSaved: 30,
    },
    armada: {
      displayName: 'Armada Member',
      shortName: 'Armada',
      color: 'from-slate-600 to-slate-800',
      isPaid: true,
      description: '60 blueprint generations and saves per month',
      maxGenerations: 60,
      maxSaved: 60,
    },
  };

  return tierMap[normalizedTier] || tierMap.free;
}

/**
 * Get role information including display name and color
 *
 * @param role - The user role from the database
 * @returns Object containing role display information
 */
export function getRoleInfo(role: string | null | undefined) {
  const normalizedRole = (role || 'user').toLowerCase();

  const roleMap: Record<
    string,
    {
      displayName: string;
      color: string;
      description: string;
    }
  > = {
    user: {
      displayName: 'User',
      color: 'from-blue-500 to-cyan-500',
      description: 'Standard user access',
    },
    developer: {
      displayName: 'Developer',
      color: 'from-orange-500 to-red-500',
      description: 'Development and admin access',
    },
    admin: {
      displayName: 'Admin',
      color: 'from-red-500 to-pink-500',
      description: 'Full system administrative access',
    },
  };

  return roleMap[normalizedRole] || roleMap.user;
}

/**
 * Get the maximum number of blueprint generations allowed for a tier
 *
 * @param tier - The subscription tier from the database
 * @returns Maximum number of blueprint generations per month (-1 for unlimited)
 *
 * @example
 * getTierMaxGenerations('free') // returns 2
 * getTierMaxGenerations('explorer') // returns 5
 * getTierMaxGenerations('navigator') // returns 25
 */
export function getTierMaxGenerations(tier: string | null | undefined): number {
  const normalizedTier = (tier || 'free').toLowerCase();

  switch (normalizedTier) {
    case 'free':
      return 2;
    case 'explorer':
      return 5;
    case 'navigator':
      return 25;
    case 'voyager':
      return 40;
    case 'crew':
      return 10;
    case 'fleet':
      return 30;
    case 'armada':
      return 60;
    default:
      return 2;
  }
}

/**
 * Get the maximum number of blueprint saves allowed for a tier
 *
 * @param tier - The subscription tier from the database
 * @returns Maximum number of blueprint saves per month (-1 for unlimited)
 *
 * @example
 * getTierMaxSaved('free') // returns 2
 * getTierMaxSaved('explorer') // returns 5
 * getTierMaxSaved('navigator') // returns 25
 */
export function getTierMaxSaved(tier: string | null | undefined): number {
  const normalizedTier = (tier || 'free').toLowerCase();

  switch (normalizedTier) {
    case 'free':
      return 2;
    case 'explorer':
      return 5;
    case 'navigator':
      return 25;
    case 'voyager':
      return 40;
    case 'crew':
      return 10;
    case 'fleet':
      return 30;
    case 'armada':
      return 60;
    default:
      return 2;
  }
}

/**
 * Check if a user has unlimited access based on their role
 *
 * @param role - The user role from the database
 * @returns true if the user has unlimited access
 *
 * @example
 * hasUnlimitedAccess('developer') // returns true
 * hasUnlimitedAccess('admin') // returns true
 * hasUnlimitedAccess('user') // returns false
 */
export function hasUnlimitedAccess(role: string | null | undefined): boolean {
  const normalizedRole = (role || 'user').toLowerCase();
  return ['developer', 'admin'].includes(normalizedRole);
}

/**
 * Get the effective limits for a user based on their tier and role
 *
 * @param tier - The subscription tier from the database
 * @param role - The user role from the database
 * @returns Object containing effective limits
 *
 * @example
 * getUserEffectiveLimits('free', 'user') // returns { maxGenerations: 2, maxSaved: 2, isUnlimited: false }
 * getUserEffectiveLimits('explorer', 'developer') // returns { maxGenerations: -1, maxSaved: -1, isUnlimited: true }
 */
export function getUserEffectiveLimits(
  tier: string | null | undefined,
  role: string | null | undefined
) {
  if (hasUnlimitedAccess(role)) {
    return {
      maxGenerations: -1,
      maxSaved: -1,
      isUnlimited: true,
    };
  }

  return {
    maxGenerations: getTierMaxGenerations(tier),
    maxSaved: getTierMaxSaved(tier),
    isUnlimited: false,
  };
}

/**
 * Tier hierarchy for filtering pricing plans
 * Higher index = higher tier
 */
const INDIVIDUAL_TIER_HIERARCHY = ['free', 'explorer', 'navigator', 'voyager'];
const TEAM_TIER_HIERARCHY = ['crew', 'fleet', 'armada'];

/**
 * Get the plans that should be shown to a user based on their current tier
 * Users should only see upgrade options (higher tiers) in their category
 *
 * @param currentTier - The user's current subscription tier
 * @returns Object containing which individual and team plans should be shown
 *
 * @example
 * getAvailableUpgradePlans('free') // returns { individualPlans: ['explorer', 'navigator', 'voyager'], teamPlans: ['crew', 'fleet', 'armada'] }
 * getAvailableUpgradePlans('explorer') // returns { individualPlans: ['navigator', 'voyager'], teamPlans: ['crew', 'fleet', 'armada'] }
 * getAvailableUpgradePlans('crew') // returns { individualPlans: [], teamPlans: ['fleet', 'armada'] }
 * getAvailableUpgradePlans('armada') // returns { individualPlans: [], teamPlans: [] }
 */
export function getAvailableUpgradePlans(currentTier: string | null | undefined): {
  individualPlans: string[];
  teamPlans: string[];
} {
  const normalizedTier = (currentTier || 'free').toLowerCase();

  // Check if user is on an individual tier
  const individualTierIndex = INDIVIDUAL_TIER_HIERARCHY.indexOf(normalizedTier);
  const isIndividualTier = individualTierIndex !== -1;

  // Check if user is on a team tier
  const teamTierIndex = TEAM_TIER_HIERARCHY.indexOf(normalizedTier);
  const isTeamTier = teamTierIndex !== -1;

  let individualPlans: string[] = [];
  let teamPlans: string[] = [];

  if (isIndividualTier) {
    // Show higher individual tiers + all team tiers
    individualPlans = INDIVIDUAL_TIER_HIERARCHY.slice(individualTierIndex + 1);
    teamPlans = [...TEAM_TIER_HIERARCHY];
  } else if (isTeamTier) {
    // Show only higher team tiers (no individual tiers)
    individualPlans = [];
    teamPlans = TEAM_TIER_HIERARCHY.slice(teamTierIndex + 1);
  } else {
    // Unknown tier or null - show all plans (same as free tier)
    individualPlans = INDIVIDUAL_TIER_HIERARCHY.slice(1); // Skip 'free' itself
    teamPlans = [...TEAM_TIER_HIERARCHY];
  }

  return {
    individualPlans,
    teamPlans,
  };
}

/**
 * Check if a specific plan should be shown to a user based on their current tier
 *
 * @param planId - The plan ID to check (e.g., 'explorer', 'navigator', 'crew')
 * @param currentTier - The user's current subscription tier
 * @returns true if the plan should be shown, false otherwise
 *
 * @example
 * shouldShowPlan('navigator', 'free') // returns true
 * shouldShowPlan('explorer', 'navigator') // returns false
 * shouldShowPlan('fleet', 'crew') // returns true
 */
export function shouldShowPlan(planId: string, currentTier: string | null | undefined): boolean {
  const { individualPlans, teamPlans } = getAvailableUpgradePlans(currentTier);
  const normalizedPlanId = planId.toLowerCase();

  return individualPlans.includes(normalizedPlanId) || teamPlans.includes(normalizedPlanId);
}
