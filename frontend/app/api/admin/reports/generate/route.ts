import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for report generation request
const generateReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  type: z.enum([
    'user-activity',
    'cost-analysis',
    'system-performance',
    'blueprint-generation',
    'api-usage',
    'security-audit',
  ]),
  dateRangeStart: z.string().datetime().optional(),
  dateRangeEnd: z.string().datetime().optional(),
  filters: z.record(z.any()).optional(),
  parameters: z.record(z.any()).optional(),
  exportFormats: z.array(z.enum(['pdf', 'excel', 'csv', 'json'])).optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/developer role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const allowedRoles = ['developer', 'enterprise', 'armada', 'fleet', 'crew'];
    if (!allowedRoles.includes(profile.user_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = generateReportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, type, dateRangeStart, dateRangeEnd, filters, parameters, exportFormats } =
      validationResult.data;

    // Create report record with 'pending' status
    const { data: report, error: insertError } = await supabase
      .from('admin_reports')
      .insert({
        name,
        type,
        status: 'pending',
        generated_by: user.id,
        date_range_start: dateRangeStart || null,
        date_range_end: dateRangeEnd || null,
        filters: filters || {},
        parameters: parameters || {},
        export_formats: exportFormats || ['pdf', 'excel', 'csv', 'json'],
      })
      .select()
      .single();

    if (insertError || !report) {
      console.error('Error creating report record:', insertError);
      return NextResponse.json(
        { error: 'Failed to create report', details: insertError?.message },
        { status: 500 }
      );
    }

    // Update status to 'processing'
    await supabase.from('admin_reports').update({ status: 'processing' }).eq('id', report.id);

    // Generate report data based on type
    let reportData: any = {};
    let errorMessage: string | null = null;

    try {
      switch (type) {
        case 'user-activity':
          reportData = await generateUserActivityReport(
            supabase,
            dateRangeStart,
            dateRangeEnd,
            filters
          );
          break;
        case 'cost-analysis':
          reportData = await generateCostAnalysisReport(
            supabase,
            dateRangeStart,
            dateRangeEnd,
            filters
          );
          break;
        case 'system-performance':
          reportData = await generateSystemPerformanceReport(
            supabase,
            dateRangeStart,
            dateRangeEnd,
            filters
          );
          break;
        case 'blueprint-generation':
          reportData = await generateBlueprintGenerationReport(
            supabase,
            dateRangeStart,
            dateRangeEnd,
            filters
          );
          break;
        case 'api-usage':
          reportData = await generateApiUsageReport(
            supabase,
            dateRangeStart,
            dateRangeEnd,
            filters
          );
          break;
        case 'security-audit':
          reportData = await generateSecurityAuditReport(
            supabase,
            dateRangeStart,
            dateRangeEnd,
            filters
          );
          break;
      }
    } catch (error) {
      console.error(`Error generating ${type} report:`, error);
      errorMessage =
        error instanceof Error ? error.message : 'Unknown error during report generation';
      reportData = { error: errorMessage };
    }

    // Calculate generation time
    const generationTime = Date.now() - startTime;

    // Update report with generated data
    const updatePayload: any = {
      status: errorMessage ? 'failed' : 'completed',
      generated_at: new Date().toISOString(),
      data: reportData,
      generation_time_ms: generationTime,
      error_message: errorMessage,
    };

    const { data: updatedReport, error: updateError } = await supabase
      .from('admin_reports')
      .update(updatePayload)
      .eq('id', report.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json(
        { error: 'Report generated but failed to save', details: updateError.message },
        { status: 500 }
      );
    }

    // Update statistics
    await supabase.rpc('update_report_statistics');

    return NextResponse.json({
      report: updatedReport,
      message: errorMessage ? 'Report generation failed' : 'Report generated successfully',
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/reports/generate:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to generate user activity report
async function generateUserActivityReport(
  supabase: any,
  dateRangeStart?: string,
  dateRangeEnd?: string,
  filters?: Record<string, any>
) {
  // Get user statistics
  let userQuery = supabase.from('user_profiles').select('*', { count: 'exact' });

  if (dateRangeStart) {
    userQuery = userQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    userQuery = userQuery.lte('created_at', dateRangeEnd);
  }

  const { data: users, count: totalUsers } = await userQuery;

  // Get blueprint statistics
  let blueprintQuery = supabase.from('blueprint_generator').select('*', { count: 'exact' });

  if (dateRangeStart) {
    blueprintQuery = blueprintQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    blueprintQuery = blueprintQuery.lte('created_at', dateRangeEnd);
  }

  const { data: blueprints, count: totalBlueprints } = await blueprintQuery;

  // Calculate active users (users with at least one blueprint)
  const activeUsers =
    users?.filter((user: any) => blueprints?.some((bp: any) => bp.user_id === user.id)).length || 0;

  // Group by tier
  const usersByTier =
    users?.reduce(
      (acc: any, user: any) => {
        acc[user.subscription_tier] = (acc[user.subscription_tier] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Group blueprints by status
  const blueprintsByStatus =
    blueprints?.reduce(
      (acc: any, bp: any) => {
        acc[bp.status] = (acc[bp.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  return {
    summary: {
      totalUsers: totalUsers || 0,
      activeUsers,
      totalBlueprints: totalBlueprints || 0,
      averageBlueprintsPerUser: totalUsers ? ((totalBlueprints || 0) / totalUsers).toFixed(2) : '0',
    },
    usersByTier,
    blueprintsByStatus,
    dateRange: {
      start: dateRangeStart || null,
      end: dateRangeEnd || null,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate cost analysis report
async function generateCostAnalysisReport(
  supabase: any,
  dateRangeStart?: string,
  dateRangeEnd?: string,
  filters?: Record<string, any>
) {
  // Get API usage logs data
  let costQuery = supabase.from('api_usage_logs').select('*');

  if (dateRangeStart) {
    costQuery = costQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    costQuery = costQuery.lte('created_at', dateRangeEnd);
  }

  const { data: costs } = await costQuery;

  // Calculate total costs (convert cents to dollars by dividing by 100)
  const totalInputCostCents =
    costs?.reduce((sum: number, cost: any) => sum + (cost.input_cost_cents || 0), 0) || 0;
  const totalOutputCostCents =
    costs?.reduce((sum: number, cost: any) => sum + (cost.output_cost_cents || 0), 0) || 0;
  const totalCostCents = totalInputCostCents + totalOutputCostCents;

  const totalInputCost = totalInputCostCents / 100;
  const totalOutputCost = totalOutputCostCents / 100;
  const totalCost = totalCostCents / 100;

  // Group by provider (using correct column name: api_provider)
  const costsByProvider =
    costs?.reduce(
      (acc: any, cost: any) => {
        const provider = cost.api_provider;
        if (!acc[provider]) {
          acc[provider] = { inputCost: 0, outputCost: 0, totalCost: 0, count: 0 };
        }
        acc[provider].inputCost += (cost.input_cost_cents || 0) / 100;
        acc[provider].outputCost += (cost.output_cost_cents || 0) / 100;
        acc[provider].totalCost += (cost.total_cost_cents || 0) / 100;
        acc[provider].count += 1;
        return acc;
      },
      {} as Record<string, any>
    ) || {};

  // Group by model (using correct column name: model_id)
  const costsByModel =
    costs?.reduce(
      (acc: any, cost: any) => {
        const model = cost.model_id;
        if (!acc[model]) {
          acc[model] = { inputCost: 0, outputCost: 0, totalCost: 0, count: 0 };
        }
        acc[model].inputCost += (cost.input_cost_cents || 0) / 100;
        acc[model].outputCost += (cost.output_cost_cents || 0) / 100;
        acc[model].totalCost += (cost.total_cost_cents || 0) / 100;
        acc[model].count += 1;
        return acc;
      },
      {} as Record<string, any>
    ) || {};

  return {
    summary: {
      totalInputCost: `$${totalInputCost.toFixed(4)}`,
      totalOutputCost: `$${totalOutputCost.toFixed(4)}`,
      totalCost: `$${totalCost.toFixed(4)}`,
      totalRequests: costs?.length || 0,
      averageCostPerRequest: costs?.length
        ? `$${(totalCost / costs.length).toFixed(4)}`
        : '$0.0000',
    },
    costsByProvider,
    costsByModel,
    dateRange: {
      start: dateRangeStart || null,
      end: dateRangeEnd || null,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate system performance report
async function generateSystemPerformanceReport(
  supabase: any,
  dateRangeStart?: string,
  dateRangeEnd?: string,
  filters?: Record<string, any>
) {
  // Get API usage logs for performance metrics
  let performanceQuery = supabase.from('api_usage_logs').select('*');

  if (dateRangeStart) {
    performanceQuery = performanceQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    performanceQuery = performanceQuery.lte('created_at', dateRangeEnd);
  }

  const { data: apiCalls } = await performanceQuery;

  // Calculate response times from actual request_duration_ms data
  const totalCalls = apiCalls?.length || 0;
  const callsWithDuration = apiCalls?.filter((call: any) => call.request_duration_ms != null) || [];
  const avgResponseTime =
    callsWithDuration.length > 0
      ? Math.round(
          callsWithDuration.reduce((sum: number, call: any) => sum + call.request_duration_ms, 0) /
            callsWithDuration.length
        )
      : 0;

  // Get blueprint generation statistics
  let blueprintQuery = supabase.from('blueprint_generator').select('status', { count: 'exact' });

  if (dateRangeStart) {
    blueprintQuery = blueprintQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    blueprintQuery = blueprintQuery.lte('created_at', dateRangeEnd);
  }

  const { data: blueprints, count: totalBlueprints } = await blueprintQuery;

  const completedBlueprints =
    blueprints?.filter((bp: any) => bp.status === 'completed').length || 0;
  const failedBlueprints = blueprints?.filter((bp: any) => bp.status === 'error').length || 0;
  const successRate = totalBlueprints
    ? ((completedBlueprints / totalBlueprints) * 100).toFixed(2)
    : '0';

  return {
    summary: {
      totalApiCalls: totalCalls,
      averageResponseTime: avgResponseTime,
      totalBlueprints: totalBlueprints || 0,
      successRate: `${successRate}%`,
    },
    blueprintStats: {
      completed: completedBlueprints,
      failed: failedBlueprints,
      inProgress: blueprints?.filter((bp: any) => bp.status === 'generating').length || 0,
    },
    dateRange: {
      start: dateRangeStart || null,
      end: dateRangeEnd || null,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate blueprint generation report
async function generateBlueprintGenerationReport(
  supabase: any,
  dateRangeStart?: string,
  dateRangeEnd?: string,
  filters?: Record<string, any>
) {
  // Get blueprint statistics
  let blueprintQuery = supabase.from('blueprint_generator').select('*', { count: 'exact' });

  if (dateRangeStart) {
    blueprintQuery = blueprintQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    blueprintQuery = blueprintQuery.lte('created_at', dateRangeEnd);
  }

  const { data: blueprints, count: totalBlueprints } = await blueprintQuery;

  // Group by status
  const blueprintsByStatus =
    blueprints?.reduce(
      (acc: any, bp: any) => {
        acc[bp.status] = (acc[bp.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Group by user
  const blueprintsByUser =
    blueprints?.reduce(
      (acc: any, bp: any) => {
        acc[bp.user_id] = (acc[bp.user_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  const topUsers = Object.entries(blueprintsByUser)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10);

  return {
    summary: {
      totalBlueprints: totalBlueprints || 0,
      completed: blueprintsByStatus.completed || 0,
      failed: blueprintsByStatus.error || 0,
      inProgress: blueprintsByStatus.generating || 0,
      draft: blueprintsByStatus.draft || 0,
    },
    blueprintsByStatus,
    topUsers: topUsers.map(([userId, count]) => ({ userId, count })),
    dateRange: {
      start: dateRangeStart || null,
      end: dateRangeEnd || null,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate API usage report
async function generateApiUsageReport(
  supabase: any,
  dateRangeStart?: string,
  dateRangeEnd?: string,
  filters?: Record<string, any>
) {
  // Get API usage logs data
  let apiQuery = supabase.from('api_usage_logs').select('*');

  if (dateRangeStart) {
    apiQuery = apiQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    apiQuery = apiQuery.lte('created_at', dateRangeEnd);
  }

  const { data: apiCalls } = await apiQuery;

  // Group by provider (using correct column name: api_provider)
  const callsByProvider =
    apiCalls?.reduce(
      (acc: any, call: any) => {
        acc[call.api_provider] = (acc[call.api_provider] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Group by model (using correct column name: model_id)
  const callsByModel =
    apiCalls?.reduce(
      (acc: any, call: any) => {
        acc[call.model_id] = (acc[call.model_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Calculate token usage
  const totalInputTokens =
    apiCalls?.reduce((sum: number, call: any) => sum + (call.input_tokens || 0), 0) || 0;
  const totalOutputTokens =
    apiCalls?.reduce((sum: number, call: any) => sum + (call.output_tokens || 0), 0) || 0;

  return {
    summary: {
      totalCalls: apiCalls?.length || 0,
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
    },
    callsByProvider,
    callsByModel,
    dateRange: {
      start: dateRangeStart || null,
      end: dateRangeEnd || null,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Helper function to generate security audit report
async function generateSecurityAuditReport(
  supabase: any,
  dateRangeStart?: string,
  dateRangeEnd?: string,
  filters?: Record<string, any>
) {
  // Get user profiles for security analysis
  let userQuery = supabase.from('user_profiles').select('*');

  if (dateRangeStart) {
    userQuery = userQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    userQuery = userQuery.lte('created_at', dateRangeEnd);
  }

  const { data: users } = await userQuery;

  // Analyze user roles
  const usersByRole =
    users?.reduce(
      (acc: any, user: any) => {
        acc[user.user_role] = (acc[user.user_role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Check for users exceeding limits (potential abuse)
  const usersExceedingLimits =
    users?.filter((user: any) => user.blueprint_creation_count > user.blueprint_creation_limit)
      .length || 0;

  // Get blueprint statistics for security analysis
  let blueprintQuery = supabase.from('blueprint_generator').select('user_id, status');

  if (dateRangeStart) {
    blueprintQuery = blueprintQuery.gte('created_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    blueprintQuery = blueprintQuery.lte('created_at', dateRangeEnd);
  }

  const { data: blueprints } = await blueprintQuery;

  // Identify users with high failure rates (potential issues)
  const userFailureRates: Record<string, { total: number; failed: number }> = {};
  blueprints?.forEach((bp: any) => {
    if (!userFailureRates[bp.user_id]) {
      userFailureRates[bp.user_id] = { total: 0, failed: 0 };
    }
    userFailureRates[bp.user_id].total += 1;
    if (bp.status === 'error') {
      userFailureRates[bp.user_id].failed += 1;
    }
  });

  const highFailureRateUsers = Object.entries(userFailureRates)
    .filter(([, stats]) => stats.total >= 5 && stats.failed / stats.total > 0.5)
    .map(([userId, stats]) => ({
      userId,
      total: stats.total,
      failed: stats.failed,
      failureRate: ((stats.failed / stats.total) * 100).toFixed(2) + '%',
    }));

  return {
    summary: {
      totalUsers: users?.length || 0,
      usersExceedingLimits,
      highFailureRateUsers: highFailureRateUsers.length,
    },
    usersByRole,
    securityConcerns: {
      usersExceedingLimits,
      highFailureRateUsers,
    },
    dateRange: {
      start: dateRangeStart || null,
      end: dateRangeEnd || null,
    },
    generatedAt: new Date().toISOString(),
  };
}
