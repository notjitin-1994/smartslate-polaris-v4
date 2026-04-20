'use client';

import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * SignupErrorMessage Component
 *
 * Displays contextual error messages for sign-up failures with appropriate
 * call-to-action buttons. Follows SmartSlate Polaris design system with
 * glassmorphism effects and WCAG AA accessibility standards.
 */

export interface SignupErrorMessageProps {
  /** Type of error that occurred */
  reason: 'password' | 'oauth' | 'unconfirmed';
  /** OAuth provider name (e.g., 'Google', 'GitHub') - required for OAuth errors */
  provider?: string;
  /** Custom error message (optional override) */
  message?: string;
  /** Callback for resending confirmation email */
  onResendConfirmation?: () => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Maps OAuth providers to their display names and colors
 */
const OAUTH_PROVIDER_CONFIG: Record<string, { name: string; color: string }> = {
  google: { name: 'Google', color: '#4285F4' },
  github: { name: 'GitHub', color: '#333' },
  azure: { name: 'Microsoft', color: '#0078D4' },
};

export function SignupErrorMessage({
  reason,
  provider,
  message: customMessage,
  onResendConfirmation,
  className = '',
}: SignupErrorMessageProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  /**
   * Handle resending confirmation email
   */
  const handleResendConfirmation = async () => {
    if (!onResendConfirmation) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      await onResendConfirmation();
      setResendSuccess(true);

      // Reset success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to resend confirmation:', error);
    } finally {
      setIsResending(false);
    }
  };

  /**
   * Get default message based on error reason
   */
  const getDefaultMessage = (): string => {
    switch (reason) {
      case 'password':
        return 'An account with this email already exists. Please sign in or use the forgot password link to recover your account.';
      case 'oauth':
        const providerName = provider
          ? OAUTH_PROVIDER_CONFIG[provider.toLowerCase()]?.name || provider
          : 'your authentication provider';
        return `An account with this email already exists. Please sign in using ${providerName}.`;
      case 'unconfirmed':
        return "An account with this email already exists but hasn't been confirmed. Please check your email for the confirmation link.";
      default:
        return 'An error occurred during sign up. Please try again.';
    }
  };

  const displayMessage = customMessage || getDefaultMessage();

  /**
   * Render action buttons based on error type
   */
  const renderActions = () => {
    switch (reason) {
      case 'password':
        return (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              variant="primary"
              size="medium"
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              <Link href="/sign-in" className="inline-flex items-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="medium"
              className="min-h-[44px] flex-1 sm:flex-initial"
            >
              <Link href="/forgot-password">Forgot Password</Link>
            </Button>
          </div>
        );

      case 'oauth':
        return (
          <div className="mt-4">
            <Button
              asChild
              variant="primary"
              size="medium"
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Link href="/sign-in" className="inline-flex items-center gap-2">
                Go to Sign In
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        );

      case 'unconfirmed':
        return (
          <div className="mt-4">
            {resendSuccess ? (
              <div
                className="glass-card border-success/30 bg-success/10 animate-fade-in-up p-4"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <Mail className="text-success mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-body text-success font-medium">Confirmation Email Sent</p>
                    <p className="text-caption text-success/80 mt-1">
                      Please check your inbox and spam folder.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleResendConfirmation}
                variant="primary"
                size="medium"
                disabled={isResending}
                className="min-h-[44px] w-full sm:w-auto"
                aria-busy={isResending}
              >
                {isResending ? (
                  <>
                    <span className="mr-2 animate-spin" aria-hidden="true">
                      ⟳
                    </span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Resend Confirmation Email
                  </>
                )}
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`glass-card border-error/30 bg-error/5 animate-fade-in-up p-6 ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {/* Error Header */}
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex-shrink-0">
          <AlertCircle className="text-error h-6 w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Error Title */}
          <h3 className="text-heading text-error mb-2 font-semibold">Account Already Exists</h3>

          {/* Error Message */}
          <p className="text-body text-secondary leading-relaxed">{displayMessage}</p>

          {/* Action Buttons */}
          {renderActions()}
        </div>
      </div>

      {/* Help Text */}
      <div className="border-text-disabled/20 mt-4 border-t pt-4">
        <p className="text-caption text-text-disabled">
          Need help?{' '}
          <Link
            href="/support"
            className="text-primary hover:text-primary-light focus-visible:ring-primary/50 rounded underline transition-colors focus-visible:ring-2"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Convenience exports for common error scenarios
 */

export function PasswordSignupError(props: Omit<SignupErrorMessageProps, 'reason'>) {
  return <SignupErrorMessage {...props} reason="password" />;
}

export function OAuthSignupError(props: Omit<SignupErrorMessageProps, 'reason'>) {
  return <SignupErrorMessage {...props} reason="oauth" />;
}

export function UnconfirmedSignupError(props: Omit<SignupErrorMessageProps, 'reason'>) {
  return <SignupErrorMessage {...props} reason="unconfirmed" />;
}
