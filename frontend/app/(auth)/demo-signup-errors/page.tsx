'use client';

/**
 * SignupErrorMessage Component Demo Page
 *
 * Visual showcase of all error states for the SmartSlate Polaris
 * sign-up error message component.
 */

import { useState } from 'react';
import {
  SignupErrorMessage,
  PasswordSignupError,
  OAuthSignupError,
  UnconfirmedSignupError,
} from '@/components/auth/SignupErrorMessage';
import { Button } from '@/components/ui/button';

type ErrorDemo = 'password' | 'oauth-google' | 'oauth-github' | 'unconfirmed' | 'custom' | null;

export default function SignupErrorsDemoPage() {
  const [activeError, setActiveError] = useState<ErrorDemo>('password');
  const [resendCount, setResendCount] = useState(0);

  const handleResendConfirmation = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setResendCount((prev) => prev + 1);
    console.log('Confirmation email sent!');
  };

  return (
    <div className="bg-background-dark min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-display text-primary font-bold">SignupErrorMessage Component</h1>
          <p className="text-body text-secondary mx-auto max-w-2xl">
            Interactive demo showcasing all error states for SmartSlate Polaris sign-up flows. Click
            the buttons below to view different error scenarios.
          </p>
        </div>

        {/* Demo Controls */}
        <div className="glass-card space-y-4 p-6">
          <h2 className="text-heading text-primary font-semibold">Select Error State</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={() => setActiveError('password')}
              variant={activeError === 'password' ? 'default' : 'outline'}
              size="medium"
              className="min-h-[44px] justify-start"
            >
              Password Auth Error
            </Button>
            <Button
              onClick={() => setActiveError('oauth-google')}
              variant={activeError === 'oauth-google' ? 'default' : 'outline'}
              size="medium"
              className="min-h-[44px] justify-start"
            >
              OAuth Error (Google)
            </Button>
            <Button
              onClick={() => setActiveError('oauth-github')}
              variant={activeError === 'oauth-github' ? 'default' : 'outline'}
              size="medium"
              className="min-h-[44px] justify-start"
            >
              OAuth Error (GitHub)
            </Button>
            <Button
              onClick={() => setActiveError('unconfirmed')}
              variant={activeError === 'unconfirmed' ? 'default' : 'outline'}
              size="medium"
              className="min-h-[44px] justify-start"
            >
              Unconfirmed Email
            </Button>
            <Button
              onClick={() => setActiveError('custom')}
              variant={activeError === 'custom' ? 'default' : 'outline'}
              size="medium"
              className="min-h-[44px] justify-start"
            >
              Custom Message
            </Button>
            <Button
              onClick={() => setActiveError(null)}
              variant="ghost"
              size="medium"
              className="min-h-[44px] justify-start"
            >
              Clear Demo
            </Button>
          </div>
        </div>

        {/* Active Demo Display */}
        {activeError && (
          <div className="space-y-6">
            {/* Demo Label */}
            <div className="glass-shell p-4">
              <p className="text-caption text-text-secondary">
                <strong className="text-primary">Active Demo:</strong>{' '}
                {activeError === 'password' && 'Password Authentication Error'}
                {activeError === 'oauth-google' && 'OAuth Conflict Error (Google)'}
                {activeError === 'oauth-github' && 'OAuth Conflict Error (GitHub)'}
                {activeError === 'unconfirmed' && 'Unconfirmed Email Error'}
                {activeError === 'custom' && 'Custom Message Override'}
              </p>
            </div>

            {/* Error Component Display */}
            <div>
              {activeError === 'password' && <PasswordSignupError />}

              {activeError === 'oauth-google' && <OAuthSignupError provider="google" />}

              {activeError === 'oauth-github' && <OAuthSignupError provider="github" />}

              {activeError === 'unconfirmed' && (
                <UnconfirmedSignupError onResendConfirmation={handleResendConfirmation} />
              )}

              {activeError === 'custom' && (
                <SignupErrorMessage
                  reason="password"
                  message="Your enterprise account requires Single Sign-On (SSO) authentication. Please contact your IT administrator or use the SSO login option on the sign-in page to access your account."
                />
              )}
            </div>
          </div>
        )}

        {/* No Error State */}
        {!activeError && (
          <div className="glass-card space-y-4 p-12 text-center">
            <div className="mb-4 text-6xl">✨</div>
            <h3 className="text-heading text-primary font-semibold">No Error Selected</h3>
            <p className="text-body text-secondary">
              Select an error state above to view the component demo.
            </p>
          </div>
        )}

        {/* Implementation Example */}
        <div className="glass-card space-y-4 p-6">
          <h2 className="text-heading text-primary font-semibold">Implementation Example</h2>
          <div className="bg-background-paper overflow-x-auto rounded-md p-4">
            <pre className="text-caption text-text-secondary">
              <code>{getCodeExample(activeError)}</code>
            </pre>
          </div>
        </div>

        {/* Stats (if applicable) */}
        {activeError === 'unconfirmed' && resendCount > 0 && (
          <div className="glass-card bg-success/10 border-success/30 p-4">
            <p className="text-body text-success text-center">
              Resend confirmation clicked {resendCount} time{resendCount > 1 ? 's' : ''} ✓
            </p>
          </div>
        )}

        {/* Documentation Link */}
        <div className="text-center">
          <p className="text-caption text-text-secondary">
            View full documentation in{' '}
            <code className="bg-background-paper text-primary rounded px-2 py-1">
              frontend/components/auth/README.md
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Get code example based on active demo
 */
function getCodeExample(demo: ErrorDemo): string {
  switch (demo) {
    case 'password':
      return `import { PasswordSignupError } from '@/components/auth/SignupErrorMessage';

<PasswordSignupError />

// Or using the full component:
<SignupErrorMessage reason="password" />`;

    case 'oauth-google':
      return `import { OAuthSignupError } from '@/components/auth/SignupErrorMessage';

<OAuthSignupError provider="google" />

// Or using the full component:
<SignupErrorMessage reason="oauth" provider="google" />`;

    case 'oauth-github':
      return `import { OAuthSignupError } from '@/components/auth/SignupErrorMessage';

<OAuthSignupError provider="github" />`;

    case 'unconfirmed':
      return `import { UnconfirmedSignupError } from '@/components/auth/SignupErrorMessage';

const handleResend = async () => {
  await fetch('/api/auth/resend-confirmation', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

<UnconfirmedSignupError onResendConfirmation={handleResend} />`;

    case 'custom':
      return `import { SignupErrorMessage } from '@/components/auth/SignupErrorMessage';

<SignupErrorMessage
  reason="password"
  message="Your custom error message here..."
/>`;

    default:
      return `// Select an error state to see implementation example`;
  }
}
