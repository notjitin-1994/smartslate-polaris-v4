'use client';

import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function useGoogleOAuth() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/discovery/new`,
        },
      });

      if (error) {
        window.location.href = `${pathname}?error=${encodeURIComponent(error.message)}`;
      }
    } catch {
      window.location.href = `${pathname}?error=Google sign-in failed`;
    } finally {
      setLoading(false);
    }
  }

  return { signInWithGoogle, loading };
}
