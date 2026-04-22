'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, MessageSquare, Sparkles } from 'lucide-react';

interface AnnotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  sectionTitle: string;
  existingNote?: string;
}

export function AnnotationDialog({
  isOpen,
  onClose,
  onSave,
  sectionTitle,
  existingNote = '',
}: AnnotationDialogProps): React.JSX.Element {
  const [note, setNote] = useState(existingNote);
  const [isSaving, setIsSaving] = useState(false);

  // Reset note when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNote(existingNote);
    }
  }, [isOpen, existingNote]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(note);
      onClose();
    } catch {
      // Failed to save annotation
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNote(existingNote);
    onClose();
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="glass-strong relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative Gradient */}
              <div className="from-primary via-secondary to-primary absolute top-0 right-0 left-0 h-1 bg-gradient-to-r" />

              {/* Header */}
              <div className="border-b border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-secondary/20 mt-1 rounded-lg p-2">
                      <MessageSquare className="text-secondary h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-bold text-white">Add Annotation</h2>
                      <p className="text-text-secondary mt-1 line-clamp-1 text-sm">
                        {sectionTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="text-text-secondary rounded-lg p-2 transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Close dialog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Info Banner */}
                  <div className="border-primary/20 bg-primary/10 flex items-start gap-3 rounded-lg border p-4">
                    <Sparkles className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-text-secondary text-sm">
                        Add your thoughts, insights, or questions about this section. These
                        annotations are private and will be saved locally with your preferences.
                      </p>
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label
                      htmlFor="annotation-text"
                      className="mb-2 block text-sm font-medium text-white"
                    >
                      Your Note
                    </label>
                    <textarea
                      id="annotation-text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Enter your annotation here..."
                      rows={6}
                      className="placeholder:text-text-disabled focus:border-secondary focus:ring-secondary/50 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:ring-2 focus:outline-none"
                      autoFocus
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-text-disabled text-xs">{note.length} characters</p>
                      {note.length > 0 && (
                        <p className="text-success text-xs">Note ready to save</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-white/5 p-6">
                <button
                  onClick={handleCancel}
                  className="text-text-secondary rounded-lg border border-white/10 px-6 py-2.5 font-medium transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || note.trim().length === 0}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 font-medium shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Annotation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
