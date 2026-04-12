import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * World-Class Resilient Supabase Client
 * Prevents constructor crashes in misconfigured or build-time environments.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Final Resilience: If keys are missing, return a Proxy that prevents the SDK 
  // from throwing a constructor error, but still allows the app to boot.
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] Missing credentials. Returning safe proxy client.');
    return new Proxy({} as any, {
      get: (_, prop) => {
        if (prop === 'auth') return new Proxy({}, { get: () => () => ({ data: { user: null }, error: null }) });
        return () => ({ data: null, error: new Error('Supabase not configured') });
      }
    });
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
            // Safe to ignore in Server Components
          }
        },
      },
    }
  )
}
