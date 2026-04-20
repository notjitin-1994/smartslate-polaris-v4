/**
 * Admin Utility Functions
 * Helpers for checking admin privileges and getting appropriate Supabase clients
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

/**
 * Check if a user has admin privileges (developer role)
 * @param supabase - Authenticated Supabase client
 * @param userId - User ID to check
 * @returns true if user is admin/developer, false otherwise
 */
export async function isUserAdmin(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    // Developer and admin roles have full admin privileges
    return profile.user_role === 'developer' || profile.user_role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get the appropriate Supabase client based on user's admin status
 * Admins get service role client (bypasses RLS), regular users get authenticated client
 *
 * @param authenticatedClient - The authenticated Supabase client
 * @param userId - User ID to check for admin privileges
 * @returns Supabase client (service role for admins, authenticated for regular users)
 */
export async function getClientForUser(
  authenticatedClient: SupabaseClient<Database>,
  userId: string
): Promise<{ client: SupabaseClient<Database>; isAdmin: boolean }> {
  const isAdmin = await isUserAdmin(authenticatedClient, userId);

  if (isAdmin) {
    // Return service role client that bypasses RLS
    return {
      client: getSupabaseAdminClient(),
      isAdmin: true,
    };
  }

  // Return authenticated client with RLS
  return {
    client: authenticatedClient,
    isAdmin: false,
  };
}
