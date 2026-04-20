'use client';

import { motion } from 'framer-motion';
import type React from 'react';

/**
 * Next.js Template - Standard Page Transitions
 * Templates remount on every navigation, triggering the entrance animation.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for high-end feel
      }}
      className="flex min-h-screen w-full flex-col"
    >
      {children}
    </motion.div>
  );
}
