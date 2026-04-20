/**
 * SignupErrorMessage Usage Examples
 *
 * This file demonstrates how to integrate the SignupErrorMessage component
 * into your sign-up form with proper error handling.
 */

'use client';

import { useState } from 'react';
import {
  SignupErrorMessage,
  PasswordSignupError,
  OAuthSignupError,
  UnconfirmedSignupError,
} from './SignupErrorMessage';

/**
 * Example 1: Basic Integration in Sign-Up Form
 */
export function SignupFormWithErrors() {
  const [error, setError] = useState<{
    reason: 'password' | 'oauth' | 'unconfirmed';
    provider?: string;
  } | null>(null);

  const handleSignup = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();

        // Handle specific error cases
        if (data.error?.code === 'USER_EXISTS') {
          setError({
            reason: data.authMethod === 'oauth' ? 'oauth' : 'password',
            provider: data.provider,
          });
        } else if (data.error?.code === 'EMAIL_NOT_CONFIRMED') {
          setError({ reason: 'unconfirmed' });
        }
        return;
      }

      // Success - redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  const handleResendConfirmation = async () => {
    // Implement resend logic
    await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return (
    <div className="space-y-6">
      {/* Error Message - appears above form */}
      {error && (
        <SignupErrorMessage
          reason={error.reason}
          provider={error.provider}
          onResendConfirmation={
            error.reason === 'unconfirmed' ? handleResendConfirmation : undefined
          }
        />
      )}

      {/* Your sign-up form here */}
      <form className="glass-card space-y-4 p-6">{/* Form fields... */}</form>
    </div>
  );
}

/**
 * Example 2: Using Convenience Components
 */
export function ConvenienceComponentsExample() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Password auth error */}
      <PasswordSignupError />

      {/* OAuth error with provider */}
      <OAuthSignupError provider="google" />

      {/* Unconfirmed email with resend handler */}
      <UnconfirmedSignupError
        onResendConfirmation={async () => {
          console.log('Resending confirmation...');
        }}
      />
    </div>
  );
}

/**
 * Example 3: Custom Message Override
 */
export function CustomMessageExample() {
  return (
    <SignupErrorMessage
      reason="password"
      message="Your custom error message here with additional context specific to your use case."
    />
  );
}

/**
 * Example 4: Integration with Supabase Auth
 */
export function SupabaseAuthExample() {
  const [error, setError] = useState<{
    reason: 'password' | 'oauth' | 'unconfirmed';
    provider?: string;
  } | null>(null);

  const handleSupabaseSignup = async (email: string, password: string) => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      // Parse Supabase error
      if (authError.message.includes('already registered')) {
        setError({ reason: 'password' });
      } else if (authError.message.includes('not confirmed')) {
        setError({ reason: 'unconfirmed' });
      }
      return;
    }

    // Check if email confirmation is required
    if (data.user && !data.user.confirmed_at) {
      // Show success message about checking email
      console.log('Check your email for confirmation link');
    }
  };

  const handleResendSupabaseConfirmation = async () => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    // Get email from form or state
    const email = ''; // Your email value

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('Resend failed:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <SignupErrorMessage
          reason={error.reason}
          provider={error.provider}
          onResendConfirmation={
            error.reason === 'unconfirmed' ? handleResendSupabaseConfirmation : undefined
          }
        />
      )}
    </div>
  );
}

/**
 * Example 5: All Error States (Visual Demo)
 */
export function AllErrorStatesDemo() {
  const [activeDemo, setActiveDemo] = useState<'password' | 'oauth' | 'unconfirmed'>('password');

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      {/* Demo Controls */}
      <div className="glass-card p-6">
        <h2 className="text-title text-primary mb-4 font-semibold">Error State Demos</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveDemo('password')}
            className={`rounded-md px-4 py-2 transition-colors ${
              activeDemo === 'password'
                ? 'bg-primary text-background-dark'
                : 'bg-background-surface text-text-secondary hover:bg-background-paper'
            }`}
          >
            Password Auth Error
          </button>
          <button
            onClick={() => setActiveDemo('oauth')}
            className={`rounded-md px-4 py-2 transition-colors ${
              activeDemo === 'oauth'
                ? 'bg-primary text-background-dark'
                : 'bg-background-surface text-text-secondary hover:bg-background-paper'
            }`}
          >
            OAuth Error
          </button>
          <button
            onClick={() => setActiveDemo('unconfirmed')}
            className={`rounded-md px-4 py-2 transition-colors ${
              activeDemo === 'unconfirmed'
                ? 'bg-primary text-background-dark'
                : 'bg-background-surface text-text-secondary hover:bg-background-paper'
            }`}
          >
            Unconfirmed Email
          </button>
        </div>
      </div>

      {/* Active Demo */}
      <div>
        {activeDemo === 'password' && <PasswordSignupError />}
        {activeDemo === 'oauth' && <OAuthSignupError provider="google" />}
        {activeDemo === 'unconfirmed' && (
          <UnconfirmedSignupError
            onResendConfirmation={async () => {
              // Simulate API call
              await new Promise((resolve) => setTimeout(resolve, 2000));
              console.log('Confirmation email sent!');
            }}
          />
        )}
      </div>
    </div>
  );
}
