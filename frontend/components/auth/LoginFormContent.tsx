'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type IdentifierValue = { kind: 'email'; email: string } | { kind: 'unknown'; raw: string };

interface LoginFormContentProps {
  onForgotPassword?: () => void;
  onSignup?: () => void;
}

export function LoginFormContent({
  onForgotPassword,
  onSignup,
}: LoginFormContentProps = {}): React.JSX.Element {
  const _router = useRouter();
  const [identifierRaw, setIdentifierRaw] = useState('');
  const [identifier, setIdentifier] = useState<IdentifierValue>({ kind: 'unknown', raw: '' });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // New state for exit animation
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (identifier.kind !== 'email') {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: identifier.email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before signing in.');
        } else {
          throw signInError;
        }
      }

      if (!data.session) {
        throw new Error('Failed to establish session. Please try again.');
      }

      // COORDINATED EXIT: Start the premium exit sequence
      setIsExiting(true);
      setError(null);

      // Handle redirect destination
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');

      let destination = '/';
      if (redirectUrl && redirectUrl !== '/') {
        const decoded = decodeURIComponent(redirectUrl);
        if (
          decoded.startsWith('/') &&
          !decoded.startsWith('//') &&
          !decoded.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)
        ) {
          destination = decoded;
        }
      }

      // OPTIMIZATION: Short delay to allow the exit animation to be felt, then hard redirect
      // to ensure all contexts are clean and the dashboard enters fresh.
      setTimeout(() => {
        window.location.href = destination;
      }, 600);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      setLoading(false);
      setIsExiting(false);
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      animate={isExiting ? { 
        opacity: 0, 
        scale: 0.95, 
        filter: 'blur(20px)',
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      } : {}}
      className="space-y-3 xl:space-y-4"
    >
      {/* Email Input */}
      <div className="space-y-1.5">
        <AuthInput
          value={identifierRaw}
          onChange={(raw, parsed) => {
            setIdentifierRaw(raw);
            setIdentifier(parsed);
          }}
        />
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
          name="current-password"
          showValidationIcon={false}
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          {onForgotPassword ? (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-primary hover:text-primary-light text-xs font-medium underline underline-offset-4 transition-colors duration-200"
            >
              Forgot password?
            </button>
          ) : (
            <Link
              href="/forgot-password"
              className="text-primary hover:text-primary-light text-xs font-medium underline underline-offset-4 transition-colors duration-200"
            >
              Forgot password?
            </Link>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="animate-fade-in-up rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-xs leading-tight text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="group bg-secondary hover:bg-secondary-dark relative w-full overflow-hidden rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 xl:py-3.5"
      >
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span className="text-sm">Logging in...</span>
            </>
          ) : (
            <>
              <span className="text-sm xl:text-base">Login</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>

      {/* Divider */}
      <div className="relative py-2 xl:py-3">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-white/5" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#020C1B] px-3 text-[10px] font-bold tracking-widest text-white/30 uppercase">
            or
          </span>
        </div>
      </div>

      {/* Google OAuth Button */}
      <GoogleOAuthButton />

      {/* Footer: Sign Up Link */}
      <div className="mt-4 text-left">
        <p className="text-[11px] text-white/40">
          New to Smartslate?{' '}
          {onSignup ? (
            <button
              type="button"
              onClick={onSignup}
              className="text-primary font-bold underline underline-offset-4 transition-colors duration-200"
            >
              Create free account
            </button>
          ) : (
            <a
              href="/signup"
              className="text-primary font-bold underline underline-offset-4 transition-colors duration-200"
            >
              Create free account
            </a>
          )}
        </p>
      </div>
    </motion.form>
  );
}
