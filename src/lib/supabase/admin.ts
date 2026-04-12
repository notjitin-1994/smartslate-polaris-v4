import { createClient as createBaseClient } from '@supabase/supabase-js';

/**
 * Administrative Supabase Client (HTTP/3)
 * Optimized for Vercel Edge Runtime. Bypasses RLS for secure server-side writes.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[Supabase Admin] Missing credentials. Returning safe proxy.');
    return new Proxy({} as any, {
      get: (_, prop) => {
        return () => Promise.resolve({ data: null, error: new Error('Admin client not configured') });
      }
    });
  }

  return createBaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
