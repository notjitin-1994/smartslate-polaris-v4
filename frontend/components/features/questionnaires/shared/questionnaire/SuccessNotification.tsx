'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface SuccessNotificationProps {
  show: boolean;
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  confettiEnabled?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

export function SuccessNotification({
  show,
  message,
  description,
  action,
  confettiEnabled = true,
  autoHide = true,
  autoHideDelay = 3000,
  className,
}: SuccessNotificationProps) {
  React.useEffect(() => {
    if (show && confettiEnabled) {
      // Trigger confetti animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#14b8a6', '#22d3ee', '#5eead4'],
      });
    }
  }, [show, confettiEnabled]);

  React.useEffect(() => {
    if (show && autoHide) {
      const timer = setTimeout(() => {
        // Auto-hide logic would be handled by parent
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [show, autoHide, autoHideDelay]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className={cn('fixed top-20 left-1/2 z-50 -translate-x-1/2', className)}
        >
          <div className="glass-medium success-celebration rounded-lg p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              {/* Success Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <motion.svg
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{message}</h3>
                {description && <p className="mt-1 text-sm text-white/70">{description}</p>}
                {action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.onClick}
                    className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    {action.label}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Progress Indicator for Auto-hide */}
            {autoHide && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 rounded-b-lg bg-green-500"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: autoHideDelay / 1000, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
