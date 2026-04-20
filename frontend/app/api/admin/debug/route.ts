import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Admin Debug API: Diagnostic information for troubleshooting
 * GET /api/admin/debug
 *
 * This endpoint provides diagnostic information to help troubleshoot
 * why production users might not be appearing in the admin panel.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {},
    };

    // Check 1: Environment variables
    diagnostics.checks.environmentVariables = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) || 'NOT_SET',
      keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) || 'NOT_SET',
    };

    // Check 2: Admin client initialization
    try {
      const supabase = getSupabaseAdminClient();
      diagnostics.checks.adminClient = {
        initialized: true,
        error: null,
      };

      // Check 3: Database connection - count user_profiles
      const { count: profileCount, error: profileError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      diagnostics.checks.userProfiles = {
        success: !profileError,
        count: profileCount,
        error: profileError?.message || null,
      };

      // Check 4: Auth users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

      diagnostics.checks.authUsers = {
        success: !authError,
        count: authData?.users?.length || 0,
        error: authError?.message || null,
        sampleUserIds:
          authData?.users?.slice(0, 3)?.map((u) => ({
            id: u.id.slice(0, 8),
            email: u.email,
          })) || [],
      };

      // Check 5: Fetch actual profiles with details
      const { data: profiles, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(5);

      diagnostics.checks.profilesFetch = {
        success: !fetchError,
        count: profiles?.length || 0,
        error: fetchError?.message || null,
        sampleProfiles:
          profiles?.map((p) => ({
            userId: p.user_id.slice(0, 8),
            role: p.user_role,
            tier: p.subscription_tier,
            createdAt: p.created_at,
          })) || [],
      };

      // Check 6: Data merge test
      if (profiles && profiles.length > 0 && authData?.users) {
        const authUsersMap = new Map(authData.users.map((u) => [u.id, u]));
        const mergedSample = profiles.slice(0, 3).map((profile) => {
          const authUser = authUsersMap.get(profile.user_id);
          return {
            profileUserId: profile.user_id.slice(0, 8),
            hasMatchingAuthUser: !!authUser,
            email: authUser?.email || 'NO_MATCH',
            role: profile.user_role,
            tier: profile.subscription_tier,
          };
        });

        diagnostics.checks.dataMerge = {
          success: true,
          mergedSamples: mergedSample,
          profileIdsMatchingAuth: profiles.filter((p) => authUsersMap.has(p.user_id)).length,
          profileIdsNotMatchingAuth: profiles.filter((p) => !authUsersMap.has(p.user_id)).length,
        };
      }
    } catch (clientError: any) {
      diagnostics.checks.adminClient = {
        initialized: false,
        error: clientError.message,
      };
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    console.error('[Admin Debug API] Error:', error);
    return NextResponse.json(
      {
        error: 'Debug check failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
