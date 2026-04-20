import { NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * DEBUG ENDPOINT: Test admin metrics data fetching
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function GET() {
  try {
    // Check admin access
    const adminCheck = await checkAdminAccess();

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        {
          error: 'Not admin',
          adminCheck,
        },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Test each query that the metrics API runs
    const results: any = {
      adminCheck: {
        isAdmin: adminCheck.isAdmin,
        userId: adminCheck.user?.id,
        userEmail: adminCheck.user?.email,
      },
    };

    // 1. Count total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    results.totalUsers = { count: totalUsers, error: usersError?.message };

    // 2. Count active users (signed in within 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    const activeUsers =
      authUsers?.users?.filter(
        (u) => u.last_sign_in_at && new Date(u.last_sign_in_at) > sevenDaysAgo
      ).length || 0;

    results.activeUsers = {
      totalAuthUsers: authUsers?.users?.length || 0,
      activeCount: activeUsers,
      error: authError?.message,
    };

    // 3. Count total blueprints
    const { count: totalBlueprints, error: blueprintsError } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true });

    results.totalBlueprints = { count: totalBlueprints, error: blueprintsError?.message };

    // 4. Count blueprints created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: blueprintsToday, error: todayError } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    results.blueprintsToday = { count: blueprintsToday, error: todayError?.message };

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Debug metrics endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
