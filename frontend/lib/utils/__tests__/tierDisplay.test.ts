/**
 * Unit Tests: lib/utils/tierDisplay.ts
 *
 * Comprehensive test coverage for subscription tier display utilities.
 * These functions are critical for the subscription system and business logic.
 *
 * Coverage:
 * - Tier display name formatting
 * - Role display name formatting
 * - Tier classification (free/paid)
 * - Role classification (user/developer/admin)
 * - Tier limits and quotas
 * - Upgrade plan filtering
 * - Edge cases (null, undefined, invalid values)
 */

import { describe, it, expect } from 'vitest';
import {
  getTierDisplayName,
  getTierDisplayNameShort,
  getRoleDisplayName,
  isPaidTier,
  isFreeTier,
  isDeveloperRole,
  isAdminRole,
  hasAdminAccess,
  getTierInfo,
  getRoleInfo,
  getTierMaxGenerations,
  getTierMaxSaved,
  hasUnlimitedAccess,
  getUserEffectiveLimits,
  getAvailableUpgradePlans,
  shouldShowPlan,
} from '../tierDisplay';

describe('tierDisplay utilities', () => {
  describe('getTierDisplayName', () => {
    it('should return correct display names for all tiers', () => {
      expect(getTierDisplayName('free')).toBe('Free Tier');
      expect(getTierDisplayName('explorer')).toBe('Explorer');
      expect(getTierDisplayName('navigator')).toBe('Navigator');
      expect(getTierDisplayName('voyager')).toBe('Voyager');
      expect(getTierDisplayName('crew')).toBe('Crew Member');
      expect(getTierDisplayName('fleet')).toBe('Fleet Member');
      expect(getTierDisplayName('armada')).toBe('Armada Member');
    });

    it('should handle case insensitivity', () => {
      expect(getTierDisplayName('FREE')).toBe('Free Tier');
      expect(getTierDisplayName('Explorer')).toBe('Explorer');
      expect(getTierDisplayName('NAVIGATOR')).toBe('Navigator');
    });

    it('should default to "Free Tier" for null/undefined', () => {
      expect(getTierDisplayName(null)).toBe('Free Tier');
      expect(getTierDisplayName(undefined)).toBe('Free Tier');
    });

    it('should default to "Free Tier" for unknown tiers', () => {
      expect(getTierDisplayName('invalid')).toBe('Free Tier');
      expect(getTierDisplayName('unknown')).toBe('Free Tier');
      expect(getTierDisplayName('')).toBe('Free Tier');
    });
  });

  describe('getTierDisplayNameShort', () => {
    it('should return short names without "Member" suffix', () => {
      expect(getTierDisplayNameShort('free')).toBe('Free');
      expect(getTierDisplayNameShort('explorer')).toBe('Explorer');
      expect(getTierDisplayNameShort('navigator')).toBe('Navigator');
      expect(getTierDisplayNameShort('voyager')).toBe('Voyager');
      expect(getTierDisplayNameShort('crew')).toBe('Crew');
      expect(getTierDisplayNameShort('fleet')).toBe('Fleet');
      expect(getTierDisplayNameShort('armada')).toBe('Armada');
    });

    it('should handle null/undefined', () => {
      expect(getTierDisplayNameShort(null)).toBe('Free');
      expect(getTierDisplayNameShort(undefined)).toBe('Free');
    });

    it('should default to "Free" for unknown tiers', () => {
      expect(getTierDisplayNameShort('invalid')).toBe('Free');
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display names for all roles', () => {
      expect(getRoleDisplayName('user')).toBe('User');
      expect(getRoleDisplayName('developer')).toBe('Developer');
      expect(getRoleDisplayName('admin')).toBe('Admin');
    });

    it('should handle case insensitivity', () => {
      expect(getRoleDisplayName('USER')).toBe('User');
      expect(getRoleDisplayName('Developer')).toBe('Developer');
      expect(getRoleDisplayName('ADMIN')).toBe('Admin');
    });

    it('should default to "User" for null/undefined', () => {
      expect(getRoleDisplayName(null)).toBe('User');
      expect(getRoleDisplayName(undefined)).toBe('User');
    });

    it('should default to "User" for unknown roles', () => {
      expect(getRoleDisplayName('invalid')).toBe('User');
      expect(getRoleDisplayName('')).toBe('User');
    });
  });

  describe('isPaidTier', () => {
    it('should return false for free tier', () => {
      expect(isPaidTier('free')).toBe(false);
    });

    it('should return true for all paid tiers', () => {
      expect(isPaidTier('explorer')).toBe(true);
      expect(isPaidTier('navigator')).toBe(true);
      expect(isPaidTier('voyager')).toBe(true);
      expect(isPaidTier('crew')).toBe(true);
      expect(isPaidTier('fleet')).toBe(true);
      expect(isPaidTier('armada')).toBe(true);
    });

    it('should default to false for null/undefined', () => {
      expect(isPaidTier(null)).toBe(false);
      expect(isPaidTier(undefined)).toBe(false);
    });

    it('should return true for unknown tiers (treated as paid)', () => {
      expect(isPaidTier('invalid')).toBe(true);
    });
  });

  describe('isFreeTier', () => {
    it('should return true for free tier', () => {
      expect(isFreeTier('free')).toBe(true);
    });

    it('should return false for paid tiers', () => {
      expect(isFreeTier('explorer')).toBe(false);
      expect(isFreeTier('navigator')).toBe(false);
      expect(isFreeTier('voyager')).toBe(false);
      expect(isFreeTier('crew')).toBe(false);
      expect(isFreeTier('fleet')).toBe(false);
      expect(isFreeTier('armada')).toBe(false);
    });

    it('should default to true for null/undefined', () => {
      expect(isFreeTier(null)).toBe(true);
      expect(isFreeTier(undefined)).toBe(true);
    });

    it('should return false for unknown tiers (not free)', () => {
      expect(isFreeTier('invalid')).toBe(false);
    });
  });

  describe('isDeveloperRole', () => {
    it('should return true for developer role', () => {
      expect(isDeveloperRole('developer')).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(isDeveloperRole('user')).toBe(false);
      expect(isDeveloperRole('admin')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isDeveloperRole('DEVELOPER')).toBe(true);
      expect(isDeveloperRole('Developer')).toBe(true);
    });

    it('should default to false for null/undefined', () => {
      expect(isDeveloperRole(null)).toBe(false);
      expect(isDeveloperRole(undefined)).toBe(false);
    });
  });

  describe('isAdminRole', () => {
    it('should return true for admin role', () => {
      expect(isAdminRole('admin')).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(isAdminRole('user')).toBe(false);
      expect(isAdminRole('developer')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(isAdminRole('ADMIN')).toBe(true);
      expect(isAdminRole('Admin')).toBe(true);
    });

    it('should default to false for null/undefined', () => {
      expect(isAdminRole(null)).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
    });
  });

  describe('hasAdminAccess', () => {
    it('should return true for admin and developer roles', () => {
      expect(hasAdminAccess('admin')).toBe(true);
      expect(hasAdminAccess('developer')).toBe(true);
    });

    it('should return false for user role', () => {
      expect(hasAdminAccess('user')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(hasAdminAccess('ADMIN')).toBe(true);
      expect(hasAdminAccess('DEVELOPER')).toBe(true);
    });

    it('should default to false for null/undefined', () => {
      expect(hasAdminAccess(null)).toBe(false);
      expect(hasAdminAccess(undefined)).toBe(false);
    });
  });

  describe('getTierInfo', () => {
    it('should return complete information for all tiers', () => {
      const freeInfo = getTierInfo('free');
      expect(freeInfo).toEqual({
        displayName: 'Free Tier',
        shortName: 'Free',
        color: 'from-blue-500 to-cyan-500',
        isPaid: false,
        description: 'Get started with 2 blueprints per month',
        maxGenerations: 2,
        maxSaved: 2,
      });

      const explorerInfo = getTierInfo('explorer');
      expect(explorerInfo.displayName).toBe('Explorer');
      expect(explorerInfo.isPaid).toBe(true);
      expect(explorerInfo.maxGenerations).toBe(5);
      expect(explorerInfo.maxSaved).toBe(5);
    });

    it('should default to free tier info for null/undefined', () => {
      const defaultInfo = getTierInfo(null);
      expect(defaultInfo.displayName).toBe('Free Tier');
      expect(defaultInfo.isPaid).toBe(false);
    });

    it('should include correct limits for all tiers', () => {
      expect(getTierInfo('navigator').maxGenerations).toBe(25);
      expect(getTierInfo('voyager').maxGenerations).toBe(40);
      expect(getTierInfo('crew').maxGenerations).toBe(10);
      expect(getTierInfo('fleet').maxGenerations).toBe(30);
      expect(getTierInfo('armada').maxGenerations).toBe(60);
    });
  });

  describe('getRoleInfo', () => {
    it('should return complete information for all roles', () => {
      const userInfo = getRoleInfo('user');
      expect(userInfo).toEqual({
        displayName: 'User',
        color: 'from-blue-500 to-cyan-500',
        description: 'Standard user access',
      });

      const developerInfo = getRoleInfo('developer');
      expect(developerInfo.displayName).toBe('Developer');
      expect(developerInfo.description).toContain('Development and admin access');

      const adminInfo = getRoleInfo('admin');
      expect(adminInfo.displayName).toBe('Admin');
      expect(adminInfo.description).toContain('Full system administrative access');
    });

    it('should default to user info for null/undefined', () => {
      const defaultInfo = getRoleInfo(null);
      expect(defaultInfo.displayName).toBe('User');
    });
  });

  describe('getTierMaxGenerations', () => {
    it('should return correct generation limits for all tiers', () => {
      expect(getTierMaxGenerations('free')).toBe(2);
      expect(getTierMaxGenerations('explorer')).toBe(5);
      expect(getTierMaxGenerations('navigator')).toBe(25);
      expect(getTierMaxGenerations('voyager')).toBe(40);
      expect(getTierMaxGenerations('crew')).toBe(10);
      expect(getTierMaxGenerations('fleet')).toBe(30);
      expect(getTierMaxGenerations('armada')).toBe(60);
    });

    it('should default to 2 for null/undefined', () => {
      expect(getTierMaxGenerations(null)).toBe(2);
      expect(getTierMaxGenerations(undefined)).toBe(2);
    });

    it('should default to 2 for unknown tiers', () => {
      expect(getTierMaxGenerations('invalid')).toBe(2);
    });
  });

  describe('getTierMaxSaved', () => {
    it('should return correct save limits for all tiers', () => {
      expect(getTierMaxSaved('free')).toBe(2);
      expect(getTierMaxSaved('explorer')).toBe(5);
      expect(getTierMaxSaved('navigator')).toBe(25);
      expect(getTierMaxSaved('voyager')).toBe(40);
      expect(getTierMaxSaved('crew')).toBe(10);
      expect(getTierMaxSaved('fleet')).toBe(30);
      expect(getTierMaxSaved('armada')).toBe(60);
    });

    it('should default to 2 for null/undefined', () => {
      expect(getTierMaxSaved(null)).toBe(2);
      expect(getTierMaxSaved(undefined)).toBe(2);
    });

    it('should match generation limits for all tiers', () => {
      const tiers = ['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];
      tiers.forEach((tier) => {
        expect(getTierMaxSaved(tier)).toBe(getTierMaxGenerations(tier));
      });
    });
  });

  describe('hasUnlimitedAccess', () => {
    it('should return true for admin and developer roles', () => {
      expect(hasUnlimitedAccess('admin')).toBe(true);
      expect(hasUnlimitedAccess('developer')).toBe(true);
    });

    it('should return false for user role', () => {
      expect(hasUnlimitedAccess('user')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(hasUnlimitedAccess('ADMIN')).toBe(true);
      expect(hasUnlimitedAccess('DEVELOPER')).toBe(true);
    });

    it('should default to false for null/undefined', () => {
      expect(hasUnlimitedAccess(null)).toBe(false);
      expect(hasUnlimitedAccess(undefined)).toBe(false);
    });
  });

  describe('getUserEffectiveLimits', () => {
    it('should return unlimited for admin/developer roles regardless of tier', () => {
      const adminLimits = getUserEffectiveLimits('free', 'admin');
      expect(adminLimits).toEqual({
        maxGenerations: -1,
        maxSaved: -1,
        isUnlimited: true,
      });

      const developerLimits = getUserEffectiveLimits('free', 'developer');
      expect(developerLimits).toEqual({
        maxGenerations: -1,
        maxSaved: -1,
        isUnlimited: true,
      });
    });

    it('should return tier limits for regular users', () => {
      const freeLimits = getUserEffectiveLimits('free', 'user');
      expect(freeLimits).toEqual({
        maxGenerations: 2,
        maxSaved: 2,
        isUnlimited: false,
      });

      const navigatorLimits = getUserEffectiveLimits('navigator', 'user');
      expect(navigatorLimits).toEqual({
        maxGenerations: 25,
        maxSaved: 25,
        isUnlimited: false,
      });
    });

    it('should prioritize role over tier for unlimited access', () => {
      const limits = getUserEffectiveLimits('armada', 'developer');
      expect(limits.isUnlimited).toBe(true);
      expect(limits.maxGenerations).toBe(-1);
    });

    it('should handle null/undefined values', () => {
      const limits = getUserEffectiveLimits(null, null);
      expect(limits.isUnlimited).toBe(false);
      expect(limits.maxGenerations).toBe(2); // Default free tier
    });
  });

  describe('getAvailableUpgradePlans', () => {
    it('should show all plans for free tier users', () => {
      const plans = getAvailableUpgradePlans('free');
      expect(plans.individualPlans).toEqual(['explorer', 'navigator', 'voyager']);
      expect(plans.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should show higher individual tiers + all team tiers for individual tier users', () => {
      const explorerPlans = getAvailableUpgradePlans('explorer');
      expect(explorerPlans.individualPlans).toEqual(['navigator', 'voyager']);
      expect(explorerPlans.teamPlans).toEqual(['crew', 'fleet', 'armada']);

      const navigatorPlans = getAvailableUpgradePlans('navigator');
      expect(navigatorPlans.individualPlans).toEqual(['voyager']);
      expect(navigatorPlans.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should show no individual plans for top individual tier', () => {
      const plans = getAvailableUpgradePlans('voyager');
      expect(plans.individualPlans).toEqual([]);
      expect(plans.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should show only higher team tiers for team tier users', () => {
      const crewPlans = getAvailableUpgradePlans('crew');
      expect(crewPlans.individualPlans).toEqual([]);
      expect(crewPlans.teamPlans).toEqual(['fleet', 'armada']);

      const fleetPlans = getAvailableUpgradePlans('fleet');
      expect(fleetPlans.individualPlans).toEqual([]);
      expect(fleetPlans.teamPlans).toEqual(['armada']);
    });

    it('should show no plans for top tier users', () => {
      const plans = getAvailableUpgradePlans('armada');
      expect(plans.individualPlans).toEqual([]);
      expect(plans.teamPlans).toEqual([]);
    });

    it('should handle null/undefined as free tier', () => {
      const plans = getAvailableUpgradePlans(null);
      expect(plans.individualPlans).toEqual(['explorer', 'navigator', 'voyager']);
      expect(plans.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should handle unknown tiers as free tier', () => {
      const plans = getAvailableUpgradePlans('invalid');
      expect(plans.individualPlans).toEqual(['explorer', 'navigator', 'voyager']);
      expect(plans.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });
  });

  describe('shouldShowPlan', () => {
    it('should return true for upgrade-eligible plans', () => {
      expect(shouldShowPlan('navigator', 'free')).toBe(true);
      expect(shouldShowPlan('crew', 'explorer')).toBe(true);
      expect(shouldShowPlan('fleet', 'crew')).toBe(true);
    });

    it('should return false for same or lower tier plans', () => {
      expect(shouldShowPlan('explorer', 'navigator')).toBe(false);
      expect(shouldShowPlan('free', 'explorer')).toBe(false);
      expect(shouldShowPlan('crew', 'fleet')).toBe(false);
    });

    it('should return false for current tier', () => {
      expect(shouldShowPlan('explorer', 'explorer')).toBe(false);
      expect(shouldShowPlan('navigator', 'navigator')).toBe(false);
    });

    it('should handle case insensitivity', () => {
      expect(shouldShowPlan('NAVIGATOR', 'FREE')).toBe(true);
      expect(shouldShowPlan('Explorer', 'Navigator')).toBe(false);
    });

    it('should handle null/undefined current tier', () => {
      expect(shouldShowPlan('explorer', null)).toBe(true);
      expect(shouldShowPlan('navigator', undefined)).toBe(true);
    });

    it('should correctly handle cross-category upgrades', () => {
      // Individual tier users can see team tiers
      expect(shouldShowPlan('crew', 'explorer')).toBe(true);
      expect(shouldShowPlan('fleet', 'navigator')).toBe(true);

      // Team tier users cannot downgrade to individual tiers
      expect(shouldShowPlan('navigator', 'crew')).toBe(false);
      expect(shouldShowPlan('voyager', 'fleet')).toBe(false);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle empty strings consistently', () => {
      expect(getTierDisplayName('')).toBe('Free Tier');
      expect(getRoleDisplayName('')).toBe('User');
      expect(isPaidTier('')).toBe(false);
      expect(isFreeTier('')).toBe(true); // Empty string is falsy, defaults to 'free'
    });

    it('should handle whitespace consistently', () => {
      expect(getTierDisplayName(' free ')).toBe('Free Tier');
      expect(getRoleDisplayName(' user ')).toBe('User');
    });

    it('should maintain consistent tier limits across all functions', () => {
      const tiers = ['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];

      tiers.forEach((tier) => {
        const info = getTierInfo(tier);
        const maxGen = getTierMaxGenerations(tier);
        const maxSaved = getTierMaxSaved(tier);

        expect(info.maxGenerations).toBe(maxGen);
        expect(info.maxSaved).toBe(maxSaved);
        expect(maxGen).toBe(maxSaved); // Generations and saves should match
      });
    });

    it('should maintain consistent role behavior across all functions', () => {
      const roles = ['user', 'developer', 'admin'];

      roles.forEach((role) => {
        const info = getRoleInfo(role);
        const displayName = getRoleDisplayName(role);
        const hasUnlimited = hasUnlimitedAccess(role);
        const hasAdmin = hasAdminAccess(role);

        expect(info.displayName).toBe(displayName);

        // Developer and admin should have both unlimited and admin access
        if (role === 'developer' || role === 'admin') {
          expect(hasUnlimited).toBe(true);
          expect(hasAdmin).toBe(true);
        } else {
          expect(hasUnlimited).toBe(false);
          expect(hasAdmin).toBe(false);
        }
      });
    });

    it('should handle tier hierarchy correctly', () => {
      // Individual tiers in ascending order
      const individualLimits = [
        getTierMaxGenerations('free'), // 2
        getTierMaxGenerations('explorer'), // 5
        getTierMaxGenerations('navigator'), // 25
        getTierMaxGenerations('voyager'), // 40
      ];

      // Verify ascending order
      for (let i = 1; i < individualLimits.length; i++) {
        expect(individualLimits[i]).toBeGreaterThan(individualLimits[i - 1]);
      }

      // Team tiers in ascending order
      const teamLimits = [
        getTierMaxGenerations('crew'), // 10
        getTierMaxGenerations('fleet'), // 30
        getTierMaxGenerations('armada'), // 60
      ];

      // Verify ascending order
      for (let i = 1; i < teamLimits.length; i++) {
        expect(teamLimits[i]).toBeGreaterThan(teamLimits[i - 1]);
      }
    });
  });
});
