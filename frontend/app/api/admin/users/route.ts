import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { logBulkRoleUpdate, logBulkTierUpdate, logBulkDelete } from '@/lib/utils/activityLogger';
import { getTierLimits } from '@/lib/config/tierLimits';

/**
 * Admin API: List and search users
 * GET /api/admin/users
 *
 * Query Parameters:
 * - search: Search term for email/name
 * - role: Filter by user role
 * - tier: Filter by subscription tier
 * - status: Filter by account status
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50, max: 100)
 * - sortBy: Sort field (email, created_at, etc.)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const tierFilter = searchParams.get('tier') || '';
    const statusFilter = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const usageMin = searchParams.get('usageMin')
      ? parseInt(searchParams.get('usageMin')!, 10)
      : null;
    const usageMax = searchParams.get('usageMax')
      ? parseInt(searchParams.get('usageMax')!, 10)
      : null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = getSupabaseAdminClient();
    const offset = (page - 1) * limit;

    console.log('[Admin Users API] Request params:', {
      page,
      limit,
      search,
      roleFilter,
      tierFilter,
      statusFilter,
      dateFrom,
      dateTo,
      usageMin,
      usageMax,
      sortBy,
      sortOrder,
    });

    // CRITICAL FIX: Start from auth.users instead of user_profiles
    // This ensures we show ALL users, even those without profiles yet
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('[Admin Users API] Error fetching auth users:', authError);
      return NextResponse.json(
        { error: 'Failed to fetch auth users', details: authError.message },
        { status: 500 }
      );
    }

    console.log('[Admin Users API] Auth users fetch result:', {
      totalAuthUsers: authData?.users?.length || 0,
    });

    if (!authData?.users || authData.users.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        filters: {
          search,
          role: roleFilter,
          tier: tierFilter,
          status: statusFilter,
        },
      });
    }

    // Fetch ALL profiles to create a map
    const { data: allProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    console.log('[Admin Users API] Profiles fetch result:', {
      totalProfiles: allProfiles?.length || 0,
      hasError: !!profilesError,
      errorMessage: profilesError?.message,
      deletedProfiles: allProfiles?.filter((p) => p.deleted_at).length || 0,
      sampleDeletedProfile: allProfiles?.find((p) => p.deleted_at)
        ? {
            user_id: allProfiles.find((p) => p.deleted_at)?.user_id.slice(0, 8),
            deleted_at: allProfiles.find((p) => p.deleted_at)?.deleted_at,
          }
        : null,
    });

    // Create profiles map for quick lookup
    const profilesMap = new Map((allProfiles || []).map((p) => [p.user_id, p]));

    // Combine auth users with their profiles (or defaults)
    const allUsers = authData.users.map((authUser) => {
      const profile = profilesMap.get(authUser.id);

      return {
        user_id: authUser.id,
        email: authUser.email || 'unknown@example.com',
        full_name: profile?.full_name || authUser.user_metadata?.full_name || null,
        user_role: profile?.user_role || 'user',
        subscription_tier: profile?.subscription_tier || 'free',
        blueprint_creation_count: profile?.blueprint_creation_count || 0,
        blueprint_creation_limit: profile?.blueprint_creation_limit || 2,
        blueprint_saving_count: profile?.blueprint_saving_count || 0,
        blueprint_saving_limit: profile?.blueprint_saving_limit || 2,
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at || authUser.updated_at || authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at || null,
        deleted_at: profile?.deleted_at || null,
        usage_metadata: {
          last_active: authUser.last_sign_in_at || null,
          total_sessions: 0,
          avg_session_duration: 0,
        },
        // Flag to indicate if profile exists
        _hasProfile: !!profile,
      };
    });

    console.log('[Admin Users API] Combined users:', {
      totalCombined: allUsers.length,
      usersWithProfiles: allUsers.filter((u) => u._hasProfile).length,
      usersWithoutProfiles: allUsers.filter((u) => !u._hasProfile).length,
      deletedUsers: allUsers.filter((u) => u.deleted_at).length,
      sampleDeletedUser: allUsers.find((u) => u.deleted_at)
        ? {
            email: allUsers.find((u) => u.deleted_at)?.email,
            deleted_at: allUsers.find((u) => u.deleted_at)?.deleted_at,
            last_sign_in_at: allUsers.find((u) => u.deleted_at)?.last_sign_in_at,
          }
        : null,
    });

    // Apply filters to the combined users
    let filteredUsers = allUsers;

    // Apply email/name search filter
    if (search) {
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Apply role filter
    if (roleFilter) {
      filteredUsers = filteredUsers.filter((u) => u.user_role === roleFilter);
    }

    // Apply tier filter
    if (tierFilter) {
      filteredUsers = filteredUsers.filter((u) => u.subscription_tier === tierFilter);
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      const beforeFilterCount = filteredUsers.length;
      filteredUsers = filteredUsers.filter((u) => {
        if (statusFilter === 'deleted') return !!u.deleted_at;
        // Active: All non-deleted users (includes users who have never logged in)
        if (statusFilter === 'active') return !u.deleted_at;
        // Inactive: Non-deleted users who have never logged in
        if (statusFilter === 'inactive') return !u.deleted_at && !u.last_sign_in_at;
        return true;
      });
      console.log('[Admin Users API] Status filter applied:', {
        statusFilter,
        beforeCount: beforeFilterCount,
        afterCount: filteredUsers.length,
        sampleDeletedAts: filteredUsers.slice(0, 3).map((u) => ({
          email: u.email,
          deleted_at: u.deleted_at,
          last_sign_in_at: u.last_sign_in_at,
        })),
      });
    }

    // Apply date range filter (filter by created_at)
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      filteredUsers = filteredUsers.filter((u) => {
        const createdDate = new Date(u.created_at);
        return createdDate >= fromDate && createdDate <= toDate;
      });
    }

    // Apply usage range filter (filter by blueprint_creation_count percentage)
    if (usageMin !== null || usageMax !== null) {
      filteredUsers = filteredUsers.filter((u) => {
        const usagePercent =
          u.blueprint_creation_limit > 0
            ? (u.blueprint_creation_count / u.blueprint_creation_limit) * 100
            : 0;

        const min = usageMin !== null ? usageMin : 0;
        const max = usageMax !== null ? usageMax : 100;

        return usagePercent >= min && usagePercent <= max;
      });
    }

    // Apply pagination
    const totalCount = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    console.log('[Admin Users API] Final result:', {
      totalUsersBeforeFilter: allUsers.length,
      filteredUsersCount: filteredUsers.length,
      paginatedUsersCount: paginatedUsers.length,
      totalCount,
      sampleUser: paginatedUsers[0]
        ? {
            id: paginatedUsers[0].user_id.slice(0, 8),
            email: paginatedUsers[0].email,
            role: paginatedUsers[0].user_role,
            tier: paginatedUsers[0].subscription_tier,
          }
        : null,
    });

    return NextResponse.json(
      {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        filters: {
          search,
          role: roleFilter,
          tier: tierFilter,
          status: statusFilter,
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
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * Admin API: Bulk user operations
 * POST /api/admin/users
 *
 * Body:
 * - action: 'bulk_delete' | 'bulk_update_role' | 'bulk_update_tier'
 * - userIds: Array of user IDs
 * - data: Additional data (role, tier, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    const body = await request.json();
    const { action, userIds, data } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. Required: action, userIds (array)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    switch (action) {
      case 'bulk_update_role': {
        if (!data?.role) {
          return NextResponse.json(
            { error: 'Role is required for bulk_update_role action' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('user_profiles')
          .update({ user_role: data.role, updated_at: new Date().toISOString() })
          .in('user_id', userIds);

        if (error) {
          console.error('Bulk role update error:', error);
          return NextResponse.json(
            { error: 'Failed to update user roles', details: error.message },
            { status: 500 }
          );
        }

        // Log activity
        await logBulkRoleUpdate(request, userIds, data.role);

        return NextResponse.json({
          success: true,
          message: `Updated role for ${userIds.length} users`,
          updated: userIds.length,
        });
      }

      case 'bulk_update_tier': {
        if (!data?.tier) {
          return NextResponse.json(
            { error: 'Tier is required for bulk_update_tier action' },
            { status: 400 }
          );
        }

        // Fetch tier limits for the new tier
        let tierLimits;
        try {
          tierLimits = await getTierLimits(supabase, data.tier);
        } catch (error) {
          console.error('Failed to fetch tier limits:', error);
          return NextResponse.json(
            { error: 'Failed to fetch limits for new tier' },
            { status: 500 }
          );
        }

        // Update tier and limits together
        const { error } = await supabase
          .from('user_profiles')
          .update({
            subscription_tier: data.tier,
            blueprint_creation_limit: tierLimits.creationLimit,
            blueprint_saving_limit: tierLimits.savingLimit,
            updated_at: new Date().toISOString(),
          })
          .in('user_id', userIds);

        if (error) {
          console.error('Bulk tier update error:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription tiers', details: error.message },
            { status: 500 }
          );
        }

        // Log activity
        await logBulkTierUpdate(request, userIds, data.tier);

        return NextResponse.json({
          success: true,
          message: `Updated tier and limits for ${userIds.length} users`,
          updated: userIds.length,
        });
      }

      case 'bulk_delete': {
        // Soft delete: Mark users as deleted rather than actually deleting
        // This preserves audit trails and allows recovery
        const { error } = await supabase
          .from('user_profiles')
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('user_id', userIds);

        if (error) {
          console.error('Bulk delete error:', error);
          return NextResponse.json(
            { error: 'Failed to delete users', details: error.message },
            { status: 500 }
          );
        }

        // Log activity
        await logBulkDelete(request, userIds);

        return NextResponse.json({
          success: true,
          message: `Deleted ${userIds.length} users`,
          deleted: userIds.length,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin bulk operations API error:', error);
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
