import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * DEBUG ENDPOINT: Check current user's auth and role status
 * DELETE THIS FILE AFTER DEBUGGING
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    // Get auth user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        error: authError?.message || 'Not authenticated',
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile
        ? {
            user_id: profile.user_id,
            user_role: profile.user_role,
            subscription_tier: profile.subscription_tier,
            full_name: profile.full_name,
            created_at: profile.created_at,
          }
        : null,
      profileError: profileError?.message || null,
      isAdmin: profile?.user_role === 'developer' || profile?.user_role === 'admin',
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
