/**
 * Centralized Tier Limits Configuration
 *
 * This file provides a type-safe interface to tier limits stored in the database.
 * Part of CVE-002 fix: Eliminates hard-coded tier limits scattered across the codebase.
 *
 * IMPORTANT: NEVER hard-code limits - always fetch from tier_config table.
 * This ensures a single source of truth for all tier-related configuration.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface TierLimits {
  creationLimit: number;
  savingLimit: number;
  displayName: string;
  isUnlimited: boolean;
}

export interface TierConfig extends TierLimits {
  tier: string;
  isTeamTier: boolean;
  priceMonthlyPaise: number | null;
  priceYearlyPaise: number | null;
  features: Record<string, any>;
}

// Cache for tier limits with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const limitsCache = new Map<string, CacheEntry<TierLimits>>();
const configCache = new Map<string, CacheEntry<TierConfig>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour TTL for production stability

/**
 * Get tier limits from database with caching
 *
 * FAIL-CLOSED: Returns minimal limits (0) on any error to prevent unauthorized access.
 * This is a security-first approach - deny by default.
 *
 * @param supabase - Supabase client instance
 * @param tier - The subscription tier to fetch limits for
 * @returns TierLimits object with creation/saving limits
 */
export async function getTierLimits(supabase: SupabaseClient, tier: string): Promise<TierLimits> {
  // Check cache first
  const cached = limitsCache.get(tier);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase.rpc('get_tier_limits', {
      p_tier: tier,
    });

    if (error) {
      console.error('[SECURITY] Failed to fetch tier limits - FAILING CLOSED', {
        tier,
        error: error.message,
        code: error.code,
      });
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('[SECURITY] No tier limits found - FAILING CLOSED', { tier });
      throw new Error(`Tier configuration not found: ${tier}`);
    }

    const limits: TierLimits = {
      creationLimit: data[0].creation_limit,
      savingLimit: data[0].saving_limit,
      displayName: data[0].display_name,
      isUnlimited: data[0].is_unlimited,
    };

    // Update cache
    limitsCache.set(tier, {
      data: limits,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return limits;
  } catch (error) {
    console.error('[SECURITY] Exception fetching tier limits - FAILING CLOSED', {
      tier,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // FAIL-CLOSED: Return minimal safe limits on any error
    // This prevents unauthorized access if database is unavailable
    return {
      creationLimit: 0,
      savingLimit: 0,
      displayName: 'Unknown',
      isUnlimited: false,
    };
  }
}

/**
 * Get full tier configuration from database
 * Used for pricing pages, admin panels, and detailed tier information.
 *
 * @param supabase - Supabase client instance
 * @param tier - The subscription tier to fetch configuration for
 * @returns Full TierConfig object or null if not found
 */
export async function getTierConfig(
  supabase: SupabaseClient,
  tier: string
): Promise<TierConfig | null> {
  // Check cache first
  const cached = configCache.get(tier);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .from('tier_config')
      .select('*')
      .eq('tier', tier)
      .single();

    if (error) {
      console.error('[CONFIG] Failed to fetch tier config', {
        tier,
        error: error.message,
      });
      return null;
    }

    if (!data) {
      console.warn('[CONFIG] Tier configuration not found', { tier });
      return null;
    }

    const config: TierConfig = {
      tier: data.tier,
      creationLimit: data.blueprint_creation_limit,
      savingLimit: data.blueprint_saving_limit,
      displayName: data.display_name,
      isUnlimited: data.blueprint_creation_limit === -1 || data.blueprint_saving_limit === -1,
      isTeamTier: data.is_team_tier,
      priceMonthlyPaise: data.price_monthly_paise,
      priceYearlyPaise: data.price_yearly_paise,
      features: data.features || {},
    };

    // Update cache
    configCache.set(tier, {
      data: config,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return config;
  } catch (error) {
    console.error('[CONFIG] Exception fetching tier config', {
      tier,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get all tier configurations (for pricing pages)
 * Excludes developer tier from public listings.
 *
 * @param supabase - Supabase client instance
 * @returns Array of all public tier configurations
 */
export async function getAllTierConfigs(supabase: SupabaseClient): Promise<TierConfig[]> {
  try {
    const { data, error } = await supabase.rpc('get_all_tier_configs');

    if (error) {
      console.error('[CONFIG] Failed to fetch all tier configs', {
        error: error.message,
      });
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[CONFIG] No tier configurations found');
      return [];
    }

    return data.map((row: any) => ({
      tier: row.tier,
      creationLimit: row.creation_limit,
      savingLimit: row.saving_limit,
      displayName: row.display_name,
      isUnlimited: row.creation_limit === -1 || row.saving_limit === -1,
      isTeamTier: row.is_team_tier,
      priceMonthlyPaise: row.price_monthly_paise,
      priceYearlyPaise: row.price_yearly_paise,
      features: row.features || {},
    }));
  } catch (error) {
    console.error('[CONFIG] Exception fetching all tier configs', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Clear the tier limits cache
 * Useful for testing or after tier configuration updates.
 */
export function clearTierLimitsCache(): void {
  limitsCache.clear();
  configCache.clear();
  console.log('[CONFIG] Tier limits cache cleared');
}

/**
 * Check if a tier has unlimited access
 *
 * @param tier - The subscription tier to check
 * @returns True if tier has unlimited creation or saving
 */
export function isTierUnlimited(tier: string): boolean {
  return tier === 'enterprise' || tier === 'developer';
}

/**
 * Format tier display name consistently
 *
 * @param tier - The subscription tier
 * @param displayName - The display name from config
 * @returns Formatted display name for UI
 */
export function formatTierDisplayName(tier: string, displayName: string): string {
  if (tier === 'free') {
    return 'Free Tier Member';
  }
  if (tier === 'explorer') {
    return 'Explorer Member';
  }
  if (tier === 'developer') {
    return 'Developer';
  }
  return `${displayName} Member`;
}
