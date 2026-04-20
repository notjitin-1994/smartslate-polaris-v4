import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all reports in date range
    const { data: reports, error: reportsError } = await supabase
      .from('admin_reports')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (reportsError) {
      console.error('Error fetching reports for stats:', reportsError);
      return NextResponse.json(
        { error: 'Failed to fetch report statistics', details: reportsError.message },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalReports = reports?.length || 0;
    const completedReports = reports?.filter((r) => r.status === 'completed').length || 0;
    const failedReports = reports?.filter((r) => r.status === 'failed').length || 0;
    const pendingReports = reports?.filter((r) => r.status === 'pending').length || 0;
    const processingReports = reports?.filter((r) => r.status === 'processing').length || 0;

    // Group by type
    const reportsByType =
      reports?.reduce(
        (acc: any, report: any) => {
          acc[report.type] = (acc[report.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    // Calculate average generation time (only for completed reports)
    const completedReportsWithTime =
      reports?.filter((r) => r.status === 'completed' && r.generation_time_ms) || [];

    const avgGenerationTime =
      completedReportsWithTime.length > 0
        ? completedReportsWithTime.reduce((sum, r) => sum + r.generation_time_ms, 0) /
          completedReportsWithTime.length
        : 0;

    // Calculate success rate
    const totalAttempted = completedReports + failedReports;
    const successRate =
      totalAttempted > 0 ? ((completedReports / totalAttempted) * 100).toFixed(2) : '0';

    // Get report stats by date from admin_report_stats table
    const { data: dailyStats, error: statsError } = await supabase
      .from('admin_report_stats')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (statsError) {
      console.error('Error fetching daily stats:', statsError);
    }

    // Get most active generators
    const reportsByUser =
      reports?.reduce(
        (acc: any, report: any) => {
          acc[report.generated_by] = (acc[report.generated_by] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const topGenerators = Object.entries(reportsByUser)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => ({ userId, count }));

    // Calculate total file size
    const totalFileSize =
      reports?.reduce((sum: number, report: any) => sum + (report.file_size_bytes || 0), 0) || 0;

    return NextResponse.json({
      summary: {
        totalReports,
        completedReports,
        failedReports,
        pendingReports,
        processingReports,
        successRate: `${successRate}%`,
        avgGenerationTimeMs: Math.round(avgGenerationTime),
        totalFileSizeBytes: totalFileSize,
      },
      reportsByType,
      reportsByStatus: {
        completed: completedReports,
        failed: failedReports,
        pending: pendingReports,
        processing: processingReports,
      },
      topGenerators,
      dailyStats: dailyStats || [],
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/reports/stats:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
