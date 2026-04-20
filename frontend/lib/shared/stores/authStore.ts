'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import type { AuthState } from './types';

const initialState = {
  user: null,
  session: null,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (user: User | null, session: Session | null) => {
        set({ user, session, error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearAuth: () => {
        set(initialState);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Auth store rehydration error:', error);
          return;
        }

        // Validate session on rehydration
        if (state?.session) {
          const now = new Date();
          const expiresAt = new Date(state.session.expires_at! * 1000);

          if (now > expiresAt) {
            // Session expired, clear auth
            state.clearAuth();
          }
        }
      },
    }
  )
);

// Selectors for better performance
export const authSelectors = {
  isAuthenticated: (state: AuthState) => !!state.user && !!state.session,
  isLoading: (state: AuthState) => state.isLoading,
  error: (state: AuthState) => state.error,
  user: (state: AuthState) => state.user,
  session: (state: AuthState) => state.session,
};
