/**
 * Admin API Endpoint: Fix My Counts
 * One-time fix for the current user's blueprint counts
 * This syncs the counter columns with actual database state
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = await getSupabaseServerClient();

    console.log('[FIX_COUNTS] Starting count fix for user:', userId);

    // Get current state BEFORE fix
    const { data: beforeProfile } = await supabase
      .from('user_profiles')
      .select('blueprint_creation_count, blueprint_saving_count')
      .eq('user_id', userId)
      .single();

    const { data: beforeActualCreation } = await supabase.rpc(
      'get_actual_blueprint_creation_count',
      {
        p_user_id: userId,
      }
    );

    const { data: beforeActualSaving } = await supabase.rpc('get_actual_blueprint_saving_count', {
      p_user_id: userId,
    });

    console.log('[FIX_COUNTS] Before state:', {
      storedCreation: beforeProfile?.blueprint_creation_count,
      actualCreation: beforeActualCreation,
      storedSaving: beforeProfile?.blueprint_saving_count,
      actualSaving: beforeActualSaving,
    });

    // Call sync function for this user
    const { data: syncResults, error: syncError } = await supabase.rpc('sync_blueprint_counters', {
      p_user_id: userId,
    });

    if (syncError) {
      console.error('[FIX_COUNTS] Sync error:', syncError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to sync counts',
          details: syncError.message,
        },
        { status: 500 }
      );
    }

    console.log('[FIX_COUNTS] Sync results:', syncResults);

    // Get current state AFTER fix
    const { data: afterProfile } = await supabase
      .from('user_profiles')
      .select('blueprint_creation_count, blueprint_saving_count')
      .eq('user_id', userId)
      .single();

    const { data: afterEffectiveLimits } = await supabase.rpc('get_effective_limits', {
      p_user_id: userId,
    });

    const { data: afterCanSave } = await supabase.rpc('check_blueprint_saving_limits', {
      p_user_id: userId,
    });

    console.log('[FIX_COUNTS] After state:', {
      storedCreation: afterProfile?.blueprint_creation_count,
      storedSaving: afterProfile?.blueprint_saving_count,
      canSave: afterCanSave,
    });

    const result = {
      success: true,
      message: 'Blueprint counts synchronized successfully',
      before: {
        stored: {
          creation: beforeProfile?.blueprint_creation_count,
          saving: beforeProfile?.blueprint_saving_count,
        },
        actual: {
          creation: beforeActualCreation,
          saving: beforeActualSaving,
        },
      },
      after: {
        stored: {
          creation: afterProfile?.blueprint_creation_count,
          saving: afterProfile?.blueprint_saving_count,
        },
        effectiveLimits: afterEffectiveLimits?.[0],
        canSave: afterCanSave?.[0],
      },
      syncDetails: syncResults?.[0] || null,
      wasFixed: syncResults?.[0] && !syncResults[0].counters_matched,
    };

    console.log('[FIX_COUNTS] Final result:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[FIX_COUNTS] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
