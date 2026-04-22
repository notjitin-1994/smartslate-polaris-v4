'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client-fixed';
import { useAuthStore } from '@/store/authStore';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    // OPTIMIZATION: Use getUser() for initial load as it is more secure than getSession()
    // but check session first for speed if allowed by the library version
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          setAuth(initialSession.user, initialSession);
        } else {
          setSession(null);
          setUser(null);
          setAuth(null, null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes with optimized callback handling
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      // Handle specific events for faster UI updates
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setAuth(newSession?.user ?? null, newSession ?? null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setAuth(null, null);
      }

      if (newSession && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/signup') {
          router.push('/dashboard');
        }
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, router, setAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      async signInWithPassword(email: string, password: string) {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) throw error;
      },
      async signUpWithPassword(email: string, password: string) {
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setLoading(false);
        if (error) throw error;
      },
      async signOut() {
        setLoading(true);
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          // Clear auth state
          setAuth(null, null);

          // Redirect to login and force refresh
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        } catch (error) {
          setLoading(false);
          throw error;
        }
      },
      async signInWithProvider(provider) {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        setLoading(false);
        if (error) throw error;
      },
    }),
    [user, session, loading, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
