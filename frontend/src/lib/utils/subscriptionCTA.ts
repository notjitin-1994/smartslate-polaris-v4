/**
 * Subscription CTA (Call-to-Action) Utilities
 *
 * Determines the appropriate subscription messaging based on user's current tier
 */

import type { SubscriptionTier } from '@/types/subscription';

export interface SubscriptionCTAConfig {
  message: string;
  isButton: boolean; // false means it's a badge/label
  variant: 'upgrade' | 'subscribe' | 'max-tier';
  icon?: 'crown' | 'star' | 'badge';
  secondaryButton?: {
    message: string;
    icon: 'crown' | 'star' | 'badge';
  };
}

/**
 * Get the subscription CTA configuration based on user's tier
 */
export function getSubscriptionCTA(
  tier: SubscriptionTier | undefined | null
): SubscriptionCTAConfig {
  // Default to free tier if no tier is provided
  const currentTier = tier || 'free';

  switch (currentTier) {
    case 'free':
      return {
        message: 'Subscribe to Polaris',
        isButton: true,
        variant: 'subscribe',
        icon: 'crown',
      };

    case 'explorer':
      return {
        message: 'Upgrade to Navigator',
        isButton: true,
        variant: 'upgrade',
        icon: 'crown',
      };

    case 'navigator':
      return {
        message: 'Upgrade to Voyager',
        isButton: true,
        variant: 'upgrade',
        icon: 'crown',
      };

    case 'voyager':
      return {
        message: 'Max Tier',
        isButton: false,
        variant: 'max-tier',
        icon: 'badge',
        secondaryButton: {
          message: 'Upgrade to Teams',
          icon: 'star',
        },
      };

    case 'crew':
      return {
        message: 'Upgrade to Fleet',
        isButton: true,
        variant: 'upgrade',
        icon: 'star',
      };

    case 'fleet':
      return {
        message: 'Upgrade to Armada',
        isButton: true,
        variant: 'upgrade',
        icon: 'star',
      };

    case 'armada':
      return {
        message: 'Max Tier',
        isButton: false,
        variant: 'max-tier',
        icon: 'badge',
      };

    case 'enterprise':
      return {
        message: 'Enterprise Member',
        isButton: false,
        variant: 'max-tier',
        icon: 'badge',
      };

    case 'developer':
      return {
        message: 'Developer',
        isButton: false,
        variant: 'max-tier',
        icon: 'badge',
      };

    default:
      return {
        message: 'Subscribe to Polaris',
        isButton: true,
        variant: 'subscribe',
        icon: 'crown',
      };
  }
}

/**
 * Get the next tier name for display
 */
export function getNextTierName(tier: SubscriptionTier | undefined | null): string | null {
  const currentTier = tier || 'free';

  const tierOrder: SubscriptionTier[] = [
    'free',
    'explorer',
    'navigator',
    'voyager',
    'crew',
    'fleet',
    'armada',
  ];

  const currentIndex = tierOrder.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
    return null; // No next tier
  }

  const nextTier = tierOrder[currentIndex + 1];

  // Format tier name for display
  return nextTier.charAt(0).toUpperCase() + nextTier.slice(1);
}

/**
 * Check if user is on a team tier (crew, fleet, armada)
 */
export function isTeamTier(tier: SubscriptionTier | undefined | null): boolean {
  return tier === 'crew' || tier === 'fleet' || tier === 'armada';
}

/**
 * Check if user is on max tier (armada, enterprise, developer)
 */
export function isMaxTier(tier: SubscriptionTier | undefined | null): boolean {
  return tier === 'armada' || tier === 'enterprise' || tier === 'developer';
}
