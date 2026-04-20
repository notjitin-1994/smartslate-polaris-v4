'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PasswordCheckResult {
  hasPassword: boolean;
  loading: boolean;
  error: string | null;
  checkPassword: () => Promise<void>;
}

/**
 * Hook to check if the current user has a password set.
 * Used to determine if OAuth users need to set a password.
 */
export function usePasswordCheck(): PasswordCheckResult {
  const { user } = useAuth();
  const [hasPassword, setHasPassword] = useState(true); // Default to true to avoid showing modal unnecessarily
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPassword = useCallback(
    async (retries = 3, delayMs = 500) => {
      if (!user) {
        setLoading(false);
        return;
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch('/api/auth/check-password', {
            cache: 'no-store', // Prevent caching to get fresh status
          });

          if (!response.ok) {
            throw new Error('Failed to check password status');
          }

          const data = await response.json();
          setHasPassword(data.hasPassword ?? true);
          return; // Success, exit retry loop
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Failed to check password status');
          console.error(`Error checking password status (attempt ${attempt + 1}/${retries}):`, err);

          // If not the last attempt, wait before retrying
          if (attempt < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        } finally {
          setLoading(false);
        }
      }

      // All retries failed
      setError(lastError?.message ?? 'Failed to check password status');
      // Default to true on error to avoid showing modal
      setHasPassword(true);
    },
    [user]
  );

  useEffect(() => {
    checkPassword();
  }, [checkPassword]);

  return {
    hasPassword,
    loading,
    error,
    checkPassword,
  };
}
