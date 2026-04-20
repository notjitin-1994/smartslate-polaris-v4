/**
 * Subscription Grace Period Manager
 *
 * @description Handles grace period logic for subscription renewals,
 * payment failures, and subscription lifecycle management
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { createClient } from '@/lib/supabase/server';
import { logEvent } from '@/lib/monitoring/subscriptionMonitoring';
import { getSubscriptionStatusMapping } from '@/lib/razorpay/subscriptionStatusMapping';

// ============================================================================
// Grace Period Configuration
// ============================================================================

export interface GracePeriodConfig {
  /** Length of grace period in days */
  durationDays: number;
  /** When grace period starts (days before/after renewal) */
  startTiming: 'before' | 'after' | 'immediate';
  /** Warning notifications to send during grace period */
  warningDays: number[];
  /** What happens when grace period ends */
  endAction: 'downgrade' | 'cancel' | 'suspend';
  /** Whether to allow limited functionality during grace period */
  restrictedAccess: boolean;
}

const GRACE_PERIOD_CONFIGS: Record<string, GracePeriodConfig> = {
  // Personal tiers (Explorer, Navigator, Voyager)
  personal: {
    durationDays: 7,
    startTiming: 'after',
    warningDays: [1, 3, 5], // Send warnings on these days
    endAction: 'downgrade',
    restrictedAccess: true,
  },

  // Team tiers (Crew, Fleet, Armada)
  team: {
    durationDays: 14,
    startTiming: 'after',
    warningDays: [2, 5, 10],
    endAction: 'suspend',
    restrictedAccess: true,
  },

  // Enterprise tier
  enterprise: {
    durationDays: 30,
    startTiming: 'after',
    warningDays: [7, 14, 21],
    endAction: 'suspend',
    restrictedAccess: false, // Full access during enterprise grace period
  },

  // Developer tier (special handling)
  developer: {
    durationDays: 90, // Long grace period for developers
    startTiming: 'after',
    warningDays: [15, 30, 60],
    endAction: 'downgrade',
    restrictedAccess: false,
  },
};

// ============================================================================
// Grace Period Types and Interfaces
// ============================================================================

export interface GracePeriodStatus {
  isInGracePeriod: boolean;
  gracePeriodStart?: Date;
  gracePeriodEnd?: Date;
  daysRemaining?: number;
  warningSent: boolean[];
  restrictions: {
    canCreateBlueprints: boolean;
    canSaveBlueprints: boolean;
    canAccessPremiumFeatures: boolean;
    maxBlueprintsPerMonth: number;
  };
  nextAction: {
    type: 'none' | 'warning' | 'end_action' | 'check_payment';
    dueDate?: Date;
    action?: string;
  };
}

export interface GracePeriodEvent {
  id: string;
  userId: string;
  eventType:
    | 'grace_period_started'
    | 'grace_period_warning'
    | 'grace_period_ended'
    | 'grace_period_extended';
  subscriptionId: string;
  tier: string;
  eventData: {
    gracePeriodStart: string;
    gracePeriodEnd: string;
    warningLevel?: number;
    endAction?: string;
    restrictedAccess: boolean;
  };
  timestamp: Date;
}

// ============================================================================
// Grace Period Calculation Functions
// ============================================================================

/**
 * Get grace period configuration for a subscription tier
 */
function getGracePeriodConfig(subscriptionTier: string): GracePeriodConfig {
  // Map subscription tiers to config categories
  const tierMapping: Record<string, string> = {
    explorer: 'personal',
    navigator: 'personal',
    voyager: 'personal',
    crew: 'team',
    fleet: 'team',
    armada: 'team',
    enterprise: 'enterprise',
    developer: 'developer',
  };

  const category = tierMapping[subscriptionTier] || 'personal';
  return GRACE_PERIOD_CONFIGS[category];
}

/**
 * Calculate grace period dates based on subscription status and last payment
 */
function calculateGracePeriodDates(
  subscriptionTier: string,
  currentStatus: string,
  lastPaymentDate?: Date,
  subscriptionEndDate?: Date
): { start?: Date; end?: Date } {
  const config = getGracePeriodConfig(subscriptionTier);
  const statusMapping = getSubscriptionStatusMapping();

  // Get internal status
  const internalStatus = statusMapping.toInternal[currentStatus] || currentStatus;

  let start: Date | undefined;
  let end: Date | undefined;

  if (
    config.startTiming === 'immediate' &&
    (internalStatus === 'expired' || internalStatus === 'cancelled')
  ) {
    // Grace period starts immediately when subscription expires
    start = subscriptionEndDate || lastPaymentDate || new Date();
  } else if (
    config.startTiming === 'after' &&
    (internalStatus === 'expired' || internalStatus === 'cancelled')
  ) {
    // Grace period starts after subscription ends
    start = subscriptionEndDate || lastPaymentDate || new Date();
  }

  if (start) {
    end = new Date(start.getTime() + config.durationDays * 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

/**
 * Get grace period status for a user's subscription
 */
export async function getGracePeriodStatus(userId: string): Promise<GracePeriodStatus> {
  const supabase = createClient();

  try {
    // Get user's current subscription information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(
        `
        subscription_tier,
        subscription_status,
        subscription_ends_at,
        razorpay_subscription_id,
        grace_period_start,
        grace_period_end,
        grace_period_warnings_sent,
        usage_metadata
      `
      )
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
    }

    const config = getGracePeriodConfig(profile.subscription_tier);
    const now = new Date();

    // Check if user is currently in grace period
    let isInGracePeriod = false;
    let gracePeriodStart = profile.grace_period_start
      ? new Date(profile.grace_period_start)
      : undefined;
    let gracePeriodEnd = profile.grace_period_end ? new Date(profile.grace_period_end) : undefined;

    // Calculate grace period if not already set
    if (!gracePeriodStart && !gracePeriodEnd) {
      const { start, end } = calculateGracePeriodDates(
        profile.subscription_tier,
        profile.subscription_status,
        undefined,
        profile.subscription_ends_at ? new Date(profile.subscription_ends_at) : undefined
      );

      if (start && end) {
        gracePeriodStart = start;
        gracePeriodEnd = end;

        // Update user profile with grace period dates
        await supabase
          .from('user_profiles')
          .update({
            grace_period_start: start.toISOString(),
            grace_period_end: end.toISOString(),
          })
          .eq('id', userId);
      }
    }

    // Check if currently in grace period
    if (gracePeriodStart && gracePeriodEnd) {
      isInGracePeriod = now >= gracePeriodStart && now <= gracePeriodEnd;
    }

    // Calculate days remaining
    let daysRemaining: number | undefined;
    if (isInGracePeriod && gracePeriodEnd) {
      daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    }

    // Check for warning days
    const warningSent = profile.grace_period_warnings_sent || [];
    const warningsSentThisPeriod: boolean[] = [];

    config.warningDays.forEach((day) => {
      if (gracePeriodEnd) {
        const warningDate = new Date(gracePeriodEnd.getTime() - day * 24 * 60 * 60 * 1000);
        if (now >= warningDate && warningSent.includes(day)) {
          warningsSentThisPeriod.push(true);
        } else if (now >= warningDate) {
          warningsSentThisPeriod.push(false);
        } else {
          warningsSentThisPeriod.push(false);
        }
      } else {
        warningsSentThisPeriod.push(false);
      }
    });

    // Determine next action
    let nextAction: GracePeriodStatus['nextAction'] = {
      type: 'none',
    };

    if (isInGracePeriod && gracePeriodEnd) {
      // Check if any warnings are due
      for (const warningDay of config.warningDays) {
        if (!warningSent.includes(warningDay)) {
          const warningDate = new Date(gracePeriodEnd.getTime() - warningDay * 24 * 60 * 60 * 1000);
          if (now >= warningDate) {
            nextAction = {
              type: 'warning',
              dueDate: now,
              action: `Send grace period warning - ${warningDay} days remaining`,
            };
            break;
          }
        }
      }

      // Check if grace period is ending
      if (nextAction.type === 'none' && daysRemaining !== undefined && daysRemaining <= 1) {
        nextAction = {
          type: 'end_action',
          dueDate: gracePeriodEnd,
          action: config.endAction,
        };
      }
    } else if (!isInGracePeriod && profile.subscription_status !== 'active') {
      // Check if payment needs to be checked
      nextAction = {
        type: 'check_payment',
        action: 'Verify payment status and potentially start grace period',
      };
    }

    // Calculate restrictions
    const restrictions = calculateGracePeriodRestrictions(
      profile.subscription_tier,
      isInGracePeriod,
      config,
      daysRemaining
    );

    return {
      isInGracePeriod,
      gracePeriodStart,
      gracePeriodEnd,
      daysRemaining,
      warningSent: warningsSentThisPeriod,
      restrictions,
      nextAction,
    };
  } catch (error) {
    console.error('Failed to get grace period status:', error);

    // Return safe default
    return {
      isInGracePeriod: false,
      restrictions: {
        canCreateBlueprints: false,
        canSaveBlueprints: false,
        canAccessPremiumFeatures: false,
        maxBlueprintsPerMonth: 0,
      },
      nextAction: {
        type: 'check_payment',
        action: 'Error occurred - check subscription status',
      },
    };
  }
}

/**
 * Calculate user restrictions during grace period
 */
function calculateGracePeriodRestrictions(
  subscriptionTier: string,
  isInGracePeriod: boolean,
  config: GracePeriodConfig,
  daysRemaining?: number
): GracePeriodStatus['restrictions'] {
  if (!isInGracePeriod) {
    // Default restrictions for non-active subscriptions
    return {
      canCreateBlueprints: subscriptionTier === 'explorer', // Allow free tier creation
      canSaveBlueprints: false,
      canAccessPremiumFeatures: false,
      maxBlueprintsPerMonth: subscriptionTier === 'explorer' ? 2 : 0,
    };
  }

  if (!config.restrictedAccess) {
    // Full access during grace period (enterprise, developer)
    return {
      canCreateBlueprints: true,
      canSaveBlueprints: true,
      canAccessPremiumFeatures: true,
      maxBlueprintsPerMonth: 999, // Unlimited
    };
  }

  // Restricted access with reduced limits
  const baseLimits: Record<string, number> = {
    explorer: 2,
    navigator: 10,
    voyager: 25,
    crew: 50,
    fleet: 100,
    armada: 200,
    enterprise: 999,
    developer: 999,
  };

  const baseLimit = baseLimits[subscriptionTier] || 2;

  // Reduce limit based on days remaining
  let reducedLimit = baseLimit;
  if (daysRemaining !== undefined) {
    if (daysRemaining <= 1) {
      reducedLimit = Math.ceil(baseLimit * 0.1); // 10% of normal limit
    } else if (daysRemaining <= 3) {
      reducedLimit = Math.ceil(baseLimit * 0.25); // 25% of normal limit
    } else if (daysRemaining <= 7) {
      reducedLimit = Math.ceil(baseLimit * 0.5); // 50% of normal limit
    }
  }

  return {
    canCreateBlueprints: reducedLimit > 0,
    canSaveBlueprints: reducedLimit > 0,
    canAccessPremiumFeatures: false, // Premium features disabled during grace period
    maxBlueprintsPerMonth: reducedLimit,
  };
}

// ============================================================================
// Grace Period Management Functions
// ============================================================================

/**
 * Start grace period for a user
 */
export async function startGracePeriod(
  userId: string,
  subscriptionId: string,
  reason: 'payment_failed' | 'subscription_expired' | 'subscription_cancelled' = 'payment_failed'
): Promise<void> {
  const supabase = createClient();

  try {
    // Get user's subscription information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_ends_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
    }

    const config = getGracePeriodConfig(profile.subscription_tier);
    const now = new Date();

    const gracePeriodStart = now;
    const gracePeriodEnd = new Date(now.getTime() + config.durationDays * 24 * 60 * 60 * 1000);

    // Update user profile
    await supabase
      .from('user_profiles')
      .update({
        grace_period_start: gracePeriodStart.toISOString(),
        grace_period_end: gracePeriodEnd.toISOString(),
        grace_period_warnings_sent: [],
        grace_period_reason: reason,
      })
      .eq('id', userId);

    // Log grace period start event
    await logEvent({
      id: `grace-start-${userId}-${Date.now()}`,
      type: 'security',
      severity: 'warning',
      category: 'grace_period',
      title: 'Grace Period Started',
      description: `Grace period started for ${profile.subscription_tier} subscription due to: ${reason}`,
      data: {
        userId,
        subscriptionId,
        subscriptionTier: profile.subscription_tier,
        reason,
        gracePeriodStart: gracePeriodStart.toISOString(),
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        durationDays: config.durationDays,
        endAction: config.endAction,
      },
      tags: ['grace-period', 'started', profile.subscription_tier, reason],
      timestamp: now,
    });

    // Add to audit log
    await supabase.from('subscription_audit_log').insert({
      user_id: userId,
      subscription_id: subscriptionId,
      action: 'grace_period_started',
      old_status: 'active',
      new_status: 'grace_period',
      details: {
        reason,
        gracePeriodStart: gracePeriodStart.toISOString(),
        gracePeriodEnd: gracePeriodEnd.toISOString(),
        durationDays: config.durationDays,
      },
      created_at: now.toISOString(),
    });

    console.log(`Grace period started for user ${userId}, ends ${gracePeriodEnd.toISOString()}`);
  } catch (error) {
    console.error('Failed to start grace period:', error);

    // Log error
    await logEvent({
      id: `grace-start-error-${userId}-${Date.now()}`,
      type: 'system',
      severity: 'error',
      category: 'grace_period',
      title: 'Grace Period Start Failed',
      description: `Failed to start grace period for user: ${(error as Error).message}`,
      data: {
        userId,
        subscriptionId,
        reason,
        error: (error as Error).stack,
      },
      tags: ['grace-period', 'error', 'start-failed'],
      timestamp: new Date(),
    });

    throw error;
  }
}

/**
 * Send grace period warning
 */
export async function sendGracePeriodWarning(userId: string, warningDay: number): Promise<void> {
  const supabase = createClient();

  try {
    // Get user's grace period information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(
        `
        subscription_tier,
        grace_period_end,
        grace_period_warnings_sent,
        email
      `
      )
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
    }

    if (!profile.grace_period_end) {
      throw new Error('No grace period end date found');
    }

    const warningsSent = profile.grace_period_warnings_sent || [];
    if (warningsSent.includes(warningDay)) {
      console.log(`Warning for day ${warningDay} already sent to user ${userId}`);
      return;
    }

    // Add warning to sent list
    const updatedWarnings = [...warningsSent, warningDay];
    await supabase
      .from('user_profiles')
      .update({
        grace_period_warnings_sent: updatedWarnings,
      })
      .eq('id', userId);

    // Log warning event
    await logEvent({
      id: `grace-warning-${userId}-${warningDay}-${Date.now()}`,
      type: 'business',
      severity: 'warning',
      category: 'grace_period',
      title: 'Grace Period Warning Sent',
      description: `Grace period warning sent: ${warningDay} days remaining`,
      data: {
        userId,
        email: profile.email,
        subscriptionTier: profile.subscription_tier,
        warningDay,
        daysRemaining: warningDay,
        gracePeriodEnd: profile.grace_period_end,
      },
      tags: ['grace-period', 'warning', `day-${warningDay}`, profile.subscription_tier],
      timestamp: new Date(),
    });

    console.log(`Grace period warning sent to user ${userId}: ${warningDay} days remaining`);
  } catch (error) {
    console.error('Failed to send grace period warning:', error);

    // Log error
    await logEvent({
      id: `grace-warning-error-${userId}-${warningDay}-${Date.now()}`,
      type: 'system',
      severity: 'error',
      category: 'grace_period',
      title: 'Grace Period Warning Failed',
      description: `Failed to send grace period warning: ${(error as Error).message}`,
      data: {
        userId,
        warningDay,
        error: (error as Error).stack,
      },
      tags: ['grace-period', 'error', 'warning-failed'],
      timestamp: new Date(),
    });

    throw error;
  }
}

/**
 * End grace period and apply end action
 */
export async function endGracePeriod(userId: string, subscriptionId: string): Promise<void> {
  const supabase = createClient();

  try {
    // Get user's subscription information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, grace_period_reason')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch user profile: ${profileError?.message}`);
    }

    const config = getGracePeriodConfig(profile.subscription_tier);
    const now = new Date();

    let newStatus: string;
    let newTier: string = profile.subscription_tier;

    // Apply end action
    switch (config.endAction) {
      case 'downgrade':
        newStatus = 'active';
        newTier = 'explorer'; // Downgrade to free tier
        break;
      case 'cancel':
        newStatus = 'cancelled';
        break;
      case 'suspend':
        newStatus = 'suspended';
        break;
      default:
        newStatus = 'expired';
    }

    // Update user profile
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier: newTier,
        subscription_status: newStatus,
        grace_period_start: null,
        grace_period_end: null,
        grace_period_warnings_sent: [],
        grace_period_reason: null,
        // Reset usage limits to new tier defaults
        blueprint_creation_limit: getDefaultLimits(newTier).creationLimit,
        blueprint_saving_limit: getDefaultLimits(newTier).savingLimit,
      })
      .eq('id', userId);

    // Log grace period end event
    await logEvent({
      id: `grace-end-${userId}-${Date.now()}`,
      type: 'business',
      severity: 'warning',
      category: 'grace_period',
      title: 'Grace Period Ended',
      description: `Grace period ended, applied action: ${config.endAction}`,
      data: {
        userId,
        subscriptionId,
        previousTier: profile.subscription_tier,
        newTier,
        newStatus,
        endAction: config.endAction,
        reason: profile.grace_period_reason,
      },
      tags: ['grace-period', 'ended', config.endAction, profile.subscription_tier],
      timestamp: now,
    });

    // Add to audit log
    await supabase.from('subscription_audit_log').insert({
      user_id: userId,
      subscription_id: subscriptionId,
      action: 'grace_period_ended',
      old_status: 'grace_period',
      new_status: newStatus,
      details: {
        previousTier: profile.subscription_tier,
        newTier,
        endAction: config.endAction,
        reason: profile.grace_period_reason,
      },
      created_at: now.toISOString(),
    });

    console.log(`Grace period ended for user ${userId}, applied action: ${config.endAction}`);
  } catch (error) {
    console.error('Failed to end grace period:', error);

    // Log error
    await logEvent({
      id: `grace-end-error-${userId}-${Date.now()}`,
      type: 'system',
      severity: 'error',
      category: 'grace_period',
      title: 'Grace Period End Failed',
      description: `Failed to end grace period: ${(error as Error).message}`,
      data: {
        userId,
        subscriptionId,
        error: (error as Error).stack,
      },
      tags: ['grace-period', 'error', 'end-failed'],
      timestamp: new Date(),
    });

    throw error;
  }
}

/**
 * Get default limits for a subscription tier
 */
function getDefaultLimits(tier: string): { creationLimit: number; savingLimit: number } {
  const limits: Record<string, { creationLimit: number; savingLimit: number }> = {
    explorer: { creationLimit: 2, savingLimit: 1 },
    navigator: { creationLimit: 15, savingLimit: 10 },
    voyager: { creationLimit: 50, savingLimit: 35 },
    crew: { creationLimit: 200, savingLimit: 150 },
    fleet: { creationLimit: 500, savingLimit: 400 },
    armada: { creationLimit: 1500, savingLimit: 1200 },
    enterprise: { creationLimit: 9999, savingLimit: 9999 },
    developer: { creationLimit: 9999, savingLimit: 9999 },
  };

  return limits[tier] || limits.explorer;
}

// ============================================================================
// Automated Grace Period Management
// ============================================================================

/**
 * Process all grace periods (for scheduled jobs)
 */
export async function processAllGracePeriods(): Promise<{
  processed: number;
  warningsSent: number;
  gracePeriodsEnded: number;
  errors: string[];
}> {
  const supabase = createClient();
  const results = {
    processed: 0,
    warningsSent: 0,
    gracePeriodsEnded: 0,
    errors: [] as string[],
  };

  try {
    const now = new Date();

    // Get all users with active grace periods
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        subscription_tier,
        subscription_status,
        grace_period_start,
        grace_period_end,
        grace_period_warnings_sent,
        razorpay_subscription_id
      `
      )
      .not('grace_period_end', 'is', null);

    if (usersError) {
      throw new Error(`Failed to fetch users with grace periods: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('No users with active grace periods found');
      return results;
    }

    console.log(`Processing ${users.length} users with grace periods`);

    for (const user of users) {
      try {
        results.processed++;

        const config = getGracePeriodConfig(user.subscription_tier);
        const gracePeriodEnd = new Date(user.grace_period_end);
        const warningsSent = user.grace_period_warnings_sent || [];

        // Check if grace period has ended
        if (now > gracePeriodEnd) {
          await endGracePeriod(user.id, user.razorpay_subscription_id);
          results.gracePeriodsEnded++;
          continue;
        }

        // Check if warnings need to be sent
        for (const warningDay of config.warningDays) {
          if (!warningsSent.includes(warningDay)) {
            const warningDate = new Date(
              gracePeriodEnd.getTime() - warningDay * 24 * 60 * 60 * 1000
            );

            if (now >= warningDate) {
              await sendGracePeriodWarning(user.id, warningDay);
              results.warningsSent++;
            }
          }
        }
      } catch (error) {
        const errorMsg = `Failed to process grace period for user ${user.id}: ${(error as Error).message}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // Log summary
    await logEvent({
      id: `grace-period-batch-${Date.now()}`,
      type: 'system',
      severity: 'info',
      category: 'grace_period',
      title: 'Grace Period Batch Processing Complete',
      description: `Processed ${results.processed} grace periods`,
      data: {
        processed: results.processed,
        warningsSent: results.warningsSent,
        gracePeriodsEnded: results.gracePeriodsEnded,
        errors: results.errors.length,
      },
      tags: ['grace-period', 'batch-processing'],
      timestamp: now,
    });

    console.log(`Grace period processing complete:`, results);
    return results;
  } catch (error) {
    console.error('Failed to process grace periods:', error);

    // Log error
    await logEvent({
      id: `grace-period-batch-error-${Date.now()}`,
      type: 'system',
      severity: 'error',
      category: 'grace_period',
      title: 'Grace Period Batch Processing Failed',
      description: `Failed to process grace periods: ${(error as Error).message}`,
      data: {
        error: (error as Error).stack,
      },
      tags: ['grace-period', 'error', 'batch-processing'],
      timestamp: new Date(),
    });

    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a user can perform an action during grace period
 */
export async function checkGracePeriodRestrictions(
  userId: string,
  action: 'create_blueprint' | 'save_blueprint' | 'access_premium_features'
): Promise<{ allowed: boolean; reason?: string; remainingDays?: number }> {
  const graceStatus = await getGracePeriodStatus(userId);

  if (!graceStatus.isInGracePeriod) {
    return { allowed: true };
  }

  switch (action) {
    case 'create_blueprint':
      return {
        allowed: graceStatus.restrictions.canCreateBlueprints,
        reason: graceStatus.restrictions.canCreateBlueprints
          ? undefined
          : `Blueprint creation restricted during grace period. ${graceStatus.daysRemaining} days remaining.`,
        remainingDays: graceStatus.daysRemaining,
      };

    case 'save_blueprint':
      return {
        allowed: graceStatus.restrictions.canSaveBlueprints,
        reason: graceStatus.restrictions.canSaveBlueprints
          ? undefined
          : `Blueprint saving restricted during grace period. ${graceStatus.daysRemaining} days remaining.`,
        remainingDays: graceStatus.daysRemaining,
      };

    case 'access_premium_features':
      return {
        allowed: graceStatus.restrictions.canAccessPremiumFeatures,
        reason: graceStatus.restrictions.canAccessPremiumFeatures
          ? undefined
          : `Premium features restricted during grace period. ${graceStatus.daysRemaining} days remaining.`,
        remainingDays: graceStatus.daysRemaining,
      };

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

export default {
  getGracePeriodStatus,
  startGracePeriod,
  sendGracePeriodWarning,
  endGracePeriod,
  processAllGracePeriods,
  checkGracePeriodRestrictions,
  getGracePeriodConfig,
};
