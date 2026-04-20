import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API: Diagnose and Fix User Usage Counters
 * POST /api/admin/users/fix-counters
 *
 * This endpoint:
 * 1. Diagnoses counter accuracy by comparing with actual blueprint data
 * 2. Optionally fixes mismatched counters
 * 3. Returns detailed statistics
 *
 * Body:
 * - action: 'diagnose' | 'fix'
 * - dryRun: boolean (default: true) - if false, actually updates the database
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { action = 'diagnose', dryRun = true } = body;

    const supabase = getSupabaseAdminClient();

    console.log('[Fix Counters API] Request:', { action, dryRun });

    // =============================================================================
    // STEP 1: Get all user profiles
    // =============================================================================
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, blueprint_creation_count, blueprint_saving_count, subscription_tier');

    if (profilesError) {
      console.error('[Fix Counters API] Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles', details: profilesError.message },
        { status: 500 }
      );
    }

    console.log('[Fix Counters API] Fetched profiles:', profiles?.length || 0);

    // =============================================================================
    // STEP 2: For each user, get actual counts from blueprint_generator
    // =============================================================================
    const mismatches: Array<{
      user_id: string;
      subscription_tier: string;
      current_creation_count: number;
      correct_creation_count: number;
      creation_delta: number;
      current_saving_count: number;
      correct_saving_count: number;
      saving_delta: number;
    }> = [];

    let totalUsers = profiles?.length || 0;
    let usersWithMismatches = 0;
    let creationMismatches = 0;
    let savingMismatches = 0;
    let totalCreationDelta = 0;
    let totalSavingDelta = 0;

    for (const profile of profiles || []) {
      // Count blueprints with dynamic_questions (creation events)
      const { count: creationCount, error: creationError } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .not('dynamic_questions', 'is', null)
        .is('deleted_at', null);

      if (creationError) {
        console.error(
          `[Fix Counters API] Error counting creations for user ${profile.user_id}:`,
          creationError
        );
        continue;
      }

      // Count blueprints with blueprint_json (save events)
      const { count: savingCount, error: savingError } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .not('blueprint_json', 'is', null)
        .is('deleted_at', null);

      if (savingError) {
        console.error(
          `[Fix Counters API] Error counting saves for user ${profile.user_id}:`,
          savingError
        );
        continue;
      }

      const correctCreationCount = creationCount || 0;
      const correctSavingCount = savingCount || 0;
      const creationDelta = profile.blueprint_creation_count - correctCreationCount;
      const savingDelta = profile.blueprint_saving_count - correctSavingCount;

      if (creationDelta !== 0 || savingDelta !== 0) {
        mismatches.push({
          user_id: profile.user_id,
          subscription_tier: profile.subscription_tier,
          current_creation_count: profile.blueprint_creation_count,
          correct_creation_count: correctCreationCount,
          creation_delta: creationDelta,
          current_saving_count: profile.blueprint_saving_count,
          correct_saving_count: correctSavingCount,
          saving_delta: savingDelta,
        });

        usersWithMismatches++;
        if (creationDelta !== 0) creationMismatches++;
        if (savingDelta !== 0) savingMismatches++;
        totalCreationDelta += creationDelta;
        totalSavingDelta += savingDelta;
      }
    }

    console.log('[Fix Counters API] Diagnosis complete:', {
      totalUsers,
      usersWithMismatches,
      creationMismatches,
      savingMismatches,
      totalCreationDelta,
      totalSavingDelta,
    });

    // =============================================================================
    // STEP 3: If action is 'fix' and not dryRun, update the database
    // =============================================================================
    let updatedCount = 0;

    if (action === 'fix' && !dryRun && mismatches.length > 0) {
      console.log('[Fix Counters API] Applying fixes to', mismatches.length, 'users');

      for (const mismatch of mismatches) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            blueprint_creation_count: mismatch.correct_creation_count,
            blueprint_saving_count: mismatch.correct_saving_count,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', mismatch.user_id);

        if (updateError) {
          console.error(`[Fix Counters API] Error updating user ${mismatch.user_id}:`, updateError);
        } else {
          updatedCount++;
        }
      }

      console.log('[Fix Counters API] Updated', updatedCount, 'users successfully');
    }

    // =============================================================================
    // STEP 4: Return results
    // =============================================================================
    return NextResponse.json({
      success: true,
      action,
      dryRun,
      summary: {
        totalUsers,
        usersWithMismatches,
        creationMismatches,
        savingMismatches,
        totalCreationDelta,
        totalSavingDelta,
        updatedCount: action === 'fix' && !dryRun ? updatedCount : 0,
      },
      mismatches: mismatches.slice(0, 50), // Return top 50 mismatches
      message:
        action === 'fix' && !dryRun
          ? `Successfully updated ${updatedCount} users`
          : usersWithMismatches > 0
            ? `Found ${usersWithMismatches} users with counter mismatches. Set dryRun=false to fix.`
            : 'All counters are accurate!',
    });
  } catch (error) {
    console.error('[Fix Counters API] Error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * GET endpoint for quick diagnosis
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const supabase = getSupabaseAdminClient();

    // Quick check using a single query
    const { data: allProfiles, error } = await supabase.from('user_profiles').select('*');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles', details: error.message },
        { status: 500 }
      );
    }

    let mismatchCount = 0;

    for (const profile of allProfiles || []) {
      const { count: creationCount } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .not('dynamic_questions', 'is', null)
        .is('deleted_at', null);

      const { count: savingCount } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.user_id)
        .not('blueprint_json', 'is', null)
        .is('deleted_at', null);

      if (
        profile.blueprint_creation_count !== (creationCount || 0) ||
        profile.blueprint_saving_count !== (savingCount || 0)
      ) {
        mismatchCount++;
      }
    }

    return NextResponse.json({
      totalUsers: allProfiles?.length || 0,
      usersWithMismatches: mismatchCount,
      status: mismatchCount === 0 ? 'healthy' : 'needs_attention',
      message:
        mismatchCount === 0
          ? 'All usage counters are accurate'
          : `${mismatchCount} users have counter mismatches. Use POST /api/admin/users/fix-counters to fix.`,
    });
  } catch (error) {
    console.error('[Fix Counters API] GET error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
