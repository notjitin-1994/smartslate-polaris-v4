'use client';

import { motion } from 'framer-motion';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-4 space-y-2 text-left">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white leading-tight">
          {title}
        </h1>
        <p className="text-xs text-white/50 font-sans font-light leading-relaxed">
          {subtitle}
        </p>
      </motion.div>
      <div className="h-0.5 w-8 bg-primary-500/30 rounded-full" />
    </div>
  );
}
