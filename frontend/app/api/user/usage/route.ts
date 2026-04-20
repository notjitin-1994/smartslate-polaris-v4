/**
 * User Usage API Endpoint
 * Returns the user's current blueprint usage and limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { BlueprintUsageService } from '@/lib/services/blueprintUsageService';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

export const dynamic = 'force-dynamic';

export interface UserUsageResponse {
  success: boolean;
  usage?: {
    creationCount: number;
    savingCount: number;
    creationLimit: number;
    savingLimit: number;
    creationRemaining: number;
    savingRemaining: number;
    isExempt: boolean;
    exemptionReason?: string;
    subscriptionTier: string;
  };
  error?: string;
}

/**
 * GET /api/user/usage
 * Get current blueprint usage and limits for the authenticated user
 */
export async function GET(req: NextRequest): Promise<NextResponse<UserUsageResponse>> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      logger.warn('user.usage.unauthorized', 'Unauthorized', {
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    logger.info('user.usage.request_received', 'Request received', {
      userId,
    });

    const supabase = await getSupabaseServerClient();

    // Get blueprint usage information
    logger.info('user.usage.fetching', 'Fetching usage info from database', { userId });
    console.log(
      '[API /user/usage] About to call BlueprintUsageService.getBlueprintUsageInfo for user:',
      userId
    );

    const usageInfo = await BlueprintUsageService.getBlueprintUsageInfo(supabase, userId);

    console.log(
      '[API /user/usage] Raw usage data from service:',
      JSON.stringify(usageInfo, null, 2)
    );

    logger.info('user.usage.raw_data', 'Raw usage data from service', {
      userId,
      usageInfo,
    });

    // Get user profile for subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      logger.error('user.usage.profile_error', 'Failed to fetch user profile', {
        userId,
        error: profileError.message,
      });
    }

    const subscriptionTier = profile?.subscription_tier || 'free';

    logger.info('user.usage.success', 'Usage info retrieved successfully', {
      userId,
      creationCount: usageInfo.creationCount,
      savingCount: usageInfo.savingCount,
      creationLimit: usageInfo.creationLimit,
      savingLimit: usageInfo.savingLimit,
      subscriptionTier,
    });

    return NextResponse.json({
      success: true,
      usage: {
        creationCount: usageInfo.creationCount,
        savingCount: usageInfo.savingCount,
        creationLimit: usageInfo.creationLimit,
        savingLimit: usageInfo.savingLimit,
        creationRemaining: Math.max(0, usageInfo.creationLimit - usageInfo.creationCount),
        savingRemaining: Math.max(0, usageInfo.savingLimit - usageInfo.savingCount),
        isExempt: usageInfo.isExempt,
        exemptionReason: usageInfo.exemptionReason,
        subscriptionTier,
      },
    });
  } catch (error) {
    logger.error('user.usage.unexpected_error', 'Unexpected error during usage retrieval', {
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
