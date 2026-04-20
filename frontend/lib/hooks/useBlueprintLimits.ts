'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client-fixed';
import {
  BlueprintUsageService,
  type ComprehensiveUserLimits,
} from '@/lib/services/blueprintUsageService';

export interface BlueprintLimits {
  // Loading states
  loading: boolean;
  error: string | null;

  // User limits data
  limits: ComprehensiveUserLimits | null;

  // Computed flags
  canCreate: boolean;
  canSave: boolean;
  isAtCreationLimit: boolean;
  isAtSavingLimit: boolean;
  isNearCreationLimit: boolean; // 80%+
  isNearSavingLimit: boolean; // 80%+

  // Helper methods
  refresh: () => Promise<void>;
  checkBeforeCreate: () => Promise<{ allowed: boolean; reason?: string }>;
  checkBeforeSave: () => Promise<{ allowed: boolean; reason?: string }>;
}

/**
 * Hook for checking blueprint creation and saving limits
 *
 * This hook provides real-time limit checking and enforcement.
 * It automatically refreshes when the user changes or auth state updates.
 *
 * @example
 * ```tsx
 * const { canCreate, isAtCreationLimit, limits, checkBeforeCreate } = useBlueprintLimits();
 *
 * // Disable button when at limit
 * <button disabled={!canCreate || isAtCreationLimit}>
 *   Create New Blueprint
 * </button>
 *
 * // Check before navigating
 * const handleCreate = async () => {
 *   const { allowed, reason } = await checkBeforeCreate();
 *   if (!allowed) {
 *     showUpgradeModal(reason);
 *     return;
 *   }
 *   router.push('/static-wizard');
 * };
 * ```
 */
export function useBlueprintLimits(): BlueprintLimits {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<ComprehensiveUserLimits | null>(null);

  const fetchLimits = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const userLimits = await BlueprintUsageService.getComprehensiveUserLimits(supabase, user.id);

      setLimits(userLimits);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch limits';
      setError(errorMessage);
      console.error('Error fetching blueprint limits:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch limits on mount and when user changes
  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Computed flags
  const canCreate = limits?.isExempt || (limits?.generationsRemaining ?? 0) > 0;
  const canSave = limits?.isExempt || (limits?.savedRemaining ?? 0) > 0;
  const isAtCreationLimit = !limits?.isExempt && (limits?.generationsRemaining ?? 0) === 0;
  const isAtSavingLimit = !limits?.isExempt && (limits?.savedRemaining ?? 0) === 0;

  // Near limit = 80% or more used
  const isNearCreationLimit =
    !limits?.isExempt &&
    limits?.maxGenerationsMonthly !== undefined &&
    limits.maxGenerationsMonthly > 0 &&
    limits.currentGenerations / limits.maxGenerationsMonthly >= 0.8;

  const isNearSavingLimit =
    !limits?.isExempt &&
    limits?.maxSavedStarmaps !== undefined &&
    limits.maxSavedStarmaps > 0 &&
    limits.currentSavedStarmaps / limits.maxSavedStarmaps >= 0.8;

  /**
   * Check if user can create a blueprint
   * This performs a fresh server-side check to ensure accuracy
   */
  const checkBeforeCreate = useCallback(async (): Promise<{
    allowed: boolean;
    reason?: string;
  }> => {
    if (!user?.id) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const result = await BlueprintUsageService.canCreateBlueprint(supabase, user.id);

      return {
        allowed: result.canCreate,
        reason: result.reason,
      };
    } catch (err) {
      console.error('Error checking creation limits:', err);
      return {
        allowed: false,
        reason: 'Failed to check limits. Please try again.',
      };
    }
  }, [user?.id]);

  /**
   * Check if user can save a blueprint
   * This performs a fresh server-side check to ensure accuracy
   */
  const checkBeforeSave = useCallback(async (): Promise<{
    allowed: boolean;
    reason?: string;
  }> => {
    if (!user?.id) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const result = await BlueprintUsageService.canSaveBlueprint(supabase, user.id);

      return {
        allowed: result.canSave,
        reason: result.reason,
      };
    } catch (err) {
      console.error('Error checking saving limits:', err);
      return {
        allowed: false,
        reason: 'Failed to check limits. Please try again.',
      };
    }
  }, [user?.id]);

  return {
    loading,
    error,
    limits,
    canCreate,
    canSave,
    isAtCreationLimit,
    isAtSavingLimit,
    isNearCreationLimit,
    isNearSavingLimit,
    refresh: fetchLimits,
    checkBeforeCreate,
    checkBeforeSave,
  };
}

/**
 * Helper function to get upgrade message based on limit type
 */
export function getUpgradeMessage(limitType: 'creation' | 'saving', currentTier: string): string {
  const tierLimits: Record<string, { creation: number; saving: number }> = {
    free: { creation: 2, saving: 2 },
    explorer: { creation: 5, saving: 5 },
    navigator: { creation: 25, saving: 25 },
    voyager: { creation: 50, saving: 50 },
    crew: { creation: 10, saving: 10 },
    fleet: { creation: 30, saving: 30 },
    armada: { creation: 60, saving: 60 },
  };

  const current = tierLimits[currentTier];
  if (!current) {
    return 'Upgrade to create more blueprints';
  }

  const limit = limitType === 'creation' ? current.creation : current.saving;
  const action = limitType === 'creation' ? 'created' : 'saved';

  return `You've ${action} your maximum of ${limit} blueprints. Upgrade to continue.`;
}

/**
 * Helper function to get next recommended tier
 */
export function getRecommendedUpgradeTier(currentTier: string): {
  tier: string;
  name: string;
  creationLimit: number;
  savingLimit: number;
  price: number;
} {
  const upgradePath: Record<
    string,
    { tier: string; name: string; creationLimit: number; savingLimit: number; price: number }
  > = {
    free: { tier: 'explorer', name: 'Explorer', creationLimit: 5, savingLimit: 5, price: 1599 },
    explorer: {
      tier: 'navigator',
      name: 'Navigator',
      creationLimit: 25,
      savingLimit: 25,
      price: 3499,
    },
    navigator: {
      tier: 'voyager',
      name: 'Voyager',
      creationLimit: 50,
      savingLimit: 50,
      price: 6999,
    },
    voyager: { tier: 'crew', name: 'Crew', creationLimit: 10, savingLimit: 10, price: 1999 },
    crew: { tier: 'fleet', name: 'Fleet', creationLimit: 30, savingLimit: 30, price: 5399 },
    fleet: { tier: 'armada', name: 'Armada', creationLimit: 60, savingLimit: 60, price: 10899 },
  };

  return (
    upgradePath[currentTier] || {
      tier: 'navigator',
      name: 'Navigator',
      creationLimit: 25,
      savingLimit: 25,
      price: 1599,
    }
  );
}
