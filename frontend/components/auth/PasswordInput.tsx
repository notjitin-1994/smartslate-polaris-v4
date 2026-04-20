'use client';

import { useState } from 'react';
import type React from 'react';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  showValidationIcon?: boolean;
};

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  name,
  onFocus,
  onBlur,
  showValidationIcon = true,
}: Props): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  // Password validation logic
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

  const hasValue = value.length > 0;
  const meetsAllCriteria = checkPasswordCriteria(value);
  const showValidation = touched && !focused;

  function handleFocus() {
    setFocused(true);
    onFocus?.();
  }

  function handleBlur() {
    setFocused(false);
    setTouched(true);
    onBlur?.();
  }

  return (
    <div className="space-y-1">
      {/* Label - Compact */}
      <label htmlFor="password-input" className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">
        {label}
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
          {/* Lock Icon - Left - Smaller */}
          <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
            <Lock
              className={`h-4 w-4 transition-colors duration-200 ${
                focused ? 'text-primary' : 'text-white/40'
              }`}
            />
          </div>

          {/* Input Field - Compact padding */}
          <input
            id="password-input"
            type={visible ? 'text' : 'password'}
            autoComplete={autoComplete}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full rounded-xl border bg-white/5 py-2.5 pr-20 pl-10 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/30 focus:ring-2 focus:outline-none xl:py-3 ${
              // Validation colors take priority
              hasValue && meetsAllCriteria
                ? 'border-emerald-500/50 !bg-white/10 ring-emerald-500/10'
                : !hasValue || !meetsAllCriteria
                  ? 'border-red-500/50 !bg-white/10 ring-red-500/10'
                  : focused
                    ? 'border-primary/50 ring-primary/20 bg-white/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
            }`}
          />

          {/* Validation Icon - Middle Right */}
          {showValidationIcon && hasValue && (
            <div className="pointer-events-none absolute top-1/2 right-12 -translate-y-1/2">
              {meetsAllCriteria ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <X className="h-4 w-4 text-red-400" />
              )}
            </div>
          )}

          {/* Toggle Visibility Button - Far Right - Smaller */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            className="focus:ring-primary/50 absolute top-1/2 right-3 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 transition-all duration-200 hover:bg-white/5 hover:text-white/70 focus:ring-2 focus:outline-none"
            title={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
