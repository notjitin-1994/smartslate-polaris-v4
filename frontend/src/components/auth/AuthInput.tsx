'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type React from 'react';
import { Mail, Check, X, Loader2 } from 'lucide-react';

type IdentifierValue = { kind: 'email'; email: string } | { kind: 'unknown'; raw: string };

type Props = {
  value: string;
  onChange: (raw: string, parsed: IdentifierValue) => void;
  placeholder?: string;
  /** Whether to check if email already exists (default: false for login, true for signup) */
  checkExistence?: boolean;
};

function detect(input: string): IdentifierValue {
  const trimmed = input.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (emailRegex.test(trimmed)) {
    return { kind: 'email', email: trimmed.toLowerCase() };
  }
  return { kind: 'unknown', raw: input };
}

export function AuthInput({
  value,
  onChange,
  placeholder,
  checkExistence = false,
}: Props): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const parsed = detect(value);
    onChange(value, parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced email existence check
  const checkEmailExistence = useCallback(
    async (email: string) => {
      if (!checkExistence) return;

      setIsChecking(true);
      setEmailExists(null);

      try {
        console.log('[AuthInput] Checking email:', email);
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        console.log('[AuthInput] Response status:', response.status, 'OK:', response.ok);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('[AuthInput] API returned non-JSON response:', text);
          setEmailExists(null);
          return;
        }

        const data = await response.json();
        console.log('[AuthInput] Response data:', data);

        if (response.ok) {
          console.log('[AuthInput] Email exists:', data.exists);
          setEmailExists(data.exists);
        } else {
          console.error('[AuthInput] API error response:', {
            status: response.status,
            statusText: response.statusText,
            data,
          });
          setEmailExists(null);
        }
      } catch (error) {
        console.error('[AuthInput] Error checking email:', error);
        // On error, don't show any status to avoid confusion
        setEmailExists(null);
      } finally {
        setIsChecking(false);
      }
    },
    [checkExistence]
  );

  // Trigger email check when valid email is entered
  useEffect(() => {
    // Clear previous timeout
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }

    const parsed = detect(value);

    // Only check if email format is valid and checkExistence is enabled
    if (parsed.kind === 'email' && checkExistence) {
      // Reset state immediately
      setEmailExists(null);
      setIsChecking(true);

      // Debounce the API call by 500ms
      checkTimeoutRef.current = setTimeout(() => {
        checkEmailExistence(parsed.email);
      }, 500);
    } else {
      setEmailExists(null);
      setIsChecking(false);
    }

    // Cleanup function
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [value, checkExistence, checkEmailExistence]);

  function handleRawChange(next: string): void {
    onChange(next, detect(next));
  }

  // Validation state
  const hasValue = value.length > 0;
  const parsed = detect(value);
  const isValidFormat = parsed.kind === 'email';
  const showValidation = hasValue && !focused;

  // Email is valid only if format is correct AND email doesn't exist (when checking)
  const isValid = isValidFormat && (checkExistence ? emailExists === false : true);

  return (
    <div className="space-y-1">
      {/* Label - Compact */}
      <label htmlFor="email-input" className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">
        Email Address
      </label>

      {/* Input Container */}
      <div className="group relative">
        {/* Glow effect on focus */}
        <div
          className={`from-primary/20 to-primary-dark/20 absolute -inset-0.5 rounded-xl bg-gradient-to-r opacity-0 blur transition-opacity duration-300 ${
            focused ? 'opacity-100' : ''
          }`}
          aria-hidden="true"
        />

        {/* Input wrapper */}
        <div className="relative">
          {/* Icon - Left - Smaller */}
          <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
            <Mail
              className={`h-4 w-4 transition-colors duration-200 ${
                focused ? 'text-primary' : 'text-white/40'
              }`}
            />
          </div>

          {/* Input Field - Compact padding */}
          <input
            id="email-input"
            type="email"
            autoComplete="username"
            name="email"
            value={value}
            onChange={(e) => handleRawChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder ?? 'name@company.com'}
            inputMode="email"
            className={`w-full rounded-xl border bg-white/5 py-2.5 pr-10 pl-10 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/30 focus:ring-2 focus:outline-none xl:py-3 ${
              // Validation colors take priority
              isValidFormat && emailExists === false
                ? 'border-emerald-500/50 !bg-white/10 ring-emerald-500/10'
                : !hasValue || (isValidFormat && emailExists === true) || !isValid
                  ? 'border-red-500/50 !bg-white/10 ring-red-500/10'
                  : focused
                    ? 'border-primary/50 ring-primary/20 bg-white/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
            }`}
          />

          {/* Validation Icon - Right */}
          {showValidation && (
            <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
              {isChecking ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              ) : isValidFormat && emailExists === true ? (
                <X className="h-5 w-5 text-red-400" />
              ) : isValid ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <X className="h-5 w-5 text-red-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Helper Text */}
      {/* Show format error only when field is blurred */}
      {showValidation && !isValidFormat && (
        <p className="animate-fade-in-up text-xs text-red-400">
          Please enter a valid email address
        </p>
      )}

      {/* Show email existence messages even when focused (after check completes) */}
      {hasValue && isValidFormat && emailExists === true && (
        <p className="animate-fade-in-up text-xs text-red-400">
          This email already exists. Use another email ID or use the forgot password option on the
          Sign in page.
        </p>
      )}

      {hasValue && isValidFormat && emailExists === false && (
        <p className="animate-fade-in-up text-xs text-emerald-400">This email is available</p>
      )}
    </div>
  );
}
