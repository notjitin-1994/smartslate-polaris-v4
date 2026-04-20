/**
 * Payment Error State Component
 * Displays error messages with retry options
 */

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentErrorStateProps {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}

export function PaymentErrorState({ message, onRetry, onClose }: PaymentErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-error/10 mb-4 rounded-full p-3">
        <AlertCircle className="text-error h-8 w-8" />
      </div>

      <h3 className="text-h3 text-text-primary mb-2">Payment Failed</h3>

      <p className="text-body text-text-secondary mb-6 max-w-sm">{message}</p>

      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="bg-primary-accent hover:bg-primary-accent/90 inline-flex items-center gap-2 rounded-md px-6 py-3 text-white transition-all duration-200"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        <button
          onClick={onClose}
          className="bg-background-surface/50 text-text-primary hover:bg-background-surface/70 rounded-md px-6 py-3 transition-all duration-200"
        >
          Cancel
        </button>
      </div>

      <p className="text-caption text-text-disabled mt-6">
        If the problem persists, please contact support
      </p>
    </div>
  );
}
