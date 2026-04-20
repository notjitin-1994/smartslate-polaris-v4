/**
 * Admin Tier Upgrade API Endpoint
 * Handles subscription tier upgrades with automatic free tier carryover
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { BlueprintUsageService } from '@/lib/services/blueprintUsageService';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

const UpgradeTierSchema = z.object({
  userId: z.string().uuid(),
  newTier: z.enum(['free', 'explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada']),
});

export interface UpgradeTierResponse {
  success: boolean;
  message?: string;
  error?: string;
  carryoverInfo?: {
    creationCarryover: number;
    savingCarryover: number;
    expiresAt: string;
  };
}

/**
 * POST /api/admin/upgrade-tier
 * Upgrade a user's subscription tier (Admin only)
 *
 * Request body:
 * {
 *   "userId": "uuid",
 *   "newTier": "navigator" | "voyager" | etc.
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse<UpgradeTierResponse>> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      logger.warn('admin.upgrade-tier.unauthorized', 'Unauthorized access attempt', {
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminUserId = session.user.id;
    const supabase = await getSupabaseServerClient();

    // Check if user has admin or developer role
    const { data: adminProfile, error: adminCheckError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', adminUserId)
      .single();

    if (adminCheckError || !adminProfile) {
      logger.error('admin.upgrade-tier.admin_check_failed', 'Failed to verify admin status', {
        adminUserId,
        error: adminCheckError?.message,
      });

      return NextResponse.json(
        { success: false, error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    if (adminProfile.user_role !== 'admin' && adminProfile.user_role !== 'developer') {
      logger.warn('admin.upgrade-tier.forbidden', 'Non-admin user attempted tier upgrade', {
        adminUserId,
        role: adminProfile.user_role,
      });

      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const parseResult = UpgradeTierSchema.safeParse(body);

    if (!parseResult.success) {
      logger.warn('admin.upgrade-tier.invalid_request', 'Invalid request body', {
        adminUserId,
        errors: parseResult.error.flatten(),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: userId and newTier are required',
        },
        { status: 400 }
      );
    }

    const { userId, newTier } = parseResult.data;

    logger.info('admin.upgrade-tier.request_received', 'Tier upgrade request received', {
      adminUserId,
      targetUserId: userId,
      newTier,
    });

    // Get current user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, blueprint_creation_count, blueprint_saving_count')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      logger.error('admin.upgrade-tier.user_not_found', 'Target user not found', {
        adminUserId,
        targetUserId: userId,
        error: profileError?.message,
      });

      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const oldTier = userProfile.subscription_tier;

    // If no tier change, return early
    if (oldTier === newTier) {
      logger.info('admin.upgrade-tier.no_change', 'Tier unchanged', {
        adminUserId,
        targetUserId: userId,
        tier: newTier,
      });

      return NextResponse.json({
        success: true,
        message: `User is already on ${newTier} tier`,
      });
    }

    // Handle tier upgrade using the database function
    try {
      await BlueprintUsageService.handleTierUpgrade(supabase, userId, newTier);
    } catch (error) {
      logger.error('admin.upgrade-tier.upgrade_failed', 'Tier upgrade failed', {
        adminUserId,
        targetUserId: userId,
        oldTier,
        newTier,
        error: (error as Error).message,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upgrade tier',
        },
        { status: 500 }
      );
    }

    // Get updated profile to check for carryover
    const { data: updatedProfile, error: updatedProfileError } = await supabase
      .from('user_profiles')
      .select(
        'subscription_tier, upgraded_from_free_tier, free_tier_carryover_expires_at, free_tier_carryover_data'
      )
      .eq('user_id', userId)
      .single();

    if (updatedProfileError) {
      logger.error(
        'admin.upgrade-tier.fetch_updated_profile_failed',
        'Failed to fetch updated profile',
        {
          adminUserId,
          targetUserId: userId,
          error: updatedProfileError.message,
        }
      );
      // Don't fail the whole request, just log the error
    }

    let carryoverInfo;
    if (
      oldTier === 'free' &&
      newTier !== 'free' &&
      updatedProfile?.upgraded_from_free_tier &&
      updatedProfile?.free_tier_carryover_data
    ) {
      const carryoverData = updatedProfile.free_tier_carryover_data as Record<string, unknown>;
      carryoverInfo = {
        creationCarryover: (carryoverData.creation_carryover as number) || 0,
        savingCarryover: (carryoverData.saving_carryover as number) || 0,
        expiresAt: updatedProfile.free_tier_carryover_expires_at || '',
      };
    }

    logger.info('admin.upgrade-tier.success', 'Tier upgrade successful', {
      adminUserId,
      targetUserId: userId,
      oldTier,
      newTier,
      carryoverApplied: !!carryoverInfo,
    });

    const message =
      oldTier === 'free' && newTier !== 'free'
        ? `Successfully upgraded from ${oldTier} to ${newTier} tier. Free tier limits have been carried over for 12 months.`
        : `Successfully changed tier from ${oldTier} to ${newTier}`;

    return NextResponse.json({
      success: true,
      message,
      carryoverInfo,
    });
  } catch (error) {
    logger.error('admin.upgrade-tier.unexpected_error', 'Unexpected error during tier upgrade', {
      error: (error as Error).message,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
