import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { PlatformAnalytics } from '@/types/analytics';

/**
 * Admin API: Get platform-wide analytics
 * GET /api/analytics/platform
 *
 * Query Parameters:
 * - start_date: Start date for analytics (ISO string, default: 30 days ago)
 * - end_date: End date for analytics (ISO string, default: now)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    // Parse date range
    const searchParams = request.nextUrl.searchParams;
    const startDate =
      searchParams.get('start_date') ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('end_date') || new Date().toISOString();

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc('get_platform_analytics', {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      console.error('Failed to fetch platform analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as PlatformAnalytics);
  } catch (error) {
    console.error('Platform analytics API error:', error);

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: 'You do not have permission to view platform analytics',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
