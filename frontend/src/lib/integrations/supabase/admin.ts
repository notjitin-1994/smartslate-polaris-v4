import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Admin Supabase Client (Service Role)
 *
 * IMPORTANT: This client bypasses Row Level Security (RLS) policies.
 * Only use this for admin operations on the server-side.
 * NEVER expose the service role key to the client.
 */
export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[Admin Client] Environment check:', {
    hasUrl: !!supabaseUrl,
    hasServiceRoleKey: !!supabaseServiceRoleKey,
    urlPrefix: supabaseUrl?.slice(0, 20),
    keyPrefix: supabaseServiceRoleKey?.slice(0, 20),
    keyLength: supabaseServiceRoleKey?.length,
    // Check if it looks like a service role key (should be much longer and start differently)
    isServiceRoleKey: supabaseServiceRoleKey?.startsWith(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anNsc3pyeWdjYWpkcHdneGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE0ODI2MSwiZXhwIjoyMDcwNzI0MjYxfQ'
    ),
  });

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseServiceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    throw new Error(
      `Missing Supabase environment variables: ${missingVars.join(', ')}. Please check your .env.local or production environment variables.`
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
