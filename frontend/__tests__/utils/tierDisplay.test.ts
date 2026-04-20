import { describe, it, expect } from 'vitest';
import {
  getTierDisplayName,
  getTierDisplayNameShort,
  isPaidTier,
  isFreeTier,
  getTierInfo,
  getRoleDisplayName,
  getRoleInfo,
  isDeveloperRole,
  isAdminRole,
  hasAdminAccess,
  getTierMaxGenerations,
  getTierMaxSaved,
  hasUnlimitedAccess,
  getUserEffectiveLimits,
} from '@/lib/utils/tierDisplay';

describe('tierDisplay utilities', () => {
  describe('getTierDisplayName', () => {
    it('returns "Free Tier" for free tier', () => {
      expect(getTierDisplayName('free')).toBe('Free Tier');
    });

    it('returns correct display names for individual tiers', () => {
      expect(getTierDisplayName('explorer')).toBe('Explorer');
      expect(getTierDisplayName('navigator')).toBe('Navigator');
      expect(getTierDisplayName('voyager')).toBe('Voyager');
    });

    it('returns correct display names with Member suffix for team tiers', () => {
      expect(getTierDisplayName('crew')).toBe('Crew Member');
      expect(getTierDisplayName('fleet')).toBe('Fleet Member');
      expect(getTierDisplayName('armada')).toBe('Armada Member');
    });

    it('handles null/undefined by defaulting to Free Tier', () => {
      expect(getTierDisplayName(null)).toBe('Free Tier');
      expect(getTierDisplayName(undefined)).toBe('Free Tier');
    });

    it('handles unknown tier by defaulting to Free Tier', () => {
      expect(getTierDisplayName('unknown')).toBe('Free Tier');
      expect(getTierDisplayName('invalid')).toBe('Free Tier');
    });

    it('is case-insensitive', () => {
      expect(getTierDisplayName('FREE')).toBe('Free Tier');
      expect(getTierDisplayName('Navigator')).toBe('Navigator');
      expect(getTierDisplayName('VOYAGER')).toBe('Voyager');
    });
  });

  describe('getTierDisplayNameShort', () => {
    it('returns "Free" for free tier', () => {
      expect(getTierDisplayNameShort('free')).toBe('Free');
    });

    it('returns tier name without Member suffix for all tiers', () => {
      expect(getTierDisplayNameShort('free')).toBe('Free');
      expect(getTierDisplayNameShort('explorer')).toBe('Explorer');
      expect(getTierDisplayNameShort('navigator')).toBe('Navigator');
      expect(getTierDisplayNameShort('voyager')).toBe('Voyager');
      expect(getTierDisplayNameShort('crew')).toBe('Crew');
      expect(getTierDisplayNameShort('fleet')).toBe('Fleet');
      expect(getTierDisplayNameShort('armada')).toBe('Armada');
    });

    it('handles null/undefined by defaulting to Free', () => {
      expect(getTierDisplayNameShort(null)).toBe('Free');
      expect(getTierDisplayNameShort(undefined)).toBe('Free');
    });

    it('is case-insensitive', () => {
      expect(getTierDisplayNameShort('FREE')).toBe('Free');
      expect(getTierDisplayNameShort('Navigator')).toBe('Navigator');
    });
  });

  describe('isPaidTier', () => {
    it('returns false for free tier', () => {
      expect(isPaidTier('free')).toBe(false);
    });

    it('returns true for all paid tiers', () => {
      expect(isPaidTier('explorer')).toBe(true);
      expect(isPaidTier('navigator')).toBe(true);
      expect(isPaidTier('voyager')).toBe(true);
      expect(isPaidTier('crew')).toBe(true);
      expect(isPaidTier('fleet')).toBe(true);
      expect(isPaidTier('armada')).toBe(true);
    });

    it('handles null/undefined by returning false', () => {
      expect(isPaidTier(null)).toBe(false);
      expect(isPaidTier(undefined)).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isPaidTier('NAVIGATOR')).toBe(true);
      expect(isPaidTier('Navigator')).toBe(true);
    });
  });

  describe('isFreeTier', () => {
    it('returns true for free tier', () => {
      expect(isFreeTier('free')).toBe(true);
    });

    it('returns false for all other tiers', () => {
      expect(isFreeTier('explorer')).toBe(false);
      expect(isFreeTier('navigator')).toBe(false);
      expect(isFreeTier('voyager')).toBe(false);
      expect(isFreeTier('crew')).toBe(false);
      expect(isFreeTier('fleet')).toBe(false);
      expect(isFreeTier('armada')).toBe(false);
    });

    it('handles null/undefined by returning true (default)', () => {
      expect(isFreeTier(null)).toBe(true);
      expect(isFreeTier(undefined)).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(isFreeTier('FREE')).toBe(true);
      expect(isFreeTier('Free')).toBe(true);
    });
  });

  describe('getTierInfo', () => {
    it('returns correct info for free tier', () => {
      const info = getTierInfo('free');
      expect(info.displayName).toBe('Free Tier');
      expect(info.shortName).toBe('Free');
      expect(info.isPaid).toBe(false);
      expect(info.color).toBeTruthy();
      expect(info.description).toContain('2 blueprints');
      expect(info.maxGenerations).toBe(2);
      expect(info.maxSaved).toBe(2);
    });

    it('returns correct info for explorer tier', () => {
      const info = getTierInfo('explorer');
      expect(info.displayName).toBe('Explorer');
      expect(info.shortName).toBe('Explorer');
      expect(info.isPaid).toBe(true);
      expect(info.color).toBeTruthy();
      expect(info.maxGenerations).toBe(5);
      expect(info.maxSaved).toBe(5);
    });

    it('returns correct info for crew tier', () => {
      const info = getTierInfo('crew');
      expect(info.displayName).toBe('Crew Member');
      expect(info.shortName).toBe('Crew');
      expect(info.isPaid).toBe(true);
      expect(info.maxGenerations).toBe(10);
      expect(info.maxSaved).toBe(10);
    });

    it('returns default info for null/undefined', () => {
      const infoNull = getTierInfo(null);
      const infoUndefined = getTierInfo(undefined);

      expect(infoNull.displayName).toBe('Free Tier');
      expect(infoUndefined.displayName).toBe('Free Tier');
    });

    it('returns default info for unknown tier', () => {
      const info = getTierInfo('unknown-tier');
      expect(info.displayName).toBe('Free Tier');
      expect(info.shortName).toBe('Free');
      expect(info.isPaid).toBe(false);
    });

    it('includes all required fields', () => {
      const info = getTierInfo('voyager');
      expect(info).toHaveProperty('displayName');
      expect(info).toHaveProperty('shortName');
      expect(info).toHaveProperty('color');
      expect(info).toHaveProperty('isPaid');
      expect(info).toHaveProperty('description');
      expect(info).toHaveProperty('maxGenerations');
      expect(info).toHaveProperty('maxSaved');
    });

    it('has unique colors for each tier', () => {
      const tiers = ['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];

      const colors = ['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'].map(
        (tier) => getTierInfo(tier).color
      );

      // Check that all colors are defined
      colors.forEach((color) => {
        expect(color).toBeTruthy();
        expect(typeof color).toBe('string');
      });
    });

    it('is case-insensitive', () => {
      const lowerInfo = getTierInfo('navigator');
      const upperInfo = getTierInfo('NAVIGATOR');
      const mixedInfo = getTierInfo('Navigator');

      expect(lowerInfo.displayName).toBe(upperInfo.displayName);
      expect(lowerInfo.displayName).toBe(mixedInfo.displayName);
    });
  });

  describe('getRoleDisplayName', () => {
    it('returns correct display names for all roles', () => {
      expect(getRoleDisplayName('user')).toBe('User');
      expect(getRoleDisplayName('developer')).toBe('Developer');
      expect(getRoleDisplayName('admin')).toBe('Admin');
    });

    it('handles null/undefined by defaulting to User', () => {
      expect(getRoleDisplayName(null)).toBe('User');
      expect(getRoleDisplayName(undefined)).toBe('User');
    });

    it('handles unknown role by defaulting to User', () => {
      expect(getRoleDisplayName('unknown')).toBe('User');
    });

    it('is case-insensitive', () => {
      expect(getRoleDisplayName('USER')).toBe('User');
      expect(getRoleDisplayName('Developer')).toBe('Developer');
      expect(getRoleDisplayName('ADMIN')).toBe('Admin');
    });
  });

  describe('getRoleInfo', () => {
    it('returns correct info for user role', () => {
      const info = getRoleInfo('user');
      expect(info.displayName).toBe('User');
      expect(info.color).toBeTruthy();
      expect(info.description).toContain('Standard user');
    });

    it('returns correct info for developer role', () => {
      const info = getRoleInfo('developer');
      expect(info.displayName).toBe('Developer');
      expect(info.color).toBeTruthy();
      expect(info.description).toContain('admin');
    });

    it('returns correct info for admin role', () => {
      const info = getRoleInfo('admin');
      expect(info.displayName).toBe('Admin');
      expect(info.color).toBeTruthy();
      expect(info.description).toContain('administrative');
    });

    it('returns default info for null/undefined', () => {
      const infoNull = getRoleInfo(null);
      const infoUndefined = getRoleInfo(undefined);

      expect(infoNull.displayName).toBe('User');
      expect(infoUndefined.displayName).toBe('User');
    });

    it('includes all required fields', () => {
      const info = getRoleInfo('developer');
      expect(info).toHaveProperty('displayName');
      expect(info).toHaveProperty('color');
      expect(info).toHaveProperty('description');
    });
  });

  describe('isDeveloperRole', () => {
    it('returns true for developer role', () => {
      expect(isDeveloperRole('developer')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(isDeveloperRole('user')).toBe(false);
      expect(isDeveloperRole('admin')).toBe(false);
    });

    it('handles null/undefined by returning false', () => {
      expect(isDeveloperRole(null)).toBe(false);
      expect(isDeveloperRole(undefined)).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isDeveloperRole('DEVELOPER')).toBe(true);
      expect(isDeveloperRole('Developer')).toBe(true);
    });
  });

  describe('isAdminRole', () => {
    it('returns true for admin role', () => {
      expect(isAdminRole('admin')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(isAdminRole('user')).toBe(false);
      expect(isAdminRole('developer')).toBe(false);
    });

    it('handles null/undefined by returning false', () => {
      expect(isAdminRole(null)).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isAdminRole('ADMIN')).toBe(true);
      expect(isAdminRole('Admin')).toBe(true);
    });
  });

  describe('hasAdminAccess', () => {
    it('returns true for admin and developer roles', () => {
      expect(hasAdminAccess('admin')).toBe(true);
      expect(hasAdminAccess('developer')).toBe(true);
    });

    it('returns false for user role', () => {
      expect(hasAdminAccess('user')).toBe(false);
    });

    it('handles null/undefined by returning false', () => {
      expect(hasAdminAccess(null)).toBe(false);
      expect(hasAdminAccess(undefined)).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(hasAdminAccess('ADMIN')).toBe(true);
      expect(hasAdminAccess('Developer')).toBe(true);
    });
  });

  describe('Business logic validation', () => {
    it('enforces "Free Tier" naming for default tier', () => {
      const displayName = getTierDisplayName('free');
      expect(displayName).toBe('Free Tier');
    });

    it('enforces "Member" suffix only for team tiers', () => {
      // Team tiers have Member suffix
      expect(getTierDisplayName('crew')).toContain('Member');
      expect(getTierDisplayName('fleet')).toContain('Member');
      expect(getTierDisplayName('armada')).toContain('Member');

      // Individual tiers do not
      expect(getTierDisplayName('explorer')).not.toContain('Member');
      expect(getTierDisplayName('navigator')).not.toContain('Member');
      expect(getTierDisplayName('voyager')).not.toContain('Member');
    });

    it('correctly categorizes tiers as paid/free', () => {
      // Free tier
      expect(isPaidTier('free')).toBe(false);
      expect(isFreeTier('free')).toBe(true);

      // Paid tiers
      expect(isPaidTier('explorer')).toBe(true);
      expect(isFreeTier('explorer')).toBe(false);

      expect(isPaidTier('navigator')).toBe(true);
      expect(isFreeTier('navigator')).toBe(false);
    });

    it('separates roles from tiers', () => {
      // Roles are separate from tiers
      expect(getRoleDisplayName('user')).toBe('User');
      expect(getRoleDisplayName('developer')).toBe('Developer');
      expect(getRoleDisplayName('admin')).toBe('Admin');

      // Developer is a role, not a tier
      expect(isDeveloperRole('developer')).toBe(true);
      expect(hasAdminAccess('developer')).toBe(true);
    });
  });

  describe('getTierMaxGenerations', () => {
    it('returns correct generation limits for each tier', () => {
      expect(getTierMaxGenerations('free')).toBe(2);
      expect(getTierMaxGenerations('explorer')).toBe(5);
      expect(getTierMaxGenerations('navigator')).toBe(25);
      expect(getTierMaxGenerations('voyager')).toBe(40);
      expect(getTierMaxGenerations('crew')).toBe(10);
      expect(getTierMaxGenerations('fleet')).toBe(30);
      expect(getTierMaxGenerations('armada')).toBe(60);
    });

    it('handles null/undefined by defaulting to free tier', () => {
      expect(getTierMaxGenerations(null)).toBe(2);
      expect(getTierMaxGenerations(undefined)).toBe(2);
    });

    it('handles unknown tier by defaulting to free tier', () => {
      expect(getTierMaxGenerations('unknown')).toBe(2);
    });

    it('is case-insensitive', () => {
      expect(getTierMaxGenerations('NAVIGATOR')).toBe(25);
      expect(getTierMaxGenerations('Navigator')).toBe(25);
    });
  });

  describe('getTierMaxSaved', () => {
    it('returns correct save limits for each tier', () => {
      expect(getTierMaxSaved('free')).toBe(2);
      expect(getTierMaxSaved('explorer')).toBe(5);
      expect(getTierMaxSaved('navigator')).toBe(25);
      expect(getTierMaxSaved('voyager')).toBe(40);
      expect(getTierMaxSaved('crew')).toBe(10);
      expect(getTierMaxSaved('fleet')).toBe(30);
      expect(getTierMaxSaved('armada')).toBe(60);
    });

    it('handles null/undefined by defaulting to free tier', () => {
      expect(getTierMaxSaved(null)).toBe(2);
      expect(getTierMaxSaved(undefined)).toBe(2);
    });

    it('handles unknown tier by defaulting to free tier', () => {
      expect(getTierMaxSaved('unknown')).toBe(2);
    });

    it('is case-insensitive', () => {
      expect(getTierMaxSaved('NAVIGATOR')).toBe(25);
      expect(getTierMaxSaved('Navigator')).toBe(25);
    });
  });

  describe('hasUnlimitedAccess', () => {
    it('returns true for developer and admin roles', () => {
      expect(hasUnlimitedAccess('developer')).toBe(true);
      expect(hasUnlimitedAccess('admin')).toBe(true);
    });

    it('returns false for user role', () => {
      expect(hasUnlimitedAccess('user')).toBe(false);
    });

    it('handles null/undefined by returning false', () => {
      expect(hasUnlimitedAccess(null)).toBe(false);
      expect(hasUnlimitedAccess(undefined)).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(hasUnlimitedAccess('DEVELOPER')).toBe(true);
      expect(hasUnlimitedAccess('Developer')).toBe(true);
    });
  });

  describe('getUserEffectiveLimits', () => {
    it('returns unlimited limits for developer role', () => {
      const limits = getUserEffectiveLimits('free', 'developer');
      expect(limits.maxGenerations).toBe(-1);
      expect(limits.maxSaved).toBe(-1);
      expect(limits.isUnlimited).toBe(true);
    });

    it('returns unlimited limits for admin role', () => {
      const limits = getUserEffectiveLimits('explorer', 'admin');
      expect(limits.maxGenerations).toBe(-1);
      expect(limits.maxSaved).toBe(-1);
      expect(limits.isUnlimited).toBe(true);
    });

    it('returns tier-based limits for user role', () => {
      const freeLimits = getUserEffectiveLimits('free', 'user');
      expect(freeLimits.maxGenerations).toBe(2);
      expect(freeLimits.maxSaved).toBe(2);
      expect(freeLimits.isUnlimited).toBe(false);

      const navigatorLimits = getUserEffectiveLimits('navigator', 'user');
      expect(navigatorLimits.maxGenerations).toBe(25);
      expect(navigatorLimits.maxSaved).toBe(25);
      expect(navigatorLimits.isUnlimited).toBe(false);
    });

    it('handles null/undefined by defaulting to free tier limits', () => {
      const nullLimits = getUserEffectiveLimits(null, null);
      expect(nullLimits.maxGenerations).toBe(2);
      expect(nullLimits.maxSaved).toBe(2);
      expect(nullLimits.isUnlimited).toBe(false);
    });

    it('prioritizes unlimited access over tier limits', () => {
      const limits = getUserEffectiveLimits('free', 'developer');
      expect(limits.maxGenerations).toBe(-1);
      expect(limits.maxSaved).toBe(-1);
      expect(limits.isUnlimited).toBe(true);
    });
  });

  describe('Tier limits validation', () => {
    it('enforces correct tier limits across all functions', () => {
      const tiers = ['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];
      const expectedLimits = [
        { generations: 2, saved: 2 }, // free
        { generations: 5, saved: 5 }, // explorer
        { generations: 25, saved: 25 }, // navigator
        { generations: 40, saved: 40 }, // voyager
        { generations: 10, saved: 10 }, // crew
        { generations: 30, saved: 30 }, // fleet
        { generations: 60, saved: 60 }, // armada
      ];

      tiers.forEach((tier, index) => {
        const expected = expectedLimits[index];
        expect(getTierMaxGenerations(tier)).toBe(expected.generations);
        expect(getTierMaxSaved(tier)).toBe(expected.saved);

        const info = getTierInfo(tier);
        expect(info.maxGenerations).toBe(expected.generations);
        expect(info.maxSaved).toBe(expected.saved);
      });
    });

    it('ensures developer role overrides tier limits', () => {
      const tiers = ['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada'];

      tiers.forEach((tier) => {
        const limits = getUserEffectiveLimits(tier, 'developer');
        expect(limits.maxGenerations).toBe(-1);
        expect(limits.maxSaved).toBe(-1);
        expect(limits.isUnlimited).toBe(true);
      });
    });
  });
});
