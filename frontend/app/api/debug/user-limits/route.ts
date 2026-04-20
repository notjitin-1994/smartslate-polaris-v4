/**
 * Debug API Endpoint: User Limits
 * Shows comprehensive usage data for debugging counting issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = await getSupabaseServerClient();

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Profile not found', details: profileError },
        { status: 404 }
      );
    }

    // Get all blueprints for this user
    const { data: blueprints, error: blueprintsError } = await supabase
      .from('blueprint_generator')
      .select('id, status, created_at, blueprint_json')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (blueprintsError) {
      return NextResponse.json(
        { error: 'Failed to fetch blueprints', details: blueprintsError },
        { status: 500 }
      );
    }

    // Count actual blueprints
    const totalBlueprints = blueprints?.length || 0;
    const completedBlueprints =
      blueprints?.filter((b) => b.status === 'completed' && b.blueprint_json).length || 0;
    const draftBlueprints = blueprints?.filter((b) => b.status === 'draft').length || 0;
    const generatingBlueprints = blueprints?.filter((b) => b.status === 'generating').length || 0;
    const errorBlueprints = blueprints?.filter((b) => b.status === 'error').length || 0;

    // Call RPC functions to get calculated counts
    const { data: actualCreationCount } = await supabase.rpc(
      'get_actual_blueprint_creation_count',
      {
        p_user_id: userId,
      }
    );

    const { data: actualSavingCount } = await supabase.rpc('get_actual_blueprint_saving_count', {
      p_user_id: userId,
    });

    const { data: effectiveLimits } = await supabase.rpc('get_effective_limits', {
      p_user_id: userId,
    });

    const { data: canCreate } = await supabase.rpc('check_blueprint_creation_limits', {
      p_user_id: userId,
    });

    const { data: canSave } = await supabase.rpc('check_blueprint_saving_limits', {
      p_user_id: userId,
    });

    // Format response
    return NextResponse.json({
      userId,
      timestamp: new Date().toISOString(),
      profile: {
        subscription_tier: profile.subscription_tier,
        user_role: profile.user_role,
        blueprint_creation_count: profile.blueprint_creation_count,
        blueprint_saving_count: profile.blueprint_saving_count,
        blueprint_creation_limit: profile.blueprint_creation_limit,
        blueprint_saving_limit: profile.blueprint_saving_limit,
        billing_cycle_start_date: profile.billing_cycle_start_date,
      },
      actualCounts: {
        totalBlueprints,
        completedBlueprints,
        draftBlueprints,
        generatingBlueprints,
        errorBlueprints,
        rpcCreationCount: actualCreationCount,
        rpcSavingCount: actualSavingCount,
      },
      effectiveLimits: effectiveLimits?.[0] || null,
      checks: {
        canCreate: canCreate?.[0] || null,
        canSave: canSave?.[0] || null,
      },
      blueprintsList: blueprints?.map((b) => ({
        id: b.id,
        status: b.status,
        created_at: b.created_at,
        has_blueprint_json: !!b.blueprint_json,
      })),
      discrepancies: {
        creation_count_mismatch: profile.blueprint_creation_count !== actualCreationCount,
        saving_count_mismatch: profile.blueprint_saving_count !== actualSavingCount,
        stored_vs_actual_creation: `${profile.blueprint_creation_count} vs ${actualCreationCount}`,
        stored_vs_actual_saving: `${profile.blueprint_saving_count} vs ${actualSavingCount}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
