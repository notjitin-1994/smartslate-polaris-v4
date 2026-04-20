'use client';

import type React from 'react';
import { useState } from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type IdentifierValue = { kind: 'email'; email: string } | { kind: 'unknown'; raw: string };

interface ForgotPasswordFormContentProps {
  onBack?: () => void;
}

export default function ForgotPasswordFormContent({
  onBack,
}: ForgotPasswordFormContentProps = {}): React.JSX.Element {
  const [identifierRaw, setIdentifierRaw] = useState('');
  const [identifier, setIdentifier] = useState<IdentifierValue>({ kind: 'unknown', raw: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(identifier.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (resetError) throw resetError;

      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      );
      setLoading(false);
    }
  }

  // Success screen after email sent
  if (sent) {
    return (
      <div className="space-y-5 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex h-14 w-16 items-center justify-center rounded-full bg-emerald-500/10 xl:h-16">
          <CheckCircle2 className="h-7 w-7 text-emerald-400 xl:h-8 xl:w-8" />
        </div>

        {/* Success Message */}
        <div className="space-y-1.5">
          <h2 className="font-heading text-lg font-bold text-white xl:text-xl">Check Your Email</h2>
          <p className="text-xs leading-relaxed text-white/70 xl:text-sm">
            We've sent a password reset link to{' '}
            <span className="font-semibold text-white/90">
              {identifier.kind === 'email' && identifier.email}
            </span>
          </p>
        </div>

        {/* Additional Info */}
        <div className="glass-card space-y-2 p-3.5 xl:p-4 text-left">
          <div className="flex items-start gap-2.5">
            <Mail className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="text-xs text-white/60 xl:text-sm">
              <p className="mb-1">Click the link in the email to reset your password.</p>
              <p className="text-[11px] text-white/50 xl:text-xs">
                Check your spam folder if it doesn't arrive in a few minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="hover:text-primary inline-flex items-center gap-2 text-xs font-medium text-white/60 underline underline-offset-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </button>
        ) : (
          <a
            href="/login"
            className="hover:text-primary inline-flex items-center gap-2 text-xs font-medium text-white/60 underline underline-offset-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </a>
        )}
      </div>
    );
  }

  // Form screen
  return (
    <div className="space-y-5 xl:space-y-6">
      {/* Header */}
      <div className="space-y-1 text-left">
        <h1 className="font-heading text-xl font-bold tracking-tight text-white xl:text-2xl">
          Reset Password
        </h1>
        <p className="text-[11px] text-white/50 xl:text-xs">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4 xl:space-y-5">
        <div className="space-y-1">
          <AuthInput
            value={identifierRaw}
            onChange={(raw, parsed) => {
              setIdentifierRaw(raw);
              setIdentifier(parsed);
            }}
          />
        </div>

        {error && (
          <div className="animate-fade-in-up rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />
              <p className="text-xs leading-tight text-red-200">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group bg-secondary hover:bg-secondary-dark relative w-full overflow-hidden rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 xl:py-3.5"
        >
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="text-sm">Sending...</span>
              </>
            ) : (
              <>
                <span className="text-sm xl:text-base">Send Reset Link</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </span>
        </button>

        <div className="text-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="hover:text-primary inline-flex items-center gap-2 text-[11px] font-medium text-white/50 underline underline-offset-4"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </button>
          ) : (
            <a
              href="/login"
              className="hover:text-primary inline-flex items-center gap-2 text-[11px] font-medium text-white/50 underline underline-offset-4"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
