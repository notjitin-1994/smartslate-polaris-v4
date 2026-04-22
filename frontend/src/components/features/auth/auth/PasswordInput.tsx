'use client';

import { useState } from 'react';
import type React from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

function IconEye({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className = '' }: { className?: string }): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4.1c7 0 10.5 7 10.5 7a19.7 19.7 0 0 1-4.1 4.9" />
      <path d="M6.1 6.7C3.7 8.5 2 11.1 2 11.1s3.5 7 10.5 7c1.5 0 2.9-.3 4.1-.8" />
    </svg>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  name,
  onFocus,
  onBlur,
}: Props): React.JSX.Element {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm text-white/70">{label}</label>
      <div className="group animate-fade-in-up relative">
        <input
          className="focus:ring-primary focus:border-primary w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-white/40 transition outline-none autofill:shadow-[inset_0_0_0px_1000px_rgba(255,255,255,0.05)] focus:ring-2 focus:ring-offset-0 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:autofill]:[-webkit-text-fill-color:white]"
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          name={name}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="pressable absolute top-1/2 right-3 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-white/60 transition-colors hover:text-white"
          title={visible ? 'Hide password' : 'Show password'}
        >
          <span
            className={`transition-opacity duration-200 ${visible ? 'opacity-0' : 'opacity-100'}`}
          >
            <IconEye className="h-5 w-5" />
          </span>
          <span
            className={`absolute transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            <IconEyeOff className="h-5 w-5" />
          </span>
        </button>
      </div>
    </div>
  );
}
