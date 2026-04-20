'use client';

import { motion } from 'framer-motion';
import type React from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
