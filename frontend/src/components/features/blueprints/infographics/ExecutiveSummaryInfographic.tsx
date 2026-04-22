/**
 * Executive Summary Infographic
 * Visual dashboard-style summary with key stats
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Target, Users, TrendingUp, Wand2 } from 'lucide-react';

interface ExecutiveSummaryInfographicProps {
  content: string;
  metadata?: {
    organization?: string;
    role?: string;
    generated_at?: string;
  };
  isPublicView?: boolean;
  statsCards?: React.ReactNode;
}

export function ExecutiveSummaryInfographic({
  content,
  metadata,
  isPublicView = false,
  statsCards,
}: ExecutiveSummaryInfographicProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Main Summary Card - Premium glass-morphism styling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card group hover:border-primary/30 relative overflow-hidden rounded-2xl border border-neutral-300 p-6 transition-all duration-300 md:p-8"
      >
        {/* Subtle gradient background overlay on hover */}
        <div className="bg-primary/5 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Decorative Background Glow */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="bg-primary absolute top-0 right-0 h-64 w-64 rounded-full blur-3xl" />
          <div className="bg-primary absolute bottom-0 left-0 h-64 w-64 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="bg-primary/20 rounded-xl p-3 transition-transform duration-200 group-hover:scale-105">
                <FileText
                  className="text-primary h-6 w-6"
                  strokeWidth={2}
                  fill="none"
                  stroke="currentColor"
                />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-white">Strategic Overview</h3>
                {metadata?.organization && (
                  <p className="text-text-secondary text-sm">{metadata.organization}</p>
                )}
              </div>
            </div>

            {/* AI Modify Button - Premium brand styling */}
            {!isPublicView && (
              <motion.button
                animate={{
                  boxShadow: [
                    '0 0 15px rgba(167,218,219,0.4)',
                    '0 0 25px rgba(167,218,219,0.6)',
                    '0 0 15px rgba(167,218,219,0.4)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => console.log('Modify Strategic Overview')}
                className="pressable border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:shadow-[0_0_30px_rgba(167,218,219,0.9)]"
                title="Modify with AI"
                aria-label="Modify Strategic Overview with AI"
              >
                <Wand2
                  className="h-4 w-4 drop-shadow-[0_0_10px_rgba(167,218,219,1)]"
                  fill="none"
                  stroke="currentColor"
                />
              </motion.button>
            )}
          </div>

          <p className="text-text-secondary text-base leading-relaxed">{content}</p>
        </div>
      </motion.div>

      {/* Stats Grid - Replaces highlights */}
      {statsCards && <div>{statsCards}</div>}
    </div>
  );
}
