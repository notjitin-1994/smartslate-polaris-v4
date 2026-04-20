'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ValidationMessage {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  field?: string;
}

interface ValidationFeedbackProps {
  messages: ValidationMessage[];
  mode?: 'inline' | 'summary' | 'toast';
  className?: string;
  onDismiss?: (id: string) => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function ValidationFeedback({
  messages,
  mode = 'inline',
  className,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000,
}: ValidationFeedbackProps) {
  const [visibleMessages, setVisibleMessages] = React.useState<Set<string>>(
    new Set(messages.map((m) => m.id))
  );

  React.useEffect(() => {
    if (autoHide && messages.length > 0) {
      const timers = messages
        .map((message) => {
          if (message.type === 'success') {
            return setTimeout(() => {
              setVisibleMessages((prev) => {
                const next = new Set(prev);
                next.delete(message.id);
                return next;
              });
              onDismiss?.(message.id);
            }, autoHideDelay);
          }
          return null;
        })
        .filter(Boolean);

      return () => {
        timers.forEach((timer) => timer && clearTimeout(timer));
      };
    }
  }, [messages, autoHide, autoHideDelay, onDismiss]);

  const getIcon = (type: ValidationMessage['type']) => {
    switch (type) {
      case 'error':
        return (
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'success':
        return (
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // Toast mode
  if (mode === 'toast') {
    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {messages
            .filter((m) => visibleMessages.has(m.id))
            .map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'validation-message flex items-center gap-3 rounded-lg p-3 shadow-lg',
                  message.type,
                  className
                )}
              >
                {getIcon(message.type)}
                <span className="flex-1 text-sm">{message.message}</span>
                {onDismiss && (
                  <button
                    onClick={() => {
                      setVisibleMessages((prev) => {
                        const next = new Set(prev);
                        next.delete(message.id);
                        return next;
                      });
                      onDismiss(message.id);
                    }}
                    className="ml-2 hover:opacity-70"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    );
  }

  // Summary mode
  if (mode === 'summary') {
    if (messages.length === 0) return null;

    const errorCount = messages.filter((m) => m.type === 'error').length;
    const warningCount = messages.filter((m) => m.type === 'warning').length;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-lg border border-white/10 bg-black/50 p-4 backdrop-blur-sm',
          className
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium text-white">Validation Summary</h3>
          <div className="flex gap-3 text-sm">
            {errorCount > 0 && (
              <span className="text-red-400">
                {errorCount} error{errorCount !== 1 && 's'}
              </span>
            )}
            {warningCount > 0 && (
              <span className="text-yellow-400">
                {warningCount} warning{warningCount !== 1 && 's'}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('validation-message flex items-start gap-2', message.type)}
            >
              {getIcon(message.type)}
              <div className="flex-1">
                {message.field && <span className="font-medium">{message.field}: </span>}
                <span>{message.message}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Inline mode (default)
  return (
    <AnimatePresence>
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('validation-message', message.type, className)}
        >
          {getIcon(message.type)}
          <span className="flex-1">{message.message}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
