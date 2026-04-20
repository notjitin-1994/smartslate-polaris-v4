/* eslint-disable no-restricted-syntax */
'use client';

import type React from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import SwirlBackground from '@/components/SwirlBackground';
import { AuthInput } from '@/components/auth/AuthInput';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type IdentifierValue = { kind: 'email'; email: string } | { kind: 'unknown'; raw: string };

export default function ForgotPasswordPageClient(): React.JSX.Element {
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
      const response = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      );
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-[#020C1B] px-4 py-8 md:px-6 lg:px-8">
      {/* Animated background */}
      <SwirlBackground />

      {/* Subtle ambient glow overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(167, 218, 219, 0.08), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-md">
        {!sent ? (
          // Request Reset Form
          <div className="group relative">
            {/* Enhanced outer glow with animation */}
            <div
              className="pointer-events-none absolute -inset-[2px] rounded-3xl opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(135deg, rgba(167,218,219,0.15), rgba(79,70,229,0.1))',
              }}
              aria-hidden="true"
            />

            {/* Main card - premium glassmorphism */}
            <div
              className="relative rounded-2xl border border-white/10 p-4 shadow-2xl sm:p-6 md:p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Gradient border overlay */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                  maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                }}
                aria-hidden="true"
              />

              {/* Ambient inner glow */}
              <div
                className="pointer-events-none absolute -inset-6 rounded-3xl opacity-40 blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle at 50% 0%, rgba(167,218,219,0.08), transparent 70%)',
                }}
                aria-hidden="true"
              />

              <div className="relative z-10">
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="bg-primary/20 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl sm:h-16 sm:w-16">
                    <Mail className="text-primary h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h1 className="font-heading mb-2 text-xl font-bold text-white sm:text-2xl">
                    Forgot your password?
                  </h1>
                  <p className="text-sm leading-relaxed text-white/60">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <AuthInput
                      value={identifierRaw}
                      onChange={(raw, parsed) => {
                        setIdentifierRaw(raw);
                        setIdentifier(parsed);
                      }}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="animate-fade-in-up rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                        <p className="text-sm leading-relaxed text-red-200">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group bg-secondary shadow-secondary/25 hover:bg-secondary-dark hover:shadow-secondary/40 focus:ring-secondary/50 relative w-full overflow-hidden rounded-xl px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020C1B] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          <span>Sending reset link...</span>
                        </>
                      ) : (
                        <>
                          <span>Send reset link</span>
                          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-primary hover:text-primary-light inline-flex min-h-[44px] items-center px-4 py-2 text-sm font-medium transition-colors duration-200"
                  >
                    ← Back to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Success Message
          <div className="group relative">
            {/* Enhanced outer glow */}
            <div
              className="pointer-events-none absolute -inset-[2px] rounded-3xl opacity-50 blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(167,218,219,0.2))',
              }}
              aria-hidden="true"
            />

            {/* Success card */}
            <div
              className="relative rounded-2xl border border-white/10 p-4 shadow-2xl sm:p-6 md:p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              <div className="relative z-10 text-center">
                {/* Success Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 sm:h-16 sm:w-16">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 sm:h-8 sm:w-8" />
                </div>

                <h1 className="font-heading mb-3 text-xl font-bold text-white sm:text-2xl">
                  Check your email
                </h1>
                <p className="mb-6 text-sm leading-relaxed text-white/70">
                  We've sent password reset instructions to{' '}
                  <span className="text-primary font-semibold">
                    {identifier.kind === 'email' ? identifier.email : ''}
                  </span>
                </p>

                {/* Instructions */}
                <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-3 text-left sm:p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white">Next steps:</h3>
                  <ol className="space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">1.</span>
                      <span>Check your email inbox (and spam folder)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">2.</span>
                      <span>Click the reset password link</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">3.</span>
                      <span>Create your new password</span>
                    </li>
                  </ol>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="bg-secondary shadow-secondary/25 hover:bg-secondary-dark hover:shadow-secondary/40 focus:ring-secondary/50 block w-full rounded-xl px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020C1B] focus:outline-none"
                  >
                    Back to login
                  </Link>
                  <button
                    onClick={() => {
                      setSent(false);
                      setIdentifierRaw('');
                      setIdentifier({ kind: 'unknown', raw: '' });
                    }}
                    className="text-primary hover:text-primary-light w-full text-sm font-medium transition-colors duration-200"
                  >
                    Didn't receive the email? Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
