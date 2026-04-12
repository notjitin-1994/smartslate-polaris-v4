import { createBrowserClient } from '@supabase/ssr'

/**
 * CLIENT-SIDE REGISTRY
 * Prevents constructor crashes in browser environments.
 */

function validateConfig(url?: string, key?: string) {
  if (!url || !key || url.includes('placeholder') || !url.startsWith('https://')) {
    return false;
  }
  return true;
}

export function getSafeBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!validateConfig(url, key)) {
    console.warn('[Registry] Browser Client: Missing credentials. Returning virtual mock.');
    return createVirtualClient();
  }

  return createBrowserClient(url!, key!);
}

function createVirtualClient(): any {
  return new Proxy({} as any, {
    get: (_, prop) => {
      if (prop === 'auth') return { 
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      };
      return () => ({ data: null, error: new Error('Supabase not configured') });
    }
  });
}
