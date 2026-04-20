'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TimeoutOptionsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  blueprintId?: string;
}

/**
 * Modal displayed when blueprint generation times out
 *
 * Features:
 * - Clear explanation of timeout
 * - Options to retry or return to dashboard
 * - Friendly, encouraging tone
 * - Accessible keyboard navigation and focus management
 */
export default function TimeoutOptionsModal({
  isOpen = true,
  onClose,
  blueprintId,
}: TimeoutOptionsModalProps) {
  const router = useRouter();

  // Close on ESC key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleRetry = () => {
    onClose?.();
    router.refresh();
  };

  const handleGoHome = () => {
    onClose?.();
    router.push('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeout-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn('relative w-full max-w-lg', 'glass-card p-8', 'shadow-2xl')}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className={cn(
                  'absolute top-4 right-4',
                  'h-10 w-10 rounded-lg',
                  'flex items-center justify-center',
                  'text-text-secondary hover:text-foreground',
                  'hover:bg-white/5 active:bg-white/10',
                  'transition-all duration-200',
                  'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none'
                )}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <motion.div
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.1,
                    type: 'spring',
                    bounce: 0.4,
                  }}
                  className={cn(
                    'h-20 w-20 rounded-2xl',
                    'from-warning/20 to-amber/20 bg-gradient-to-br',
                    'border-warning/30 border',
                    'flex items-center justify-center',
                    'shadow-warning/10 shadow-lg'
                  )}
                >
                  <Clock className="text-warning h-10 w-10" strokeWidth={2} />
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                id="timeout-modal-title"
                className="text-title text-foreground mb-3 text-center font-bold"
              >
                Generation Taking Longer Than Expected
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="text-body text-text-secondary mb-6 text-center leading-relaxed"
              >
                Your blueprint is taking longer to generate than usual. This can happen with complex
                topics or high server demand. You have a few options:
              </motion.p>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="from-primary/5 to-secondary/5 border-primary/20 mb-8 rounded-xl border bg-gradient-to-r p-4"
              >
                <div className="mb-3 flex items-start gap-2">
                  <AlertTriangle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <h3 className="text-body text-foreground font-semibold">Why this happens</h3>
                    <p className="text-caption text-text-secondary mt-1">
                      Complex learning paths require more processing time. Your blueprint is still
                      being generated and will be available soon.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex flex-col gap-3"
              >
                <Button
                  className={cn(
                    'btn-primary w-full',
                    'from-primary to-primary/90 bg-gradient-to-r',
                    'hover:from-primary/90 hover:to-primary/80',
                    'shadow-primary/20 shadow-lg',
                    'transition-all duration-200'
                  )}
                  size="large"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>

                <Button variant="outline" size="large" onClick={handleGoHome} className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </motion.div>

              {/* Help Text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-caption text-text-disabled mt-4 text-center"
              >
                Tip: Your progress is saved. You can check back later to see if your blueprint is
                ready.
              </motion.p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
