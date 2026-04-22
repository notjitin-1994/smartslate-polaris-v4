'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuestionnaire } from './QuestionnaireProvider';
import { useRouter } from 'next/navigation';

interface SaveProgressButtonProps {
  className?: string;
  showConfirmation?: boolean;
  redirectTo?: string;
}

export function SaveProgressButton({
  className,
  showConfirmation = true,
  redirectTo = '/dashboard',
}: SaveProgressButtonProps) {
  const { saveProgress, isAutosaving, blueprintId } = useQuestionnaire();
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSaveAndExit = async () => {
    if (showConfirmation && !isConfirming) {
      setIsConfirming(true);
      setTimeout(() => setIsConfirming(false), 5000);
      return;
    }

    try {
      setIsSaving(true);
      await saveProgress();

      // Navigate with success message
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set('saved', 'true');
      url.searchParams.set('blueprintId', blueprintId || '');
      router.push(url.toString());
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setIsSaving(false);
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn('flex items-center gap-2 rounded-lg bg-orange-500/20 p-3 text-sm', className)}
      >
        <svg
          className="h-4 w-4 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-white">Save and exit? Click again to confirm.</span>
        <button
          onClick={handleSaveAndExit}
          className="ml-auto rounded bg-orange-500 px-3 py-1 text-white hover:bg-orange-600"
        >
          Confirm
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          className="rounded bg-white/10 px-3 py-1 text-white hover:bg-white/20"
        >
          Cancel
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleSaveAndExit}
      disabled={isAutosaving || isSaving}
      className={cn(
        'flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition-all hover:bg-white/20',
        (isAutosaving || isSaving) && 'cursor-not-allowed opacity-50',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isSaving ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"
            />
          </svg>
          <span>Save & Exit</span>
        </>
      )}
    </motion.button>
  );
}
