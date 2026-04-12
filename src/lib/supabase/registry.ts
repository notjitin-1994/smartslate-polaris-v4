import { createServerClient } from '@supabase/ssr'
import { createClient as createBaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * INSTITUTIONAL REGISTRY PATTERN
 * Centrally manages Supabase instances with advanced validation and 
 * lazy-initialization to prevent Edge Runtime constructor crashes.
 */

function validateConfig(url?: string, key?: string) {
  if (!url || !key || url.includes('placeholder') || !url.startsWith('https://')) {
    return false;
  }
  return true;
}

export async function getSafeServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!validateConfig(url, key)) {
    console.warn('[Registry] Server Client: Missing or invalid credentials. Returning virtual mock.');
    return createVirtualClient();
  }

  return createServerClient(url!, key!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    }
  });
}

export function getSafeAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!validateConfig(url, key)) {
    console.warn('[Registry] Admin Client: Missing or invalid credentials. Returning virtual mock.');
    return createVirtualClient();
  }

  return createBaseClient(url!, key!, {
    auth: { persistSession: false }
  });
}

/**
 * Creates a "Virtual" Supabase client that implements the interface 
 * but never triggers the native constructor validation.
 */
function createVirtualClient(): any {
  return new Proxy({} as any, {
    get: (target, prop) => {
      if (prop === 'auth') return { 
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      };
      if (prop === 'from') return () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }), single: () => Promise.resolve({ data: null, error: null }) }),
        insert: () => Promise.resolve({ error: null }),
        upsert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) })
      });
      return () => Promise.resolve({ data: null, error: new Error('Supabase not configured') });
    }
  });
}
