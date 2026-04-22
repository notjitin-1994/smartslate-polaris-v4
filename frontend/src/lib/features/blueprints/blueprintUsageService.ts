import type { SupabaseClient } from '@supabase/supabase-js';

export interface BlueprintUsageInfo {
  creationCount: number;
  savingCount: number;
  creationLimit: number;
  savingLimit: number;
  isExempt: boolean;
  exemptionReason?: string;
  lastCreation?: string;
  lastSaving?: string;
}

export interface EffectiveLimits {
  creationLimit: number;
  savingLimit: number;
  creationUsed: number;
  savingUsed: number;
  creationAvailable: number;
  savingAvailable: number;
}

export interface ComprehensiveUserLimits {
  role: string;
  tier: string;
  maxGenerationsMonthly: number;
  maxSavedStarmaps: number;
  currentGenerations: number;
  currentSavedStarmaps: number;
  generationsRemaining: number;
  savedRemaining: number;
  isExempt: boolean;
  hasFreeTierCarryover: boolean;
  carryoverExpiresAt: string | null;
}

export class BlueprintUsageService {
  /**
   * Get blueprint usage information for a user
   */
  static async getBlueprintUsageInfo(
    supabase: SupabaseClient,
    userId: string
  ): Promise<BlueprintUsageInfo> {
    console.log('[BlueprintUsageService] Calling get_blueprint_usage_info RPC for user:', userId);

    const { data, error } = await supabase.rpc('get_blueprint_usage_info', {
      p_user_id: userId,
    });

    console.log('[BlueprintUsageService] RPC response - data:', JSON.stringify(data, null, 2));
    console.log('[BlueprintUsageService] RPC response - error:', error);

    if (error) {
      console.error('Error fetching blueprint usage info:', error);
      throw new Error('Failed to fetch blueprint usage information');
    }

    // RPC function returns an array, access the first element
    if (!data || data.length === 0) {
      console.error('[BlueprintUsageService] No data or empty array returned');
      throw new Error('No usage data returned from database');
    }

    console.log('[BlueprintUsageService] Data is array:', Array.isArray(data));
    console.log('[BlueprintUsageService] Data length:', data.length);

    const usageData = data[0];
    console.log('[BlueprintUsageService] First element:', JSON.stringify(usageData, null, 2));

    const result = {
      creationCount: usageData.creation_count || 0,
      savingCount: usageData.saving_count || 0,
      creationLimit: usageData.creation_limit || 2,
      savingLimit: usageData.saving_limit || 2,
      isExempt: usageData.is_exempt || false,
      exemptionReason: usageData.exemption_reason,
      lastCreation: usageData.last_creation,
      lastSaving: usageData.last_saving,
    };

    console.log('[BlueprintUsageService] Returning result:', JSON.stringify(result, null, 2));

    return result;
  }

  /**
   * Get raw blueprint counts for debugging (bypasses exemption logic)
   */
  static async getRawBlueprintCounts(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{
    totalBlueprints: number;
    completedBlueprints: number;
    draftBlueprints: number;
  }> {
    const { data: blueprints, error } = await supabase
      .from('blueprint_generator')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching raw blueprint counts:', error);
      throw new Error('Failed to fetch blueprint counts');
    }

    const totalBlueprints = blueprints?.length || 0;
    const completedBlueprints = blueprints?.filter((b) => b.status === 'completed').length || 0;
    const draftBlueprints = blueprints?.filter((b) => b.status === 'draft').length || 0;

    return {
      totalBlueprints,
      completedBlueprints,
      draftBlueprints,
    };
  }

  /**
   * Check if user can create a blueprint
   * Uses the new check_blueprint_creation_limits function that handles monthly rollover
   */
  static async canCreateBlueprint(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ canCreate: boolean; reason?: string }> {
    const { data, error } = await supabase.rpc('check_blueprint_creation_limits', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking blueprint creation limits:', error);
      throw new Error('Failed to check blueprint creation limits');
    }

    if (!data || data.length === 0) {
      // Fallback: if no data, deny creation
      return {
        canCreate: false,
        reason: 'Unable to verify blueprint creation limits',
      };
    }

    const result = data[0];
    return {
      canCreate: result.can_create || false,
      reason: result.reason || undefined,
    };
  }

  /**
   * Check if user can save a blueprint
   * Uses the new check_blueprint_saving_limits function that handles monthly rollover
   */
  static async canSaveBlueprint(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ canSave: boolean; reason?: string }> {
    const { data, error } = await supabase.rpc('check_blueprint_saving_limits', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking blueprint saving limits:', error);
      throw new Error('Failed to check blueprint saving limits');
    }

    if (!data || data.length === 0) {
      // Fallback: if no data, deny saving
      return {
        canSave: false,
        reason: 'Unable to verify blueprint saving limits',
      };
    }

    const result = data[0];
    return {
      canSave: result.can_save || false,
      reason: result.reason || undefined,
    };
  }

  /**
   * Increment blueprint creation count
   */
  static async incrementCreationCount(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('increment_blueprint_creation_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error incrementing blueprint creation count:', error);
      throw new Error('Failed to increment blueprint creation count');
    }

    return data;
  }

  /**
   * Increment blueprint saving count
   */
  static async incrementSavingCount(supabase: SupabaseClient, userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('increment_blueprint_saving_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error incrementing blueprint saving count:', error);
      throw new Error('Failed to increment blueprint saving count');
    }

    return data;
  }

  /**
   * Exempt a user from blueprint limits (admin function)
   */
  static async exemptUserFromLimits(
    supabase: SupabaseClient,
    userId: string,
    reason: string = 'Developer exemption'
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('exempt_user_from_blueprint_limits', {
      p_user_id: userId,
      p_reason: reason,
    });

    if (error) {
      console.error('Error exempting user from blueprint limits:', error);
      throw new Error('Failed to exempt user from blueprint limits');
    }

    return data;
  }

  /**
   * Get effective limits with rollover support (NEW)
   * This function automatically handles monthly resets and carryover calculations
   */
  static async getEffectiveLimits(
    supabase: SupabaseClient,
    userId: string
  ): Promise<EffectiveLimits> {
    const { data, error } = await supabase.rpc('get_effective_limits', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching effective limits:', error);
      throw new Error('Failed to fetch effective limits');
    }

    if (!data || data.length === 0) {
      throw new Error('No limits data returned');
    }

    const limits = data[0];
    return {
      creationLimit: limits.creation_limit || 0,
      savingLimit: limits.saving_limit || 0,
      creationUsed: limits.creation_used || 0,
      savingUsed: limits.saving_used || 0,
      creationAvailable: limits.creation_available || 0,
      savingAvailable: limits.saving_available || 0,
    };
  }

  /**
   * Get comprehensive user limits (NEW)
   * Includes rollover status, carryover information, and reset dates
   */
  static async getComprehensiveUserLimits(
    supabase: SupabaseClient,
    userId: string
  ): Promise<ComprehensiveUserLimits> {
    const { data, error } = await supabase.rpc('get_user_limits', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching comprehensive user limits:', error);
      throw new Error('Failed to fetch user limits');
    }

    if (!data || data.length === 0) {
      throw new Error('No user limits data returned');
    }

    const limits = data[0];
    return {
      role: limits.role || 'user',
      tier: limits.tier || 'free',
      maxGenerationsMonthly: limits.max_generations_monthly || 0,
      maxSavedStarmaps: limits.max_saved_starmaps || 0,
      currentGenerations: limits.current_generations || 0,
      currentSavedStarmaps: limits.current_saved_starmaps || 0,
      generationsRemaining: limits.generations_remaining || 0,
      savedRemaining: limits.saved_remaining || 0,
      isExempt: limits.is_exempt || false,
      hasFreeTierCarryover: limits.has_free_tier_carryover || false,
      carryoverExpiresAt: limits.carryover_expires_at || null,
    };
  }

  /**
   * Handle tier upgrade (from free to paid) (NEW)
   * Automatically sets up carryover for unused free tier limits
   */
  static async handleTierUpgrade(
    supabase: SupabaseClient,
    userId: string,
    newTier: string
  ): Promise<void> {
    const { error } = await supabase.rpc('handle_tier_upgrade', {
      p_user_id: userId,
      p_new_tier: newTier,
    });

    if (error) {
      console.error('Error handling tier upgrade:', error);
      throw new Error('Failed to handle tier upgrade');
    }
  }

  /**
   * Reset monthly limits for all users (admin/cron function) (NEW)
   * This should be called by a scheduled job once per day
   */
  static async resetAllMonthlyLimits(supabase: SupabaseClient): Promise<{
    usersProcessed: number;
    usersReset: number;
  }> {
    const { data, error } = await supabase.rpc('reset_all_monthly_limits');

    if (error) {
      console.error('Error resetting monthly limits:', error);
      throw new Error('Failed to reset monthly limits');
    }

    if (!data || data.length === 0) {
      return { usersProcessed: 0, usersReset: 0 };
    }

    return {
      usersProcessed: data[0].users_processed || 0,
      usersReset: data[0].users_reset || 0,
    };
  }
}
