'use client';

import { Mail, User } from 'lucide-react';

interface AuthInputProps {
  name: string;
  type: 'email' | 'text';
  label: string;
  placeholder: string;
  required?: boolean;
}

export function AuthInput({ name, type, label, placeholder, required }: AuthInputProps) {
  return (
    <div className="space-y-1.5 group">
      <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] ml-1 group-focus-within:text-primary-500 transition-colors">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary-500 transition-colors">
          {type === 'email' ? <Mail size={14} /> : <User size={14} />}
        </div>
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-white/10 focus:ring-2 focus:ring-primary-500/50 outline-none transition-all font-sans font-light"
        />
      </div>
    </div>
  );
}
