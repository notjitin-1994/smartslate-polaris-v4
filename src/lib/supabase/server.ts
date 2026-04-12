import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Build-time safety: If we are in a build environment and variables are missing,
  // return a placeholder to allow static generation (like /_not-found) to complete.
  // Runtime will still throw if they are missing.
  if (!supabaseUrl || !supabaseKey) {
    return createServerClient(
      'https://placeholder.supabase.co',
      'placeholder',
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}
