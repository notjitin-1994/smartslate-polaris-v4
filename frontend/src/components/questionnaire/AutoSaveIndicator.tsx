'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useQuestionnaire } from './QuestionnaireProvider';

interface AutoSaveIndicatorProps {
  className?: string;
  position?: 'top' | 'bottom' | 'inline';
}

export function AutoSaveIndicator({ className, position = 'inline' }: AutoSaveIndicatorProps) {
  const { isAutosaving, lastSaveTime } = useQuestionnaire();

  // Calculate time since last save
  const getTimeSinceLastSave = () => {
    if (!lastSaveTime) return null;
    const seconds = Math.floor((Date.now() - lastSaveTime.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const timeSinceLastSave = getTimeSinceLastSave();

  const positionClasses = {
    top: 'fixed top-4 right-4 z-50',
    bottom: 'fixed bottom-4 right-4 z-50',
    inline: 'inline-flex',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs backdrop-blur-sm',
          positionClasses[position],
          className
        )}
      >
        {isAutosaving ? (
          <>
            <motion.div
              className="h-2 w-2 rounded-full bg-cyan-500"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
            <span className="text-white/70">Saving...</span>
          </>
        ) : timeSinceLastSave ? (
          <>
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-white/70">Saved {timeSinceLastSave}</span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 rounded-full bg-white/30" />
            <span className="text-white/50">Not saved</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
