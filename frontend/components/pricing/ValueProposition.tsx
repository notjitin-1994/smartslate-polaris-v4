/**
 * Value Proposition Component
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Target, Zap, Shield } from 'lucide-react';

export function ValueProposition(): React.JSX.Element {
  const values = [
    {
      icon: Sparkles,
      title: 'AI-Powered Learning',
      description: 'Generate personalized learning blueprints in minutes',
    },
    {
      icon: Target,
      title: 'Goal-Oriented',
      description: 'Achieve your learning objectives faster',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Up to 5x faster processing with premium plans',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is encrypted and never shared',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {values.map((value, index) => {
        const Icon = value.icon;
        return (
          <motion.div
            key={value.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-2xl border border-white/10 p-6"
          >
            <div className="bg-primary/10 mb-4 inline-flex rounded-xl p-3">
              <Icon className="text-primary h-6 w-6" />
            </div>
            <h3 className="text-foreground mb-2 font-semibold">{value.title}</h3>
            <p className="text-text-secondary text-sm">{value.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
