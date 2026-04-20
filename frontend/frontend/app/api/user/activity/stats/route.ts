import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/activity/stats
 * Returns aggregated activity statistics for the authenticated user
 *
 * Response:
 * {
 *   blueprints_created: number,
 *   blueprints_updated: number,
 *   blueprints_deleted: number,
 *   blueprints_exported: number,
 *   profile_updates: number,
 *   total_logins: number,
 *   total_sessions: number,
 *   last_login_at: string | null,
 *   total_blueprints: number,
 *   completed_blueprints: number,
 *   blueprints_last_30_days: number,
 *   member_since: string,
 *   subscription_tier: string,
 *   user_role: string,
 *   blueprint_creation_count: number,
 *   blueprint_saving_count: number,
 *   blueprint_creation_limit: number,
 *   blueprint_saving_limit: number,
 *   usage_percentage_creation: number,
 *   usage_percentage_saving: number
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call RPC function to get activity stats
    const { data: stats, error: statsError } = await supabase.rpc('get_user_activity_stats', {
      p_user_id: user.id,
    });

    if (statsError) {
      console.error('Error fetching activity stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch activity stats', details: statsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Activity stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
