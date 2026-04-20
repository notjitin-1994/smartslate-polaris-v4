'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, Info } from 'lucide-react';

interface MarkdownEditorProps {
  markdown: string;
  onSave: (newMarkdown: string) => Promise<void>;
  onCancel: () => void;
}

export function MarkdownEditor({
  markdown,
  onSave,
  onCancel,
}: MarkdownEditorProps): React.JSX.Element {
  const [editedMarkdown, setEditedMarkdown] = useState(markdown);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(editedMarkdown !== markdown);
  }, [editedMarkdown, markdown]);

  // Validate that user isn't adding new headings
  const validateMarkdown = (newMarkdown: string): { valid: boolean; error?: string } => {
    const originalHeadings = markdown.match(/^#{1,6}\s+.+$/gm) || [];
    const newHeadings = newMarkdown.match(/^#{1,6}\s+.+$/gm) || [];

    // Check if headings count increased
    if (newHeadings.length > originalHeadings.length) {
      return {
        valid: false,
        error:
          'You cannot add new headings. You can only edit existing content, add list items, and add table rows.',
      };
    }

    // Check if heading text changed significantly (allowing minor edits)
    const originalHeadingTexts = originalHeadings.map((h) => h.replace(/^#+\s+/, '').trim());
    const newHeadingTexts = newHeadings.map((h) => h.replace(/^#+\s+/, '').trim());

    for (let i = 0; i < originalHeadingTexts.length; i++) {
      if (!newHeadingTexts.includes(originalHeadingTexts[i])) {
        // Check if it's a minor edit (allow some flexibility)
        const similarHeading = newHeadingTexts.find((newH) => {
          const similarity = calculateSimilarity(originalHeadingTexts[i], newH);
          return similarity > 0.7; // 70% similarity threshold
        });

        if (!similarHeading) {
          return {
            valid: false,
            error: `Heading "${originalHeadingTexts[i]}" appears to have been significantly changed or removed. Please keep existing headings intact.`,
          };
        }
      }
    }

    return { valid: true };
  };

  // Simple similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const handleSave = async () => {
    // Validate markdown
    const validation = validateMarkdown(editedMarkdown);

    if (!validation.valid) {
      setError(validation.error || 'Invalid changes detected');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedMarkdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }
    onCancel();
  };

  return (
    <div className="space-y-4">
      {/* Editor Header with Info */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Info className="text-primary-400 mt-0.5 h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-semibold text-white">Editing Guidelines</h3>
            <ul className="space-y-1 text-xs text-white/70">
              <li>✅ You can add new bullet points and list items</li>
              <li>✅ You can add new rows to existing tables</li>
              <li>✅ You can edit existing text content</li>
              <li>❌ You cannot add new headings (h1, h2, h3, etc.)</li>
              <li>❌ You cannot remove existing section headings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-error/20 bg-error/10 rounded-xl border p-4 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-error mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-error mb-1 text-sm font-semibold">Validation Error</h4>
              <p className="text-error/90 text-xs">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Editor */}
      <div className="relative">
        <textarea
          value={editedMarkdown}
          onChange={(e) => setEditedMarkdown(e.target.value)}
          className="focus:border-primary/50 focus:ring-primary/20 h-[600px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-sm text-white placeholder-white/40 backdrop-blur-sm focus:ring-2 focus:outline-none"
          placeholder="Edit your blueprint markdown..."
          spellCheck={false}
        />

        {/* Character count */}
        <div className="absolute right-3 bottom-3 rounded bg-black/30 px-2 py-1 text-xs text-white/50">
          {editedMarkdown.length} characters
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-white/60">
          {hasChanges && (
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-warning h-2 w-2 animate-pulse rounded-full" />
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="pressable inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="pressable bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
