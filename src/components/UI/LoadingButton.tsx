'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
}

export function LoadingButton({
  loading: manualLoading,
  loadingText = 'Processing...',
  children,
  variant = 'primary',
  icon,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  // Automatically hook into Next.js Action status if available
  const { pending } = useFormStatus();
  const isLoading = manualLoading || pending;

  const variants = {
    primary: 'bg-primary-500 text-[#020C1B] hover:bg-primary-400 shadow-[0_0_20px_rgba(167,218,219,0.2)] hover:shadow-[0_0_30px_rgba(167,218,219,0.4)]',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
    outline: 'bg-transparent text-white border border-white/20 hover:bg-white/5',
    ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      disabled={isLoading || disabled}
      className={`
        relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all active:scale-[0.98] text-sm disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-inherit backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {loadingText && (
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {loadingText}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal Content */}
      <div className={`flex items-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="tracking-wide">{children}</span>
      </div>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />
    </button>
  );
}
