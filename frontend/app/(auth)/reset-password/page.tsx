/* eslint-disable no-restricted-syntax */
'use client';

import type React from 'react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ArrowRight, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import SwirlBackground from '@/components/SwirlBackground';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { FloatingPasswordHints } from '@/components/auth/FloatingPasswordHints';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [passwordMeetsAllCriteria, setPasswordMeetsAllCriteria] = useState(false);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);
  const passwordFieldRef = useRef<HTMLDivElement | null>(null);

  // Check if password meets all criteria
  const checkPasswordCriteria = (pwd: string): boolean => {
    const criteria = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /\d/.test(pwd),
      /[^a-zA-Z\d]/.test(pwd),
    ];
    return criteria.every((met) => met);
  };

  // Update password and check criteria
  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    const meetsAll = checkPasswordCriteria(newPassword);
    setPasswordMeetsAllCriteria(meetsAll);

    // If password now meets all criteria, hide the hints
    if (meetsAll) {
      setShowPasswordStrength(false);
    } else {
      // If password no longer meets all criteria and field is focused, show hints
      if (isPasswordFieldFocused) {
        setShowPasswordStrength(true);
      }
    }
  };

  // Check if user has valid reset token
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If no session, redirect to forgot-password page
      if (!session) {
        router.push('/forgot-password');
      }
    };

    checkSession();
  }, [router]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (!passwordMeetsAllCriteria) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login?reset=success';
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
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
        {!success ? (
          // Reset Password Form
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
              className="relative rounded-2xl border border-white/10 p-6 shadow-2xl md:p-8"
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
                  <div className="bg-primary/20 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                    <Lock className="text-primary h-8 w-8" />
                  </div>
                  <h1 className="font-heading mb-2 text-2xl font-bold text-white">
                    Create new password
                  </h1>
                  <p className="text-sm text-white/60">
                    Choose a strong password to secure your account.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Password Input */}
                  <div className="space-y-4" ref={passwordFieldRef}>
                    <PasswordInput
                      label="New password"
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      name="new-password"
                      onFocus={() => {
                        setIsPasswordFieldFocused(true);
                        // Only show hints if password doesn't meet all criteria
                        if (!passwordMeetsAllCriteria) {
                          setShowPasswordStrength(true);
                        }
                      }}
                      onBlur={() => {
                        setIsPasswordFieldFocused(false);
                        setShowPasswordStrength(false);
                      }}
                    />
                  </div>

                  {/* Floating Password Hints Popup */}
                  {!passwordMeetsAllCriteria && (
                    <FloatingPasswordHints
                      show={showPasswordStrength}
                      password={password}
                      targetRef={passwordFieldRef}
                    />
                  )}

                  {/* Confirm Password Input */}
                  <PasswordInput
                    label="Confirm new password"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    name="confirm-password"
                  />

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
                          <span>Resetting password...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset password</span>
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
                    className="text-primary hover:text-primary-light text-sm font-medium transition-colors duration-200"
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
              className="relative rounded-2xl border border-white/10 p-6 shadow-2xl md:p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              <div className="relative z-10 text-center">
                {/* Success Icon */}
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>

                <h1 className="font-heading mb-3 text-2xl font-bold text-white">
                  Password reset successful!
                </h1>
                <p className="mb-6 text-sm leading-relaxed text-white/70">
                  Your password has been updated. You can now sign in with your new password.
                </p>

                {/* Redirect notice */}
                <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">
                    Redirecting you to login page in a moment...
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="bg-primary animate-progress h-full w-full rounded-full" />
                  </div>
                </div>

                {/* Manual redirect link */}
                <Link
                  href="/login"
                  className="bg-secondary shadow-secondary/25 hover:bg-secondary-dark hover:shadow-secondary/40 focus:ring-secondary/50 block w-full rounded-xl px-6 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020C1B] focus:outline-none"
                >
                  Go to login now
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
