'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-400',
      buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    info: {
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      buttonClass: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    },
  };

  const config = variantConfig[variant];

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
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0A1628]/95 p-6 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                disabled={isLoading}
                className="absolute top-4 right-4 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${config.iconBg}`}
                >
                  <AlertTriangle className={`h-8 w-8 ${config.iconColor}`} />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
                <p className="text-white/70">{message}</p>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 ${config.buttonClass}`}
                >
                  {isLoading ? 'Processing...' : confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
