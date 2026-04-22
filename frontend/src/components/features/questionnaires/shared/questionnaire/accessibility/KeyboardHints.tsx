'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KeyboardHintsProps {
  show?: boolean;
  className?: string;
}

export function KeyboardHints({ show = true, className }: KeyboardHintsProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show hints when pressing '?'
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsVisible((prev) => !prev);
      }
      // Hide hints on Escape
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hints = [
    { key: 'Tab', action: 'Navigate forward' },
    { key: 'Shift + Tab', action: 'Navigate backward' },
    { key: 'Enter', action: 'Select option / Submit' },
    { key: 'Space', action: 'Toggle checkbox / Select' },
    { key: '←/→', action: 'Navigate sections' },
    { key: '?', action: 'Toggle this help' },
    { key: 'Esc', action: 'Close dialogs' },
  ];

  if (!show) return null;

  return (
    <>
      {/* Hint Toggle Button */}
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-40 rounded-full bg-white/10 p-2 backdrop-blur-sm hover:bg-white/20"
        aria-label="Keyboard shortcuts"
      >
        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>

      {/* Hints Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed bottom-16 left-4 z-50 w-80 rounded-lg bg-gray-900/95 p-4 shadow-2xl backdrop-blur-sm',
              className
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-white">Keyboard Shortcuts</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-white/60 hover:text-white"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {hints.map((hint, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <kbd className="rounded bg-white/10 px-2 py-1 font-mono text-xs text-white">
                    {hint.key}
                  </kbd>
                  <span className="text-white/70">{hint.action}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
