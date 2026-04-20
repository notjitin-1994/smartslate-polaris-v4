/**
 * Admin API route for specific user cost details
 * GET /api/admin/costs/[userId] - Get detailed cost breakdown for a specific user
 * GET /api/admin/costs/[userId]/blueprints - Get cost breakdown by blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('admin-user-costs-api');

export async function GET(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;

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
      logger.warn('admin.user-costs.unauthorized', 'Non-admin tried to access user costs', {
        adminId: session.user.id,
        role: profile?.user_role,
        targetUserId: userId,
      });
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const groupBy = searchParams.get('groupBy') || 'day'; // day, blueprint, model

    logger.info('admin.user-costs.fetch', 'Fetching detailed user costs', {
      adminId: session.user.id,
      targetUserId: userId,
      fromDate,
      toDate,
      groupBy,
    });

    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query based on grouping
    let query = supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      logger.error('admin.user-costs.query-error', 'Failed to fetch user costs', {
        error: logsError.message,
        userId,
      });
      return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 });
    }

    // Group data based on request
    let groupedData: any = {};

    if (groupBy === 'blueprint') {
      // Group by blueprint ID
      groupedData = logs?.reduce((acc: any, log: any) => {
        const key = log.blueprint_id || 'no-blueprint';
        if (!acc[key]) {
          acc[key] = {
            blueprintId: log.blueprint_id,
            totalCostCents: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            apiCalls: 0,
            logs: [],
          };
        }
        acc[key].totalCostCents += log.total_cost_cents || 0;
        acc[key].totalInputTokens += log.input_tokens || 0;
        acc[key].totalOutputTokens += log.output_tokens || 0;
        acc[key].apiCalls += 1;
        acc[key].logs.push(log);
        return acc;
      }, {});

      // Get blueprint details
      if (Object.keys(groupedData).length > 0) {
        const blueprintIds = Object.keys(groupedData).filter((id) => id !== 'no-blueprint');
        const { data: blueprints } = await supabase
          .from('blueprint_generator')
          .select('id, created_at, status')
          .in('id', blueprintIds);

        blueprints?.forEach((blueprint: any) => {
          if (groupedData[blueprint.id]) {
            groupedData[blueprint.id].blueprintDetails = blueprint;
          }
        });
      }
    } else if (groupBy === 'model') {
      // Group by model
      groupedData = logs?.reduce((acc: any, log: any) => {
        const key = log.model_id;
        if (!acc[key]) {
          acc[key] = {
            modelId: log.model_id,
            provider: log.api_provider,
            totalCostCents: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            apiCalls: 0,
          };
        }
        acc[key].totalCostCents += log.total_cost_cents || 0;
        acc[key].totalInputTokens += log.input_tokens || 0;
        acc[key].totalOutputTokens += log.output_tokens || 0;
        acc[key].apiCalls += 1;
        return acc;
      }, {});
    } else {
      // Group by day
      groupedData = logs?.reduce((acc: any, log: any) => {
        const key = new Date(log.created_at).toISOString().split('T')[0];
        if (!acc[key]) {
          acc[key] = {
            date: key,
            totalCostCents: 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            apiCalls: 0,
            byEndpoint: {},
          };
        }
        acc[key].totalCostCents += log.total_cost_cents || 0;
        acc[key].totalInputTokens += log.input_tokens || 0;
        acc[key].totalOutputTokens += log.output_tokens || 0;
        acc[key].apiCalls += 1;

        // Group by endpoint within each day
        if (!acc[key].byEndpoint[log.endpoint]) {
          acc[key].byEndpoint[log.endpoint] = {
            costCents: 0,
            calls: 0,
          };
        }
        acc[key].byEndpoint[log.endpoint].costCents += log.total_cost_cents || 0;
        acc[key].byEndpoint[log.endpoint].calls += 1;

        return acc;
      }, {});
    }

    // Calculate totals
    const totals = logs?.reduce(
      (acc: any, log: any) => ({
        totalCostCents: acc.totalCostCents + (log.total_cost_cents || 0),
        totalInputTokens: acc.totalInputTokens + (log.input_tokens || 0),
        totalOutputTokens: acc.totalOutputTokens + (log.output_tokens || 0),
        totalApiCalls: acc.totalApiCalls + 1,
      }),
      {
        totalCostCents: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalApiCalls: 0,
      }
    );

    return NextResponse.json({
      user: userProfile,
      totals,
      groupedData,
      groupBy,
      dateRange: {
        from: fromDate || logs?.[logs.length - 1]?.created_at,
        to: toDate || logs?.[0]?.created_at,
      },
      rawLogsCount: logs?.length || 0,
    });
  } catch (error) {
    logger.error('admin.user-costs.error', 'Error fetching user costs', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
