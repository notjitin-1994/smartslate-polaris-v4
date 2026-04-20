import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API: Backfill Activity Logs
 * POST /api/admin/backfill-activity-logs
 *
 * Creates activity log entries for existing users who were created before the logging system.
 * This should be run once after deploying the activity logging system.
 *
 * Creates:
 * - user_created logs for all users
 * - user_updated logs for users with profile updates
 * - blueprint_created logs for existing blueprints
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = getSupabaseAdminClient();

    // Track results
    const results = {
      user_created: 0,
      user_updated: 0,
      blueprint_created: 0,
      errors: [] as string[],
    };

    // ========================================================================
    // 1. Backfill user_created logs
    // ========================================================================

    try {
      const { data: usersWithoutLogs, error: fetchError } = await supabase.rpc(
        'backfill_user_created_logs'
      );

      if (fetchError) {
        console.error('Error calling backfill_user_created_logs:', fetchError);
        results.errors.push(`User created logs: ${fetchError.message}`);
      } else {
        results.user_created = usersWithoutLogs || 0;
      }
    } catch (error) {
      console.error('Exception in user_created backfill:', error);
      results.errors.push(
        `User created logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // ========================================================================
    // 2. Backfill user_updated logs
    // ========================================================================

    try {
      const { data: updatedProfiles, error: updateError } = await supabase.rpc(
        'backfill_user_updated_logs'
      );

      if (updateError) {
        console.error('Error calling backfill_user_updated_logs:', updateError);
        results.errors.push(`User updated logs: ${updateError.message}`);
      } else {
        results.user_updated = updatedProfiles || 0;
      }
    } catch (error) {
      console.error('Exception in user_updated backfill:', error);
      results.errors.push(
        `User updated logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // ========================================================================
    // 3. Backfill blueprint_created logs
    // ========================================================================

    try {
      const { data: blueprints, error: blueprintError } = await supabase.rpc(
        'backfill_blueprint_created_logs'
      );

      if (blueprintError) {
        console.error('Error calling backfill_blueprint_created_logs:', blueprintError);
        results.errors.push(`Blueprint created logs: ${blueprintError.message}`);
      } else {
        results.blueprint_created = blueprints || 0;
      }
    } catch (error) {
      console.error('Exception in blueprint_created backfill:', error);
      results.errors.push(
        `Blueprint created logs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // ========================================================================
    // Return results
    // ========================================================================

    const totalBackfilled = results.user_created + results.user_updated + results.blueprint_created;

    if (results.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Backfill completed with errors',
          results,
          total: totalBackfilled,
        },
        { status: 207 } // 207 Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully backfilled ${totalBackfilled} activity log entries`,
      results,
      total: totalBackfilled,
    });
  } catch (error) {
    console.error('Backfill activity logs API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to backfill activity logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * Admin API: Get Backfill Status
 * GET /api/admin/backfill-activity-logs
 *
 * Returns statistics about activity logs and identifies users/resources without logs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = getSupabaseAdminClient();

    // Get counts
    const { count: totalLogs } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true });

    const { count: backfilledLogs } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('metadata->>backfilled', 'true');

    // Get users without logs
    const { data: usersWithoutLogs } = await supabase.rpc('get_users_without_activity_logs');

    // Get blueprints without logs
    const { data: blueprintsWithoutLogs } = await supabase.rpc(
      'get_blueprints_without_activity_logs'
    );

    return NextResponse.json({
      success: true,
      stats: {
        total_logs: totalLogs || 0,
        backfilled_logs: backfilledLogs || 0,
        users_without_logs: usersWithoutLogs?.length || 0,
        blueprints_without_logs: blueprintsWithoutLogs?.length || 0,
      },
      needs_backfill:
        (usersWithoutLogs?.length || 0) > 0 || (blueprintsWithoutLogs?.length || 0) > 0,
    });
  } catch (error) {
    console.error('Get backfill status API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get backfill status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
