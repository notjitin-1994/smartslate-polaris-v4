import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Returns a Supabase server client configured for SSR using Next.js cookies().
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            httpOnly: options.httpOnly,
            sameSite: options.sameSite,
            secure: options.secure,
            path: options.path,
            maxAge: options.maxAge,
            domain: options.domain,
            expires: options.expires,
          });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value: '',
            httpOnly: options.httpOnly,
            sameSite: options.sameSite,
            secure: options.secure,
            path: options.path,
            maxAge: 0,
            domain: options.domain,
            expires: new Date(0),
          });
        },
      },
    }
  );
}

export async function getServerSession() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) return { session: null, error } as const;
  return { session, error: null as null } as const;
}
