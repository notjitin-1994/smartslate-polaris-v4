import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Proxy({} as any, {
      get: (_, prop) => {
        return () => ({ data: null, error: new Error('Client not configured') });
      }
    });
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  )
}
