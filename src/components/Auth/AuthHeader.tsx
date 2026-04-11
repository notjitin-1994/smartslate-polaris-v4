'use client';

import { motion } from 'framer-motion';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-8 space-y-3 text-left">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white leading-tight">
          {title}
        </h1>
        <p className="text-sm text-white/50 font-sans font-light leading-relaxed">
          {subtitle}
        </p>
      </motion.div>
      <div className="h-1 w-12 bg-primary-500/30 rounded-full" />
    </div>
  );
}
