import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/utils/activityLogger';

/**
 * Debug endpoint to check and populate activity logs
 * GET /api/admin/debug/activity-logs - Check database
 * POST /api/admin/debug/activity-logs - Create test logs
 */
export async function GET() {
  try {
    await requireAdmin();

    const supabase = getSupabaseAdminClient();

    // Check if table exists and get count
    const {
      data: activities,
      error,
      count,
    } = await supabase.from('activity_logs').select('*', { count: 'exact', head: false }).limit(10);

    if (error) {
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message,
        code: error.code,
      });
    }

    return NextResponse.json({
      success: true,
      count,
      sampleActivities: activities,
      message: `Found ${count || 0} activity logs in database`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check activity logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const adminUser = await requireAdmin();

    // Get first user from database as test target
    const supabase = getSupabaseAdminClient();
    const { data: users } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(1)
      .single();

    if (!users) {
      return NextResponse.json(
        {
          error: 'No users found in database',
        },
        { status: 404 }
      );
    }

    const testUserId = users.user_id;

    // Create test activity logs
    const logs = [
      {
        userId: testUserId,
        actorId: adminUser.id,
        actionType: 'user_created' as const,
        resourceType: 'user' as const,
        resourceId: testUserId,
        metadata: { source: 'debug_endpoint', timestamp: new Date().toISOString() },
      },
      {
        userId: testUserId,
        actorId: adminUser.id,
        actionType: 'user_updated' as const,
        resourceType: 'user' as const,
        resourceId: testUserId,
        metadata: {
          changes: {
            role: { before: 'explorer', after: 'navigator' },
          },
          source: 'debug_endpoint',
        },
      },
      {
        userId: testUserId,
        actorId: adminUser.id,
        actionType: 'user_login' as const,
        resourceType: 'user' as const,
        resourceId: testUserId,
        metadata: { source: 'debug_endpoint' },
      },
    ];

    const results = await Promise.all(logs.map((log) => logActivity(log)));

    const successCount = results.filter((r) => r).length;

    return NextResponse.json({
      success: true,
      message: `Created ${successCount}/${logs.length} test activity logs`,
      testUserId,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create test logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
