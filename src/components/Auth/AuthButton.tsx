'use client';

import { useFormStatus } from 'react-dom';
import { ArrowRight, Loader2 } from 'lucide-react';

interface AuthButtonProps {
  text: string;
  loadingText?: string;
}

export function AuthButton({ text, loadingText = 'Processing...' }: AuthButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative w-full overflow-hidden rounded-xl bg-primary-500 px-6 py-3.5 text-xs font-bold text-[#020C1B] transition-all hover:bg-primary-400 hover:shadow-[0_0_20px_rgba(167,218,219,0.2)] focus:ring-2 focus:ring-primary-500/50 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <span className="relative flex items-center justify-center gap-2">
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {text}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </span>
    </button>
  );
}
