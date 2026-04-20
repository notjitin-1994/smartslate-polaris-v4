/**
 * Admin API route for fetching cost data
 * GET /api/admin/costs - Get all users cost overview
 * GET /api/admin/costs?userId=xxx - Get specific user cost details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { costTrackingService } from '@/lib/services/costTrackingService';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('admin-costs-api');

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Check if user is admin or developer
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile || !['admin', 'developer'].includes(profile.user_role)) {
      logger.warn('admin.costs.unauthorized', 'Non-admin tried to access costs', {
        userId: session.user.id,
        role: profile?.user_role,
      });
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // If specific user requested
    if (userId) {
      logger.info('admin.costs.user-details', 'Fetching user cost details', {
        adminId: session.user.id,
        targetUserId: userId,
        fromDate,
        toDate,
      });

      const userCosts = await costTrackingService.getUserCostSummary(
        userId,
        fromDate ? new Date(fromDate) : undefined,
        toDate ? new Date(toDate) : undefined,
        supabase
      );

      const apiLogs = await costTrackingService.getUserApiLogs(
        userId,
        fromDate ? new Date(fromDate) : undefined,
        toDate ? new Date(toDate) : undefined,
        supabase
      );

      // Get user profile info
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email, first_name, last_name, subscription_tier, user_role')
        .eq('user_id', userId)
        .single();

      return NextResponse.json({
        user: {
          id: userId,
          ...userProfile,
        },
        summary: userCosts,
        logs: apiLogs,
      });
    }

    // Otherwise, get all users overview
    logger.info('admin.costs.overview', 'Fetching all users cost overview', {
      adminId: session.user.id,
    });

    const allUsersCosts = await costTrackingService.getAllUsersCostOverview(supabase);

    // Calculate totals
    const totals = allUsersCosts.reduce(
      (acc, user) => ({
        todayTotalCents: acc.todayTotalCents + user.todayCostCents,
        monthTotalCents: acc.monthTotalCents + user.thisMonthCostCents,
        todayTotalCalls: acc.todayTotalCalls + user.todayApiCalls,
        monthTotalCalls: acc.monthTotalCalls + user.thisMonthApiCalls,
      }),
      {
        todayTotalCents: 0,
        monthTotalCents: 0,
        todayTotalCalls: 0,
        monthTotalCalls: 0,
      }
    );

    return NextResponse.json({
      users: allUsersCosts,
      totals,
    });
  } catch (error) {
    logger.error('admin.costs.error', 'Error fetching costs data', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Update model pricing (admin only)
 * POST /api/admin/costs/pricing
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseServerClient();

    // Check if user is admin or developer
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile || !['admin', 'developer'].includes(profile.user_role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { provider, modelId, inputCostPerMillion, outputCostPerMillion, description } = body;

    if (
      !provider ||
      !modelId ||
      inputCostPerMillion === undefined ||
      outputCostPerMillion === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: provider, modelId, inputCostPerMillion, outputCostPerMillion',
        },
        { status: 400 }
      );
    }

    logger.info('admin.costs.update-pricing', 'Updating model pricing', {
      adminId: session.user.id,
      provider,
      modelId,
      inputCost: inputCostPerMillion,
      outputCost: outputCostPerMillion,
    });

    const success = await costTrackingService.updateModelPricing(
      provider,
      modelId,
      inputCostPerMillion,
      outputCostPerMillion,
      description,
      supabase
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to update model pricing' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('admin.costs.pricing.error', 'Error updating model pricing', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
