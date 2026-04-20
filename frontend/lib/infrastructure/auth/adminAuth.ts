import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Admin authentication and authorization utilities
 * Only users with 'developer' role can access admin dashboard
 */

export type AdminRole = 'developer' | 'admin';

export interface AdminUser {
  id: string;
  email: string;
  user_role: AdminRole;
  full_name?: string;
  avatar_url?: string;
}

/**
 * Check if user has admin access (developer role)
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  user: AdminUser | null;
  error?: string;
}> {
  try {
    console.log('[AdminAuth] Starting admin access check');
    const supabase = await getSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[AdminAuth] Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.log('[AdminAuth] Authentication failed:', authError?.message || 'No user found');
      return {
        isAdmin: false,
        user: null,
        error: 'Not authenticated',
      };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, user_role, full_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    console.log('[AdminAuth] Profile result:', {
      hasProfile: !!profile,
      profileError: profileError?.message,
      userRole: profile?.user_role,
      userId: profile?.user_id,
    });

    if (profileError || !profile) {
      console.log(
        '[AdminAuth] Profile lookup failed:',
        profileError?.message || 'No profile found'
      );
      return {
        isAdmin: false,
        user: null,
        error: 'Profile not found',
      };
    }

    // Check if user has developer or admin role
    const isAdmin = profile.user_role === 'developer' || profile.user_role === 'admin';

    console.log('[AdminAuth] Admin check result:', {
      userEmail: user.email,
      userRole: profile.user_role,
      isAdmin,
    });

    if (!isAdmin) {
      console.log('[AdminAuth] User does not have developer role');
      return {
        isAdmin: false,
        user: null,
        error: 'Insufficient permissions',
      };
    }

    return {
      isAdmin: true,
      user: {
        id: profile.user_id,
        email: user.email || '', // Get email from auth.user instead
        user_role: profile.user_role as AdminRole,
        full_name: profile.full_name || undefined,
        avatar_url: profile.avatar_url || undefined,
      },
    };
  } catch (error) {
    console.error('Admin access check error:', error);
    return {
      isAdmin: false,
      user: null,
      error: 'Internal error',
    };
  }
}

/**
 * Require admin access - throws if user is not admin
 */
export async function requireAdmin(): Promise<AdminUser> {
  const { isAdmin, user, error } = await checkAdminAccess();

  if (!isAdmin || !user) {
    throw new Error(error || 'Unauthorized access');
  }

  return user;
}

/**
 * Get admin user or null
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const { isAdmin, user } = await checkAdminAccess();
  return isAdmin ? user : null;
}
