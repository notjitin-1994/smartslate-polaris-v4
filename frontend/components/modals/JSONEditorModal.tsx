'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Code2, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JSONEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedJSON: unknown) => Promise<void>;
  sectionTitle: string;
  sectionData: unknown;
}

/**
 * JSONEditorModal Component
 *
 * A brand-aligned modal for editing JSON section data.
 * Features:
 * - Syntax-highlighted textarea
 * - JSON validation
 * - Error messages
 * - Copy button
 * - Keyboard shortcuts (Esc to close, Cmd+Enter to save)
 */
export function JSONEditorModal({
  isOpen,
  onClose,
  onSave,
  sectionTitle,
  sectionData,
}: JSONEditorModalProps): React.JSX.Element {
  const [jsonText, setJsonText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize JSON text when modal opens or section data changes
  useEffect(() => {
    if (isOpen && sectionData) {
      try {
        const formatted = JSON.stringify(sectionData, null, 2);
        setJsonText(formatted);
        setError(null);
        setIsValid(true);

        // Focus textarea after a short delay
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      } catch (err) {
        console.error('Error formatting JSON:', err);
        setJsonText('{}');
        setError('Failed to format JSON data');
        setIsValid(false);
      }
    }
  }, [isOpen, sectionData]);

  // Validate JSON on change
  useEffect(() => {
    if (!jsonText.trim()) {
      setError('JSON cannot be empty');
      setIsValid(false);
      return;
    }

    try {
      JSON.parse(jsonText);
      setError(null);
      setIsValid(true);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON: ${err.message}`);
      } else {
        setError('Invalid JSON syntax');
      }
      setIsValid(false);
    }
  }, [jsonText]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape' && !isLoading) {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isValid && !isLoading) {
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isValid, isLoading]);

  const handleSave = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsed = JSON.parse(jsonText);
      await onSave(parsed);
      onClose();
    } catch (err) {
      console.error('Error saving JSON:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
              className="glass-card relative overflow-hidden"
            >
              {/* Animated background glow */}
              <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="bg-primary/20 absolute -top-1/2 -right-1/4 h-96 w-96 rounded-full blur-3xl"
                />
              </div>

              <div className="relative">
                {/* Header */}
                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="from-primary via-primary-accent-light to-primary-accent flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md">
                        <Code2 className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <DialogTitle className="text-foreground text-xl font-bold">
                          Edit Section
                        </DialogTitle>
                        <DialogDescription className="text-text-secondary text-sm">
                          {sectionTitle}
                        </DialogDescription>
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
                    {/* JSON Editor */}
                    <div className="relative">
                      <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="json-editor" className="text-sm font-medium text-white/90">
                          JSON Data
                        </label>
                        <button
                          onClick={handleCopy}
                          className="pressable inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        ref={textareaRef}
                        id="json-editor"
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        disabled={isLoading}
                        className={cn(
                          'w-full rounded-lg border bg-white/5 px-4 py-3 font-mono text-sm text-white backdrop-blur-sm transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                          isValid
                            ? 'focus:border-primary/50 focus:ring-primary/20 border-white/10'
                            : 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                        )}
                        rows={20}
                        spellCheck={false}
                      />

                      {/* Validation Status */}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isValid ? (
                            <div className="flex items-center gap-1.5 text-xs text-green-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Valid JSON
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-red-400">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Invalid JSON
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-white/50">
                          {jsonText.split('\n').length} lines
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-foreground border-white/10 bg-white/5 hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={!isValid || isLoading}
                        className={cn(
                          'min-w-32',
                          'from-primary to-primary-accent-light bg-gradient-to-r',
                          'font-semibold text-black',
                          'hover:shadow-primary/30 hover:shadow-lg',
                          'transition-all duration-300',
                          'disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            <span>Saving...</span>
                          </div>
                        ) : (
                          'Save Changes'
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
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
