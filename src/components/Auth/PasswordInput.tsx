'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  showForgot?: boolean;
}

export function PasswordInput({ name, label, placeholder, required, minLength, showForgot }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 group">
      <div className="flex justify-between items-center px-1">
        <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] group-focus-within:text-primary-500 transition-colors">
          {label}
        </label>
        {showForgot && (
          <button type="button" className="text-[9px] font-bold text-primary-500/30 uppercase tracking-widest hover:text-primary-500 transition-colors">
            Forgot?
          </button>
        )}
      </div>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary-500 transition-colors">
          <Lock size={14} />
        </div>
        <input
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          className="w-full pl-11 pr-12 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-white/10 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all font-sans font-light"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
