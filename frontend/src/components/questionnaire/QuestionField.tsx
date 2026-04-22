'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuestionFieldProps {
  question: {
    id: string;
    label: string;
    required: boolean;
    helpText?: string;
  };
  priority?: 'high' | 'normal' | 'low';
  children: ReactNode;
  className?: string;
}

export function QuestionField({
  question,
  priority = 'normal',
  children,
  className,
}: QuestionFieldProps) {
  return (
    <motion.div
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border transition-all duration-300',
        priority === 'high'
          ? 'border-cyan-500/20 bg-gradient-to-br from-white/[0.10] to-white/[0.05] shadow-lg shadow-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/10'
          : 'border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.04] shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20',
        'backdrop-blur-xl',
        className
      )}
      whileHover={{ scale: 1.005, y: -2 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-bl from-cyan-500/10 to-transparent blur-2xl" />
      </div>

      {/* Priority indicator bar */}
      {priority === 'high' && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 shadow-lg shadow-cyan-500/50" />
      )}

      <div className="relative p-6">
        {/* Question Label */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <label
              htmlFor={question.id}
              className="group/label flex cursor-pointer items-start gap-2 text-lg font-semibold text-white"
            >
              <span className="flex-1 leading-tight">
                {question.label}
                {question.required && (
                  <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                    *
                  </span>
                )}
              </span>
            </label>
            {question.helpText && (
              <p className="flex items-start gap-2 text-sm leading-relaxed text-white/60">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{question.helpText}</span>
              </p>
            )}
          </div>

          {/* Priority Badge */}
          {priority === 'high' && (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-shrink-0 rounded-full border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 shadow-lg shadow-cyan-500/20 backdrop-blur-sm"
            >
              Required
            </motion.span>
          )}
        </div>

        {/* Question Input */}
        <div className="relative">{children}</div>
      </div>
    </motion.div>
  );
}
