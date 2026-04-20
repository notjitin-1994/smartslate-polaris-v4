'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { NameInput } from './NameInput';
import { PasswordInput } from './PasswordInput';
import { FloatingPasswordHints } from './FloatingPasswordHints';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { SignupErrorMessage } from './SignupErrorMessage';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type IdentifierValue = { kind: 'email'; email: string } | { kind: 'unknown'; raw: string };

interface SignupFormContentProps {
  onBackToLogin?: () => void;
}

interface SignupError {
  code: string;
  reason?: 'password' | 'oauth' | 'unconfirmed';
  provider?: string;
  message: string;
}

export function SignupFormContent({
  onBackToLogin,
}: SignupFormContentProps = {}): React.JSX.Element {
  const _router = useRouter();
  const [identifierRaw, setIdentifierRaw] = useState('');
  const [identifier, setIdentifier] = useState<IdentifierValue>({ kind: 'unknown', raw: '' });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // New state for exit animation
  const [error, setError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<SignupError | null>(null);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [passwordMeetsAllCriteria, setPasswordMeetsAllCriteria] = useState(false);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);
  const passwordFieldRef = useRef<HTMLDivElement>(null);

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

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (identifier.kind !== 'email') {
      setError('Please enter a valid email address');
      return;
    }

    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    if (!lastName.trim()) {
      setError('Please enter your last name');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setSignupError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

      // OPTIMIZATION: Direct client-side sign-up with metadata.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: identifier.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // Check for 'user already exists' case
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        setSignupError({
          code: 'USER_EXISTS',
          reason: 'password',
          message: 'An account with this email already exists. Please sign in.',
        });
        setLoading(false);
        return;
      }

      // Success - Transition sequence
      if (data.session) {
        setIsExiting(true);
        setError(null);
        setTimeout(() => {
          window.location.href = '/';
        }, 600);
      } else {
        // Email confirmation required
        setError('Confirmation email sent. Please check your inbox.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      setLoading(false);
      setIsExiting(false);
    }
  }

  // Handle resend confirmation email
  async function handleResendConfirmation(): Promise<void> {
    if (identifier.kind !== 'email') return;

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: identifier.email,
    });

    if (error) {
      throw error;
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
      className="space-y-2.5 xl:space-y-3.5"
    >
      {/* Name fields - Always 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <NameInput
          id="firstName"
          label="First name"
          value={firstName}
          onChange={setFirstName}
          placeholder="John"
          autoComplete="given-name"
          required
        />
        <NameInput
          id="lastName"
          label="Last name"
          value={lastName}
          onChange={setLastName}
          placeholder="Doe"
          autoComplete="family-name"
          required
        />
      </div>

      {/* Email Input */}
      <div className="space-y-1">
        <AuthInput
          value={identifierRaw}
          onChange={(raw, parsed) => {
            setIdentifierRaw(raw);
            setIdentifier(parsed);
          }}
          checkExistence={true}
        />
      </div>

      {/* Password Input */}
      <div className="space-y-2.5" ref={passwordFieldRef}>
        <PasswordInput
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Create password"
          autoComplete="new-password"
          name="new-password"
          onFocus={() => {
            setIsPasswordFieldFocused(true);
            if (!passwordMeetsAllCriteria) setShowPasswordStrength(true);
          }}
          onBlur={() => {
            setIsPasswordFieldFocused(false);
            setShowPasswordStrength(false);
          }}
        />

        <PasswordInput
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Repeat password"
          autoComplete="new-password"
          name="confirm-password"
        />
      </div>

      {/* Floating Password Hints - Unchanged but handled by targetRef */}
      {!passwordMeetsAllCriteria && (
        <FloatingPasswordHints
          show={showPasswordStrength}
          password={password}
          targetRef={passwordFieldRef}
        />
      )}

      {/* Error Messages - Compact */}
      {signupError && signupError.reason && (
        <div className="mt-1">
          <SignupErrorMessage
            reason={signupError.reason}
            provider={signupError.provider}
            message={signupError.message}
            onResendConfirmation={signupError.reason === 'unconfirmed' ? handleResendConfirmation : undefined}
          />
        </div>
      )}

      {error && (
        <div role="alert" className="animate-fade-in-up rounded-lg border border-red-500/20 bg-red-500/10 p-2 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />
            <p className="text-[11px] leading-tight text-red-200">{error}</p>
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
              <span className="text-sm">Creating...</span>
            </>
          ) : (
            <>
              <span className="text-sm xl:text-base">Create Account</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </span>
      </button>

      {/* Divider */}
      <div className="relative py-2 xl:py-3">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
        <div className="relative flex justify-center">
          <span className="bg-[#020C1B] px-3 text-[10px] font-bold tracking-widest text-white/30 uppercase">or</span>
        </div>
      </div>

      <GoogleOAuthButton />

      {/* Footer */}
      <div className="mt-3 text-left">
        <p className="text-[11px] text-white/40">
          Already have an account?{' '}
          {onBackToLogin ? (
            <button type="button" onClick={onBackToLogin} className="text-primary font-bold underline underline-offset-4">Sign in</button>
          ) : (
            <a href="/login" className="text-primary font-bold underline underline-offset-4">Sign in</a>
          )}
        </p>
      </div>
    </motion.form>
  );
}
