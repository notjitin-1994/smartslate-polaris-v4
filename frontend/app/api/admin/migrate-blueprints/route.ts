import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin API: Migrate blueprints between users
 * POST /api/admin/migrate-blueprints
 *
 * Body:
 * - sourceEmail: Email of user to migrate FROM
 * - targetEmail: Email of user to migrate TO
 * - step: Migration step to execute (1-7)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { sourceEmail, targetEmail, step } = body;

    if (!sourceEmail || !targetEmail) {
      return NextResponse.json({ error: 'Source and target emails are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const results: any = { step, success: false };

    // STEP 1: Find User IDs
    if (step === 1 || step === 'all') {
      const { data: users, error: usersError } = await supabase.rpc('find_users_by_email', {
        p_source_email: sourceEmail,
        p_target_email: targetEmail,
      });

      if (usersError) {
        // Try direct query if RPC doesn't exist
        const { data: sourceUser } = await supabase.auth.admin.listUsers();
        const source = sourceUser?.users.find((u) => u.email === sourceEmail);
        const target = sourceUser?.users.find((u) => u.email === targetEmail);

        if (!source || !target) {
          return NextResponse.json(
            { error: 'One or both users not found', sourceEmail, targetEmail },
            { status: 404 }
          );
        }

        results.sourceUserId = source.id;
        results.targetUserId = target.id;
        results.sourceEmail = source.email;
        results.targetEmail = target.email;
      } else {
        results.users = users;
      }
    }

    // STEP 2: Count blueprints to migrate
    if (step === 2 || step === 'all') {
      const { data: sourceUser } = await supabase.auth.admin.listUsers();
      const source = sourceUser?.users.find((u) => u.email === sourceEmail);

      if (!source) {
        return NextResponse.json({ error: 'Source user not found' }, { status: 404 });
      }

      const { count, error: countError } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', source.id)
        .is('deleted_at', null);

      if (countError) {
        return NextResponse.json(
          { error: 'Failed to count blueprints', details: countError.message },
          { status: 500 }
        );
      }

      results.blueprintsToMigrate = count || 0;
      results.sourceUserId = source.id;
    }

    // STEP 3: Preview blueprints
    if (step === 3 || step === 'all') {
      const { data: sourceUser } = await supabase.auth.admin.listUsers();
      const source = sourceUser?.users.find((u) => u.email === sourceEmail);

      if (!source) {
        return NextResponse.json({ error: 'Source user not found' }, { status: 404 });
      }

      const { data: blueprints, error: blueprintsError } = await supabase
        .from('blueprint_generator')
        .select('id, title, status, created_at, updated_at')
        .eq('user_id', source.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (blueprintsError) {
        return NextResponse.json(
          { error: 'Failed to fetch blueprints', details: blueprintsError.message },
          { status: 500 }
        );
      }

      results.blueprints = blueprints;
      results.count = blueprints?.length || 0;
    }

    // STEP 4: Execute migration
    if (step === 4 || step === 'all') {
      const { data: users } = await supabase.auth.admin.listUsers();
      const source = users?.users.find((u) => u.email === sourceEmail);
      const target = users?.users.find((u) => u.email === targetEmail);

      if (!source || !target) {
        return NextResponse.json({ error: 'Users not found' }, { status: 404 });
      }

      const { error: migrationError, count } = await supabase
        .from('blueprint_generator')
        .update({
          user_id: target.id,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', source.id)
        .is('deleted_at', null)
        .select('id', { count: 'exact' });

      if (migrationError) {
        return NextResponse.json(
          { error: 'Migration failed', details: migrationError.message },
          { status: 500 }
        );
      }

      results.migratedCount = count || 0;
      results.sourceUserId = source.id;
      results.targetUserId = target.id;
      results.success = true;
    }

    // STEP 5: Update target user counters
    if (step === 5 || step === 'all') {
      const { data: users } = await supabase.auth.admin.listUsers();
      const target = users?.users.find((u) => u.email === targetEmail);

      if (!target) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }

      // Count all blueprints for creation count
      const { count: creationCount } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', target.id)
        .is('deleted_at', null);

      // Count completed blueprints for saving count
      const { count: savingCount } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', target.id)
        .eq('status', 'completed')
        .is('deleted_at', null);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          blueprint_creation_count: creationCount || 0,
          blueprint_saving_count: savingCount || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', target.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update target counters', details: updateError.message },
          { status: 500 }
        );
      }

      results.targetCounters = {
        creationCount: creationCount || 0,
        savingCount: savingCount || 0,
      };
      results.success = true;
    }

    // STEP 6: Reset source user counters
    if (step === 6 || step === 'all') {
      const { data: users } = await supabase.auth.admin.listUsers();
      const source = users?.users.find((u) => u.email === sourceEmail);

      if (!source) {
        return NextResponse.json({ error: 'Source user not found' }, { status: 404 });
      }

      const { error: resetError } = await supabase
        .from('user_profiles')
        .update({
          blueprint_creation_count: 0,
          blueprint_saving_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', source.id);

      if (resetError) {
        return NextResponse.json(
          { error: 'Failed to reset source counters', details: resetError.message },
          { status: 500 }
        );
      }

      results.sourceCountersReset = true;
      results.success = true;
    }

    // STEP 7: Verify migration
    if (step === 7 || step === 'all') {
      const { data: users } = await supabase.auth.admin.listUsers();
      const source = users?.users.find((u) => u.email === sourceEmail);
      const target = users?.users.find((u) => u.email === targetEmail);

      if (!source || !target) {
        return NextResponse.json({ error: 'Users not found' }, { status: 404 });
      }

      // Count source blueprints (should be 0)
      const { count: sourceCount } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', source.id)
        .is('deleted_at', null);

      // Count target blueprints
      const { count: targetCount } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', target.id)
        .is('deleted_at', null);

      // Get counter values
      const { data: sourceProfile } = await supabase
        .from('user_profiles')
        .select('blueprint_creation_count, blueprint_saving_count')
        .eq('user_id', source.id)
        .single();

      const { data: targetProfile } = await supabase
        .from('user_profiles')
        .select('blueprint_creation_count, blueprint_saving_count')
        .eq('user_id', target.id)
        .single();

      results.verification = {
        source: {
          email: sourceEmail,
          blueprintCount: sourceCount || 0,
          creationCounter: sourceProfile?.blueprint_creation_count || 0,
          savingCounter: sourceProfile?.blueprint_saving_count || 0,
        },
        target: {
          email: targetEmail,
          blueprintCount: targetCount || 0,
          creationCounter: targetProfile?.blueprint_creation_count || 0,
          savingCounter: targetProfile?.blueprint_saving_count || 0,
        },
        success: sourceCount === 0 && (targetCount || 0) > 0,
      };

      results.success = results.verification.success;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Blueprint migration error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
