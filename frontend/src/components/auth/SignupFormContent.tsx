'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type IdentifierValue = { kind: 'email'; email: string } | { kind: 'unknown'; raw: string };

export function SignupFormContent(): React.JSX.Element {
  const _router = useRouter();
  const [identifierRaw, setIdentifierRaw] = useState('');
  const [identifier, setIdentifier] = useState<IdentifierValue>({ kind: 'unknown', raw: '' });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  // Handle exit animation timing
  useEffect(() => {
    if (!showPasswordStrength && password) {
      setAnimatingOut(true);
      const timer = setTimeout(() => {
        setAnimatingOut(false);
      }, 200); // Match the animation duration
      return () => clearTimeout(timer);
    }
  }, [showPasswordStrength, password]);

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
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();

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

      if (signUpError) throw signUpError;

      // Update user profile if signup was successful
      if (data.user) {
        const { error: profileError } = await supabase.from('user_profiles').upsert({
          user_id: data.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
        });

        if (profileError) {
          console.error('Error updating user profile:', profileError);
          // Don't throw here as the user account was created successfully
        }
      }

      // Force immediate redirect using window.location
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="animate-fade-in-up space-y-6">
      {/* Name fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm text-white/70">First name</label>
          <input
            className="focus:ring-primary focus:border-primary w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 ring-0 transition outline-none focus:ring-[1.2px]"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-white/70">Last name</label>
          <input
            className="focus:ring-primary focus:border-primary w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 ring-0 transition outline-none focus:ring-[1.2px]"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
          />
        </div>
      </div>

      <AuthInput
        value={identifierRaw}
        onChange={(raw, parsed) => {
          setIdentifierRaw(raw);
          setIdentifier(parsed);
        }}
      />

      <div className="space-y-4">
        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Create a strong password"
          autoComplete="new-password"
          name="new-password"
          onFocus={() => setShowPasswordStrength(true)}
          onBlur={() => setShowPasswordStrength(false)}
        />
        {(showPasswordStrength || animatingOut) && password && (
          <div
            className={`${
              showPasswordStrength
                ? 'animate-in slide-in-from-top-2 duration-300'
                : 'animate-out fade-out slide-out-to-top-2 duration-200'
            }`}
          >
            <PasswordStrength value={password} />
          </div>
        )}
      </div>
      <PasswordInput
        label="Confirm password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Repeat password"
        autoComplete="new-password"
        name="confirm-password"
      />

      {error && <p className="text-error text-sm">{error}</p>}

      <button
        type="submit"
        className="btn-primary pressable w-full rounded-xl px-4 py-3"
        disabled={loading}
      >
        <span className={loading ? 'animate-pulse opacity-70' : ''}>
          {loading ? 'Creating account…' : 'Create account'}
        </span>
      </button>

      <div className="relative py-2 text-center text-xs text-white/40">
        <span className="text-primary relative z-10 rounded-sm bg-white/5 px-2">or</span>
        <span className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-white/10" />
      </div>

      <GoogleOAuthButton />
    </form>
  );
}
