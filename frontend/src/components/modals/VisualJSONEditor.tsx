'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button, LoadingButton } from '@/components/ui/button';
import {
  Code2,
  Eye,
  Edit3,
  Undo2,
  Redo2,
  Save,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EditorPanel } from './VisualJSONEditor/EditorPanel';
import { PreviewPanel } from './VisualJSONEditor/PreviewPanel';
import { useEditorHistory } from './VisualJSONEditor/useEditorHistory';
import { useAutoSave } from './VisualJSONEditor/useAutoSave';
import { validateJSONStructure, ValidationError } from './VisualJSONEditor/validation';
import type { JsonValue } from './VisualJSONEditor/types';

interface VisualJSONEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedJSON: unknown) => Promise<void>;
  sectionTitle: string;
  sectionData: unknown;
}

/**
 * VisualJSONEditor Component
 *
 * World-class JSON editing experience with:
 * - Smart field labels & rich text editing
 * - Real-time preview with split view
 * - Undo/Redo with visual history
 * - Auto-save with draft management
 * - Inline validation & helpful errors
 * - Keyboard shortcuts (Cmd/Ctrl+S, Cmd/Ctrl+Z, etc.)
 * - Touch-optimized & accessible (WCAG AA)
 * - Smartslate Polaris brand styling
 */
export function VisualJSONEditor({
  isOpen,
  onClose,
  onSave,
  sectionTitle,
  sectionData,
}: VisualJSONEditorProps): React.JSX.Element {
  const { toast } = useToast();

  // Editor state
  const [editableData, setEditableData] = useState<JsonValue>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');

  // History management (undo/redo)
  const {
    state: historyState,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    reset: resetHistory,
  } = useEditorHistory<JsonValue>();

  // Auto-save functionality
  const { isDraftSaved, saveStatus, triggerAutoSave } = useAutoSave({
    data: editableData,
    sectionTitle,
    enabled: hasUnsavedChanges && isOpen,
  });

  // Initialize editable data when modal opens
  useEffect(() => {
    if (isOpen && sectionData) {
      try {
        const cloned = JSON.parse(JSON.stringify(sectionData)) as JsonValue;
        setEditableData(cloned);
        resetHistory(cloned);
        setValidationErrors([]);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Error cloning section data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load section data',
          variant: 'destructive',
        });
      }
    }
  }, [isOpen, sectionData, resetHistory, toast]);

  // Update from history
  useEffect(() => {
    if (historyState) {
      setEditableData(historyState);
    }
  }, [historyState]);

  // Validate data on change
  useEffect(() => {
    if (editableData !== null) {
      const errors = validateJSONStructure(editableData);
      setValidationErrors(errors);
    }
  }, [editableData]);

  // Update data with history tracking
  const updateData = useCallback(
    (newData: JsonValue) => {
      setEditableData(newData);
      pushState(newData);
      setHasUnsavedChanges(true);
      triggerAutoSave();
    },
    [pushState, triggerAutoSave]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + S: Save
      if (isCmdOrCtrl && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Cmd/Ctrl + Z: Undo
      if (isCmdOrCtrl && e.key === 'z' && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
        toast({
          title: 'Undo',
          description: 'Reverted to previous state',
        });
      }

      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y: Redo
      if ((isCmdOrCtrl && e.shiftKey && e.key === 'z') || (isCmdOrCtrl && e.key === 'y')) {
        if (canRedo) {
          e.preventDefault();
          redo();
          toast({
            title: 'Redo',
            description: 'Restored next state',
          });
        }
      }

      // Escape: Close (with confirmation if unsaved)
      if (e.key === 'Escape' && hasUnsavedChanges) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canUndo, canRedo, undo, redo, hasUnsavedChanges, toast]);

  const handleSave = async () => {
    // Validation checks
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Errors',
        description: 'Please fix all errors before saving',
        variant: 'destructive',
      });
      return;
    }

    // Prevent saving null/undefined data
    if (editableData === null || editableData === undefined) {
      toast({
        title: 'Cannot Save Empty Data',
        description: 'The section data is empty. Please ensure all fields are filled.',
        variant: 'destructive',
      });
      return;
    }

    // Additional validation for object/array types
    if (typeof editableData === 'object') {
      if (Array.isArray(editableData) && editableData.length === 0) {
        const confirmed = window.confirm(
          'You are about to save an empty array. This will remove all items from this section. Continue?'
        );
        if (!confirmed) return;
      } else if (!Array.isArray(editableData) && Object.keys(editableData).length === 0) {
        const confirmed = window.confirm(
          'You are about to save an empty object. This will remove all data from this section. Continue?'
        );
        if (!confirmed) return;
      }
    }

    setIsSaving(true);

    try {
      // Create a deep clone to ensure we're not passing references
      const dataToSave = JSON.parse(JSON.stringify(editableData));

      await onSave(dataToSave);
      setHasUnsavedChanges(false);

      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span>Changes saved successfully!</span>
          </div>
        ),
        description: 'Your edits have been applied to the blueprint',
      });

      // Delay close to show success animation
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error saving changes:', err);
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  };

  // Responsive layout: Split view on desktop, tabs on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && handleClose()}>
      <DialogContent className="max-h-[95vh] max-w-[95vw] border-0 bg-transparent p-0 shadow-none md:max-w-7xl">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
              className="glass-card relative flex max-h-[95vh] flex-col overflow-hidden"
            >
              {/* Animated background glow */}
              <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.15, 0.25, 0.15],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="bg-primary/20 absolute -top-1/2 -right-1/4 h-96 w-96 rounded-full blur-3xl"
                />
              </div>

              {/* Header */}
              <div className="flex-shrink-0 border-b border-white/10 bg-white/5 px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="from-primary via-primary-accent-light to-primary-accent hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md md:flex">
                      <Edit3 className="h-5 w-5 text-black" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-foreground truncate text-lg font-bold md:text-xl">
                        Edit Section
                      </DialogTitle>
                      <DialogDescription className="text-text-secondary truncate text-xs md:text-sm">
                        {sectionTitle}
                      </DialogDescription>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {hasUnsavedChanges && (
                      <Badge
                        variant="outline"
                        className="hidden border-yellow-500/30 bg-yellow-500/10 text-yellow-400 md:inline-flex"
                      >
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Unsaved
                      </Badge>
                    )}
                    {isDraftSaved && (
                      <Badge
                        variant="outline"
                        className="hidden border-green-500/30 bg-green-500/10 text-green-400 md:inline-flex"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Draft Saved
                      </Badge>
                    )}
                    {validationErrors.length > 0 && (
                      <Badge
                        variant="outline"
                        className="border-red-500/30 bg-red-500/10 text-red-400"
                      >
                        {validationErrors.length} Error{validationErrors.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Toolbar */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 md:gap-2">
                    {/* Undo/Redo */}
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={undo}
                      disabled={!canUndo || isSaving}
                      className="min-w-[44px]"
                      aria-label="Undo (Cmd+Z)"
                      title="Undo (Cmd+Z)"
                    >
                      <Undo2 className="h-4 w-4" />
                      <span className="ml-1 hidden md:inline">Undo</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={redo}
                      disabled={!canRedo || isSaving}
                      className="min-w-[44px]"
                      aria-label="Redo (Cmd+Shift+Z)"
                      title="Redo (Cmd+Shift+Z)"
                    >
                      <Redo2 className="h-4 w-4" />
                      <span className="ml-1 hidden md:inline">Redo</span>
                    </Button>
                  </div>

                  {/* View toggle (mobile only) */}
                  {isMobile && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant={activeView === 'edit' ? 'secondary' : 'ghost'}
                        size="small"
                        onClick={() => setActiveView('edit')}
                        className="min-w-[44px]"
                      >
                        <Edit3 className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant={activeView === 'preview' ? 'secondary' : 'ghost'}
                        size="small"
                        onClick={() => setActiveView('preview')}
                        className="min-w-[44px]"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Body - Desktop: Split View, Mobile: Tabs */}
              <div className="flex-1 overflow-hidden">
                {isMobile ? (
                  // Mobile: Single view with toggle
                  <div className="h-full overflow-y-auto">
                    {activeView === 'edit' ? (
                      <EditorPanel
                        data={editableData}
                        onUpdate={updateData}
                        validationErrors={validationErrors}
                        sectionTitle={sectionTitle}
                      />
                    ) : (
                      <PreviewPanel data={editableData} sectionTitle={sectionTitle} />
                    )}
                  </div>
                ) : (
                  // Desktop: Split view
                  <div className="grid h-full grid-cols-2 divide-x divide-white/10">
                    {/* Editor */}
                    <div className="overflow-y-auto">
                      <EditorPanel
                        data={editableData}
                        onUpdate={updateData}
                        validationErrors={validationErrors}
                        sectionTitle={sectionTitle}
                      />
                    </div>

                    {/* Preview */}
                    <div className="overflow-y-auto bg-white/5">
                      <PreviewPanel data={editableData} sectionTitle={sectionTitle} />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Actions */}
              <div className="flex-shrink-0 border-t border-white/10 bg-white/5 px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-3">
                  {/* Save status */}
                  <div className="text-text-secondary text-xs md:text-sm">
                    {saveStatus && (
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                        {saveStatus}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 md:gap-3">
                    <Button
                      variant="ghost"
                      onClick={handleClose}
                      disabled={isSaving}
                      size="medium"
                      className="text-foreground border-white/10 bg-white/5 hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <LoadingButton
                      onClick={handleSave}
                      loading={isSaving}
                      loadingText="Saving..."
                      disabled={validationErrors.length > 0 || isSaving}
                      size="medium"
                      className={cn(
                        'min-w-[100px] md:min-w-[120px]',
                        'from-primary to-primary-accent-light bg-gradient-to-r',
                        'font-semibold text-black',
                        'hover:shadow-primary/30 hover:shadow-lg',
                        'transition-all duration-300'
                      )}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </LoadingButton>
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
