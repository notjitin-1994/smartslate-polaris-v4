'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Edit3, AlertCircle } from 'lucide-react';

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
  currentName: string;
  title?: string;
  description?: string;
  placeholder?: string;
  maxLength?: number;
}

export function RenameDialog({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  title = 'Rename Blueprint',
  description = 'Enter a new name for your blueprint',
  placeholder = 'Blueprint name',
  maxLength = 100,
}: RenameDialogProps): React.JSX.Element | null {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError(null);
      setIsLoading(false);
      // Focus input after a short delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, currentName]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    const trimmedName = newName.trim();

    // Validation
    if (!trimmedName) {
      setError('Blueprint name cannot be empty');
      return;
    }

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    if (trimmedName.length > maxLength) {
      setError(`Blueprint name cannot exceed ${maxLength} characters`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('RenameDialog: Calling onConfirm with:', trimmedName);
      await onConfirm(trimmedName);
      console.log('RenameDialog: onConfirm completed successfully');
      onClose();
    } catch (err) {
      console.error('RenameDialog: Error in onConfirm:', err);
      setError(err instanceof Error ? err.message : 'Failed to rename blueprint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) {
    console.log('RenameDialog: Dialog is not open');
    return null;
  }

  console.log('RenameDialog: Rendering dialog with currentName:', currentName);

  const hasChanges = newName.trim() !== currentName;
  const isValid = newName.trim().length > 0 && newName.trim().length <= maxLength;

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
              <div className="bg-primary/10 border-primary/20 flex h-10 w-10 items-center justify-center rounded-full border">
                <Edit3 className="text-primary h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
                <p className="text-sm text-white/60">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
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
            {/* Input */}
            <div>
              <label
                htmlFor="blueprint-name"
                className="mb-2 block text-sm font-medium text-white/90"
              >
                Blueprint Name
              </label>
              <input
                ref={inputRef}
                id="blueprint-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={isLoading}
                className="focus:border-primary/50 focus:ring-primary/20 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="mt-2 flex justify-between">
                <div className="text-xs text-white/50">
                  {newName.length}/{maxLength} characters
                </div>
                {hasChanges && (
                  <div className="text-primary flex items-center gap-1 text-xs">
                    <span className="bg-primary inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
                    Changes will be saved
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border-error/20 text-error flex items-center space-x-2 rounded-lg border px-3 py-2.5 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
                className="min-w-24"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Rename'
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
              Cmd+Enter
            </kbd>{' '}
            to save
          </div>
        </div>
      </div>
    </div>
  );
}
