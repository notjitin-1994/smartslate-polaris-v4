import { createClient } from '@supabase/supabase-js';

/**
 * Administrative Supabase Client (HTTP/3)
 * Optimized for Vercel Edge Runtime. Bypasses RLS for secure server-side writes.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Safety for Preview/Development environments where secrets might be missing
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[Supabase Admin] Missing credentials. Using placeholder client.');
    return createClient(
      'https://placeholder.supabase.co', 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy', // Valid format JWT dummy
      { auth: { persistSession: false } }
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
