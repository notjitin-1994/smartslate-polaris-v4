'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning';
  itemName?: string;
  itemCount?: number;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  description = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'destructive',
  itemName = 'item',
  itemCount = 1,
  isLoading = false,
}: ConfirmationDialogProps): React.JSX.Element | null {
  const [loading, setLoading] = useState(false);

  // Reset loading state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleConfirm = async () => {
    if (loading || isLoading) return;

    setLoading(true);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('ConfirmationDialog: Error in onConfirm:', error);
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const isDisabled = loading || isLoading;
  const displayName = itemCount > 1 ? `${itemCount} ${itemName}s` : itemName;
  const fullDescription =
    itemCount > 1
      ? `Are you sure you want to delete ${displayName}? ${description}`
      : `Are you sure you want to delete this ${itemName}? ${description}`;

  const Icon = variant === 'destructive' ? Trash2 : AlertTriangle;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div className="glass-strong animate-scale-in mx-4 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`border-primary/20 flex h-10 w-10 items-center justify-center rounded-full border ${
                  variant === 'destructive'
                    ? 'bg-error/10 text-error'
                    : 'bg-warning/10 text-warning'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
                <p className="text-sm text-white/60">
                  {itemCount > 1 ? `Delete ${displayName}` : `Delete ${itemName}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDisabled}
              className="pressable inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Warning Message */}
            <div
              className={`border-warning/20 text-warning flex items-start space-x-3 rounded-lg border px-4 py-3 text-sm ${
                variant === 'destructive' ? 'border-error/20 text-error' : ''
              }`}
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  {itemCount > 1 ? 'Multiple items will be deleted' : 'This item will be deleted'}
                </p>
                <p className="mt-1 text-white/80">{fullDescription}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={isDisabled}>
                {cancelText}
              </Button>
              <Button
                variant={variant === 'destructive' ? 'destructive' : 'primary'}
                onClick={handleConfirm}
                disabled={isDisabled}
                className="min-w-24"
              >
                {isDisabled ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="border-t border-white/10 bg-white/5 px-6 py-4">
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
            <span className="font-medium text-white/80">Tip:</span> Press{' '}
            <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white/70">
              Esc
            </kbd>{' '}
            to cancel,{' '}
            <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white/70">
              Enter
            </kbd>{' '}
            to confirm
          </div>
        </div>
      </div>
    </div>
  );
}
