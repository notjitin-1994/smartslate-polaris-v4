'use client';

import { useState } from 'react';
import type React from 'react';
import { User, Check, X } from 'lucide-react';

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export function NameInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
}: Props): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  // Validation logic
  const hasValue = value.trim().length > 0;
  const isValid = hasValue;
  const showValidation = touched && !focused;

  return (
    <div className="space-y-1">
      {/* Label - Compact */}
      <label htmlFor={id} className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">
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
          {/* User Icon - Left - Smaller */}
          <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
            <User
              className={`h-4 w-4 transition-colors duration-200 ${
                focused ? 'text-primary' : 'text-white/40'
              }`}
            />
          </div>

          {/* Input Field - Compact padding */}
          <input
            id={id}
            type="text"
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setTouched(true);
            }}
            placeholder={placeholder}
            required={required}
            className={`w-full rounded-xl border bg-white/5 py-2.5 pr-10 pl-10 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/30 focus:ring-2 focus:outline-none xl:py-3 ${
              // Validation colors take priority
              hasValue && isValid
                ? 'border-emerald-500/50 !bg-white/10 ring-emerald-500/10'
                : !hasValue || !isValid
                  ? 'border-red-500/50 !bg-white/10 ring-red-500/10'
                  : focused
                    ? 'border-primary/50 ring-primary/20 bg-white/10'
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
            }`}
          />

          {/* Validation Icon - Right */}
          {hasValue && (
            <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
              {isValid ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : (
                <X className="h-5 w-5 text-red-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
