/**
 * Tests for pricing plan filtering based on user tier
 */

import { describe, it, expect } from 'vitest';
import { getAvailableUpgradePlans, shouldShowPlan } from '@/lib/utils/tierDisplay';

describe('tierPlanFiltering', () => {
  describe('getAvailableUpgradePlans', () => {
    it('should show all plans for free tier users', () => {
      const result = getAvailableUpgradePlans('free');
      expect(result.individualPlans).toEqual(['explorer', 'navigator', 'voyager']);
      expect(result.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should show higher individual plans for explorer users', () => {
      const result = getAvailableUpgradePlans('explorer');
      expect(result.individualPlans).toEqual(['navigator', 'voyager']);
      expect(result.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should show only voyager for navigator users', () => {
      const result = getAvailableUpgradePlans('navigator');
      expect(result.individualPlans).toEqual(['voyager']);
      expect(result.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should show no individual plans for voyager users (top individual tier)', () => {
      const result = getAvailableUpgradePlans('voyager');
      expect(result.individualPlans).toEqual([]);
      expect(result.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should show higher team plans for crew users', () => {
      const result = getAvailableUpgradePlans('crew');
      expect(result.individualPlans).toEqual([]);
      expect(result.teamPlans).toEqual(['fleet', 'armada']);
    });

    it('should show only armada for fleet users', () => {
      const result = getAvailableUpgradePlans('fleet');
      expect(result.individualPlans).toEqual([]);
      expect(result.teamPlans).toEqual(['armada']);
    });

    it('should show no plans for armada users (top team tier)', () => {
      const result = getAvailableUpgradePlans('armada');
      expect(result.individualPlans).toEqual([]);
      expect(result.teamPlans).toEqual([]);
    });

    it('should handle null tier (treat as free)', () => {
      const result = getAvailableUpgradePlans(null);
      expect(result.individualPlans).toEqual(['explorer', 'navigator', 'voyager']);
      expect(result.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });

    it('should handle undefined tier (treat as free)', () => {
      const result = getAvailableUpgradePlans(undefined);
      expect(result.individualPlans).toEqual(['explorer', 'navigator', 'voyager']);
      expect(result.teamPlans).toEqual(['crew', 'fleet', 'armada']);
    });
  });

  describe('shouldShowPlan', () => {
    it('should show navigator to free tier users', () => {
      expect(shouldShowPlan('navigator', 'free')).toBe(true);
    });

    it('should not show explorer to navigator users', () => {
      expect(shouldShowPlan('explorer', 'navigator')).toBe(false);
    });

    it('should show fleet to crew users', () => {
      expect(shouldShowPlan('fleet', 'crew')).toBe(true);
    });

    it('should not show crew to fleet users', () => {
      expect(shouldShowPlan('crew', 'fleet')).toBe(false);
    });

    it('should show team plans to individual tier users', () => {
      expect(shouldShowPlan('crew', 'explorer')).toBe(true);
      expect(shouldShowPlan('fleet', 'navigator')).toBe(true);
      expect(shouldShowPlan('armada', 'voyager')).toBe(true);
    });

    it('should not show any plans to armada users', () => {
      expect(shouldShowPlan('explorer', 'armada')).toBe(false);
      expect(shouldShowPlan('voyager', 'armada')).toBe(false);
      expect(shouldShowPlan('crew', 'armada')).toBe(false);
      expect(shouldShowPlan('fleet', 'armada')).toBe(false);
    });
  });
});
