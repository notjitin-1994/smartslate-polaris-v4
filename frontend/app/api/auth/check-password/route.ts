import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Check if the current user has a password set.
 * OAuth users (Google, etc.) won't have a password initially.
 */
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has a password using multiple methods:
    // 1. Check user_metadata for has_password flag (set when OAuth users set password)
    // 2. Check for 'email' identity provider (users who signed up with email/password)
    const hasPasswordMetadata = user.user_metadata?.has_password === true;
    const hasEmailProvider = user.identities?.some((identity) => identity.provider === 'email');

    const hasPassword = hasPasswordMetadata || hasEmailProvider;

    return NextResponse.json({
      hasPassword: hasPassword ?? false,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Error checking password status:', error);
    return NextResponse.json({ error: 'Failed to check password status' }, { status: 500 });
  }
}
