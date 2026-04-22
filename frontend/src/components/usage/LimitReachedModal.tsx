'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Crown, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'creation' | 'saving';
  currentCount: number;
  limit: number;
  message?: string;
}

/**
 * Beautiful modal displayed when users hit blueprint limits
 *
 * Design System Compliance:
 * - Glass morphism styling matching brand aesthetic
 * - Primary accent colors (#a7dadb) for CTAs
 * - Smooth framer-motion animations
 * - Accessible keyboard navigation and focus management
 *
 * Features:
 * - Clear explanation of limit reached
 * - Friendly, encouraging tone
 * - Strong upgrade CTA
 * - Easy dismissal
 * - Focus trap and ESC key support
 */
export function LimitReachedModal({
  isOpen,
  onClose,
  limitType,
  currentCount,
  limit,
  message,
}: LimitReachedModalProps) {
  // Close on ESC key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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

  const isCreationLimit = limitType === 'creation';

  const defaultMessage = isCreationLimit
    ? `You've reached your limit of ${limit} blueprint creations. Upgrade to create unlimited blueprints!`
    : `You've reached your limit of ${limit} blueprint saves. Upgrade to save unlimited blueprints!`;

  const displayMessage = message || defaultMessage;

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
            aria-labelledby="modal-title"
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
                    'bg-warning/20',
                    'border-warning/30 border',
                    'flex items-center justify-center',
                    'shadow-warning/10 shadow-lg'
                  )}
                >
                  <AlertCircle className="text-warning h-10 w-10" strokeWidth={2} />
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                id="modal-title"
                className="text-title text-foreground mb-3 text-center font-bold"
              >
                {isCreationLimit
                  ? 'Blueprint Creation Limit Reached'
                  : 'Blueprint Save Limit Reached'}
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="text-body text-text-secondary mb-6 text-center leading-relaxed"
              >
                {displayMessage}
              </motion.p>

              {/* Stats Display */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="mb-8 rounded-xl border border-neutral-200 bg-neutral-100 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-caption text-text-secondary font-medium">
                    {isCreationLimit ? 'Creations Used' : 'Saves Used'}
                  </span>
                  <span className="text-heading text-error font-bold">
                    {currentCount} / {limit}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                    className="bg-error h-full rounded-full"
                  />
                </div>
              </motion.div>

              {/* Benefits Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="bg-primary/10 border-primary/20 mb-8 rounded-xl border p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-black" />
                  <h3 className="text-body text-foreground font-semibold">Upgrade for More</h3>
                </div>
                <ul className="space-y-2">
                  <li className="text-caption text-text-secondary flex items-start gap-2">
                    <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" />
                    <span>Unlimited blueprint creations and saves</span>
                  </li>
                  <li className="text-caption text-text-secondary flex items-start gap-2">
                    <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" />
                    <span>Advanced analytics and insights</span>
                  </li>
                  <li className="text-caption text-text-secondary flex items-start gap-2">
                    <Crown className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" />
                    <span>Priority support and early access to features</span>
                  </li>
                </ul>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Link href="/pricing" className="flex-1">
                  <Button
                    className={cn(
                      'btn-primary bg-primary w-full text-black',
                      'hover:bg-primary/90',
                      'shadow-lg',
                      'transition-all duration-200'
                    )}
                    size="large"
                    onClick={onClose}
                  >
                    <Crown className="mr-2 h-4 w-4 text-black" />
                    View Pricing
                  </Button>
                </Link>
                <Button variant="outline" size="large" onClick={onClose} className="flex-1">
                  Maybe Later
                </Button>
              </motion.div>

              {/* Help Text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-caption text-text-disabled mt-4 text-center"
              >
                Tip: Delete existing blueprints to free up space
              </motion.p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Simplified version for inline warnings (before limit is reached)
 */
export function ApproachingLimitBanner({
  limitType,
  remaining,
  onUpgradeClick,
}: {
  limitType: 'creation' | 'saving';
  remaining: number;
  onUpgradeClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('rounded-xl border p-4', 'bg-warning/5', 'border-warning/20')}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-body text-foreground mb-1 font-medium">
            Approaching {limitType === 'creation' ? 'Creation' : 'Save'} Limit
          </p>
          <p className="text-caption text-text-secondary">
            You have {remaining} {limitType === 'creation' ? 'creation' : 'save'}
            {remaining !== 1 ? 's' : ''} remaining. Consider upgrading for unlimited access.
          </p>
        </div>
        {onUpgradeClick && (
          <Button variant="ghost" size="small" onClick={onUpgradeClick} className="flex-shrink-0">
            Upgrade
          </Button>
        )}
      </div>
    </motion.div>
  );
}
