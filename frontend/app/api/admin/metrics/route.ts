import { NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server';
import { checkAdminAccess } from '@/lib/auth/adminAuth';

/**
 * GET /api/admin/metrics
 * Fetch system-wide metrics for admin dashboard with accurate realtime data
 * Requires admin/developer role
 */
export async function GET() {
  try {
    // Check admin access using regular client (respects RLS)
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    // Use admin client to bypass RLS and see all data
    const supabase = getSupabaseAdminClient();

    // Get date boundaries for calculations
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // ============================================================================
    // METRIC 1: Total Users (excluding soft-deleted users)
    // Breakdown: Active, Dormant, Never Logged In
    // ============================================================================
    // Get all non-deleted users with their last sign in data
    const { data: allUsers, error: totalUsersError } = await supabase
      .from('user_profiles')
      .select('user_id, created_at, updated_at')
      .is('deleted_at', null);

    if (totalUsersError) {
      console.error('Error fetching total users:', totalUsersError);
    }

    const totalUsers = allUsers?.length || 0;

    // Get user sign-in information from auth.users
    const userIds = allUsers?.map((u) => u.user_id) || [];
    const { data: authUsers } = await supabase.auth.admin.listUsers();

    // Create a map of user sign-in data
    const authUserMap = new Map(
      authUsers?.users.map((u) => [
        u.id,
        {
          lastSignInAt: u.last_sign_in_at,
          createdAt: u.created_at,
        },
      ]) || []
    );

    // Categorize users
    let neverLoggedIn = 0;
    let dormantUsers = 0;

    allUsers?.forEach((user) => {
      const authData = authUserMap.get(user.user_id);

      if (!authData?.lastSignInAt) {
        // Never logged in
        neverLoggedIn++;
      } else {
        const lastSignIn = new Date(authData.lastSignInAt);
        if (lastSignIn < sevenDaysAgo) {
          // Dormant: hasn't logged in for 7+ days
          dormantUsers++;
        }
      }
    });

    // Get total users from last month for trend calculation
    const { count: totalUsersLastMonth } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .lte('created_at', lastMonthEnd.toISOString());

    // Calculate trend: (current - last month) / last month * 100
    const totalUsersChange =
      totalUsersLastMonth && totalUsersLastMonth > 0
        ? (((totalUsers || 0) - totalUsersLastMonth) / totalUsersLastMonth) * 100
        : 0;

    console.log('[Admin Metrics] Total Users:', {
      totalUsers,
      breakdown: {
        neverLoggedIn,
        dormantUsers,
        activeUsers: totalUsers - neverLoggedIn - dormantUsers,
      },
      totalUsersLastMonth,
      totalUsersChange,
      totalUsersError,
    });

    // ============================================================================
    // METRIC 2: Active Users (users with activity in last 30 days OR never logged in)
    // ============================================================================
    // First, get all valid user IDs (non-deleted users)
    const { data: allValidUsers } = await supabase
      .from('user_profiles')
      .select('user_id')
      .is('deleted_at', null);

    const validUserIds = new Set(allValidUsers?.map((u) => u.user_id) || []);

    // Get users who updated their profile recently (and are in valid users)
    const { data: recentProfileUpdates } = await supabase
      .from('user_profiles')
      .select('user_id')
      .is('deleted_at', null)
      .gte('updated_at', thirtyDaysAgo.toISOString());

    const activeUserIds = new Set(recentProfileUpdates?.map((profile) => profile.user_id) || []);

    // Also check activity_logs for recent user activity (but only for valid users)
    const { data: recentActivityUsers } = await supabase
      .from('activity_logs')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('user_id', 'is', null);

    // Only add user IDs from activity logs if they exist in valid users
    recentActivityUsers?.forEach((log) => {
      if (log.user_id && validUserIds.has(log.user_id)) {
        activeUserIds.add(log.user_id);
      }
    });

    // IMPORTANT: Include never-logged-in users as active
    // These are new users who haven't signed in yet but should be counted as active
    allValidUsers?.forEach((user) => {
      const authData = authUserMap.get(user.user_id);
      if (!authData?.lastSignInAt) {
        // Never logged in - count as active
        activeUserIds.add(user.user_id);
      }
    });

    const activeUsers = activeUserIds.size;

    // Get active users from previous period (30-60 days ago)
    const { data: previousPeriodActivity } = await supabase
      .from('activity_logs')
      .select('user_id')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString())
      .not('user_id', 'is', null);

    // Only count valid users in previous period too
    const previousActiveUserIds = new Set();
    previousPeriodActivity?.forEach((log) => {
      if (log.user_id && validUserIds.has(log.user_id)) {
        previousActiveUserIds.add(log.user_id);
      }
    });
    const previousActiveUsers = previousActiveUserIds.size;

    const activeUsersChange =
      previousActiveUsers > 0
        ? ((activeUsers - previousActiveUsers) / previousActiveUsers) * 100
        : 0;

    // ============================================================================
    // METRIC 3: Total Blueprints (excluding deleted)
    // ============================================================================
    const { count: totalBlueprints, error: blueprintsError } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'deleted'); // Exclude deleted blueprints if there's a status field

    if (blueprintsError) {
      console.error('Error fetching total blueprints:', blueprintsError);
    }

    const { count: totalBlueprintsLastMonth } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'deleted')
      .lte('created_at', lastMonthEnd.toISOString());

    const totalBlueprintsChange =
      totalBlueprintsLastMonth && totalBlueprintsLastMonth > 0
        ? (((totalBlueprints || 0) - totalBlueprintsLastMonth) / totalBlueprintsLastMonth) * 100
        : 0;

    console.log('[Admin Metrics] Total Blueprints:', {
      totalBlueprints,
      totalBlueprintsLastMonth,
      totalBlueprintsChange,
      blueprintsError,
    });

    // ============================================================================
    // METRIC 4: Blueprints Today
    // ============================================================================
    const { count: blueprintsToday } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'deleted')
      .gte('created_at', todayStart.toISOString());

    // Get yesterday's count for comparison
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const { count: blueprintsYesterday } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'deleted')
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', todayStart.toISOString());

    const blueprintsTodayChange =
      blueprintsYesterday && blueprintsYesterday > 0
        ? (((blueprintsToday || 0) - blueprintsYesterday) / blueprintsYesterday) * 100
        : blueprintsToday && blueprintsToday > 0
          ? 100
          : 0; // If yesterday was 0 but today has some, show 100% increase

    // ============================================================================
    // Format response with accurate trend data
    // ============================================================================
    return NextResponse.json(
      {
        totalUsers: totalUsers || 0,
        totalUsersChange: Number(totalUsersChange.toFixed(1)),
        totalUsersTrend: totalUsersChange >= 0 ? 'up' : 'down',
        // User breakdown
        userBreakdown: {
          active: activeUsers || 0,
          dormant: dormantUsers || 0,
          neverLoggedIn: neverLoggedIn || 0,
        },

        activeUsers: activeUsers || 0,
        activeUsersChange: Number(activeUsersChange.toFixed(1)),
        activeUsersTrend: activeUsersChange >= 0 ? 'up' : 'down',

        totalBlueprints: totalBlueprints || 0,
        totalBlueprintsChange: Number(totalBlueprintsChange.toFixed(1)),
        totalBlueprintsTrend: totalBlueprintsChange >= 0 ? 'up' : 'down',

        blueprintsToday: blueprintsToday || 0,
        blueprintsTodayChange: Number(blueprintsTodayChange.toFixed(1)),
        blueprintsTodayTrend: blueprintsTodayChange >= 0 ? 'up' : 'down',

        // Metadata for debugging and transparency
        _metadata: {
          calculatedAt: new Date().toISOString(),
          periods: {
            today: todayStart.toISOString(),
            sevenDaysAgo: sevenDaysAgo.toISOString(),
            thirtyDaysAgo: thirtyDaysAgo.toISOString(),
            lastMonthStart: lastMonthStart.toISOString(),
            lastMonthEnd: lastMonthEnd.toISOString(),
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
