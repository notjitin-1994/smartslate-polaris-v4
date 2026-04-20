import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Backfill activity logs for all existing users
 * POST /api/admin/debug/backfill-activities
 */
export async function POST() {
  try {
    await requireAdmin();

    const supabase = getSupabaseAdminClient();

    // Get all auth users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];

    console.log(`[Backfill] Found ${users.length} users to backfill`);

    // Get all user profiles
    const { data: profiles } = await supabase.from('user_profiles').select('*');

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    // Get all blueprints
    const { data: blueprints } = await supabase
      .from('blueprint_generator')
      .select('id, user_id, created_at, status');

    const blueprintsByUser = new Map<string, any[]>();
    blueprints?.forEach((bp) => {
      if (!blueprintsByUser.has(bp.user_id)) {
        blueprintsByUser.set(bp.user_id, []);
      }
      blueprintsByUser.get(bp.user_id)!.push(bp);
    });

    const activities: any[] = [];

    // Create activity logs for each user
    for (const user of users) {
      const profile = profileMap.get(user.id);
      const userBlueprints = blueprintsByUser.get(user.id) || [];

      // 1. User creation/signup activity
      activities.push({
        user_id: user.id,
        actor_id: user.id, // Self-action
        action_type: 'user_created',
        resource_type: 'user',
        resource_id: user.id,
        metadata: {
          email: user.email,
          source: 'backfill',
          provider: user.app_metadata?.provider || 'email',
        },
        ip_address: null,
        user_agent: null,
        created_at: user.created_at,
      });

      // 2. Blueprint creation activities
      for (const blueprint of userBlueprints) {
        activities.push({
          user_id: user.id,
          actor_id: user.id,
          action_type: 'blueprint_created',
          resource_type: 'blueprint',
          resource_id: blueprint.id,
          metadata: {
            status: blueprint.status,
            source: 'backfill',
          },
          ip_address: null,
          user_agent: null,
          created_at: blueprint.created_at,
        });
      }

      // 3. Profile update activity (if profile exists and was updated after creation)
      if (profile && profile.updated_at && profile.created_at !== profile.updated_at) {
        activities.push({
          user_id: user.id,
          actor_id: user.id,
          action_type: 'user_updated',
          resource_type: 'user',
          resource_id: user.id,
          metadata: {
            full_name: profile.full_name,
            role: profile.user_role,
            tier: profile.subscription_tier,
            source: 'backfill',
          },
          ip_address: null,
          user_agent: null,
          created_at: profile.updated_at,
        });
      }
    }

    console.log(`[Backfill] Created ${activities.length} activity log entries`);

    // Insert in batches to avoid limits
    const batchSize = 100;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = activities.slice(i, i + batchSize);
      const { error } = await supabase.from('activity_logs').insert(batch);

      if (error) {
        console.error(`[Backfill] Batch ${i}-${i + batch.length} failed:`, error);
        failed += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Activity logs backfilled successfully',
      stats: {
        totalUsers: users.length,
        totalActivities: activities.length,
        inserted,
        failed,
      },
    });
  } catch (error) {
    console.error('[Backfill] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to backfill activity logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
