'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ContextualHelpProps {
  content: string;
  trigger?: 'icon' | 'hover' | 'click';
  position?: 'top' | 'bottom' | 'left' | 'right' | 'inline';
  className?: string;
  children?: React.ReactNode;
}

export function ContextualHelp({
  content,
  trigger = 'icon',
  position = 'top',
  className,
  children,
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      clearTimeout(timeoutRef.current!);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    inline: 'relative',
  };

  if (position === 'inline') {
    return (
      <div className={cn('inline-block text-sm text-white/60', className)}>
        <svg
          className="mb-0.5 ml-1 inline h-3 w-3 text-cyan-500/60"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span className="ml-1">{content}</span>
      </div>
    );
  }

  const triggerElement =
    trigger === 'icon' ? (
      <button
        type="button"
        className="help-tooltip"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Help"
        aria-expanded={isOpen}
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    ) : (
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick}>
        {children}
      </div>
    );

  return (
    <div className={cn('relative inline-block', className)}>
      {triggerElement}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-64 rounded-lg bg-gray-900 p-3 text-sm text-white shadow-xl',
              positionClasses[position]
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Arrow */}
            <div
              className={cn(
                'absolute h-2 w-2 rotate-45 bg-gray-900',
                position === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
                position === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
                position === 'left' && 'top-1/2 right-[-4px] -translate-y-1/2',
                position === 'right' && 'top-1/2 left-[-4px] -translate-y-1/2'
              )}
            />

            {/* Content */}
            <div className="relative">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
