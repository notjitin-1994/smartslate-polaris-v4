import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this is a password recovery flow
      if (type === 'recovery') {
        // Build clear redirect to reset page
        const resetUrl = new URL('/reset-password', origin);
        return NextResponse.redirect(resetUrl);
      }

      // Handle redirect parameter after successful OAuth
      const redirectUrl = requestUrl.searchParams.get('redirect');
      const destination =
        redirectUrl && redirectUrl !== '/' ? decodeURIComponent(redirectUrl) : '/';
      return NextResponse.redirect(`${origin}${destination}`);
    } else {
      console.error('[Auth Callback] Code exchange error:', error);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/login`);
}
