'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableNavButtonProps {
  title: string;
  icon: LucideIcon;
  href: string;
  gradient?: string;
  isExternal?: boolean;
  className?: string;
}

/**
 * ExpandableNavButton - A button that expands on hover to reveal full text
 * with right arrow icon, similar to the Create New Blueprint button pattern.
 * Surrounding buttons dynamically adjust to accommodate the expansion.
 */
export function ExpandableNavButton({
  title,
  icon: Icon,
  href,
  gradient = 'from-primary to-primary',
  isExternal = true,
  className,
}: ExpandableNavButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const buttonContent = (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative overflow-hidden rounded-lg transition-all duration-300',
        'cursor-pointer',
        className
      )}
      initial={false}
      animate={{
        width: isHovered ? 'auto' : '48px',
      }}
      transition={{
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Background with gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity duration-300',
          gradient,
          'group-hover:opacity-100'
        )}
      />

      {/* Animated glow effect on hover */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.2 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <div className="relative flex h-12 items-center gap-3 px-3">
        {/* Icon - always visible */}
        <motion.div
          className="flex h-6 w-6 shrink-0 items-center justify-center"
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="h-5 w-5 text-black dark:text-white" />
        </motion.div>

        {/* Text - expands on hover */}
        <motion.div
          className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
          initial={false}
          animate={{
            width: isHovered ? 'auto' : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <span className="text-sm font-semibold text-black dark:text-white">{title}</span>

          {/* Right arrow icon */}
          <motion.div
            animate={{
              x: isHovered ? 0 : -10,
            }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRight className="h-4 w-4 text-black dark:text-white" />
          </motion.div>
        </motion.div>

        {/* Padding to maintain spacing when expanded */}
        {isHovered && <div className="w-2" />}
      </div>

      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </motion.div>
  );

  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {buttonContent}
    </a>
  ) : (
    buttonContent
  );
}
