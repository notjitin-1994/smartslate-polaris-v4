/**
 * Objectives Infographic Component
 * Animated cards showing learning objectives with baseline/target progress
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Info } from 'lucide-react';
import { calculateProgress, formatDate } from '../utils';
import type { Objective, ChartConfig } from '../types';

interface ObjectivesInfographicProps {
  objectives: Objective[];
  chartConfig?: ChartConfig;
}

// Helper function to extract numerical value from baseline/target strings
const extractNumericalValue = (value: string): string => {
  // Extract percentage or numerical value from strings like "60% accuracy in service boundary definition"
  const match = value.match(/(\d+(?:\.\d+)?)%?/);
  return match ? match[1] + (value.includes('%') ? '%' : '') : value;
};

// Helper function to extract full description for tooltip
const extractFullDescription = (value: string): string => {
  // Return the full description for tooltip, or just the value if no number found
  const match = value.match(/(\d+(?:\.\d+)?)%?\s*(.+)/);
  return match ? match[2] : value;
};

export function ObjectivesInfographic({
  objectives,
}: ObjectivesInfographicProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {objectives.map((obj, index) => {
        const baselineValue = extractNumericalValue(String(obj.baseline));
        const targetValue = extractNumericalValue(String(obj.target));
        const baselineDescription = extractFullDescription(String(obj.baseline));
        const targetDescription = extractFullDescription(String(obj.target));

        return (
          <motion.div
            key={obj.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="glass-strong group relative flex h-full flex-col rounded-xl p-5 transition-all hover:shadow-lg"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Target
                    className="text-primary h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  />
                </div>
                <div className="text-primary text-xl font-bold">#{index + 1}</div>
              </div>
              <div className="text-text-secondary bg-surface rounded-md px-2 py-1 text-xs">
                {formatDate(obj.due_date)}
              </div>
            </div>

            {/* Content Area - Flexible Height */}
            <div className="mb-4 flex-grow">
              <h3 className="text-heading text-foreground mb-2 line-clamp-2 min-h-[3rem] font-semibold">
                {obj.title}
              </h3>

              <p className="text-body text-text-secondary mb-4 line-clamp-2 min-h-[2.5rem] text-sm">
                {obj.description}
              </p>

              {/* Metric Badge */}
              <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs">
                <TrendingUp className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} />
                <span className="font-medium">{obj.metric}</span>
              </div>

              {/* Compact Baseline/Target Display */}
              <div className="grid grid-cols-2 gap-3">
                {/* Baseline */}
                <div className="group/baseline relative">
                  <div className="text-text-secondary mb-1 text-xs">Baseline</div>
                  <div className="text-foreground text-lg font-semibold">{baselineValue}</div>
                  {baselineDescription !== baselineValue && (
                    <div className="absolute bottom-full left-0 z-10 mb-2 hidden group-hover/baseline:block">
                      <div className="bg-foreground text-background rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                        {baselineDescription}
                        <div className="border-t-foreground absolute top-full left-2 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Target */}
                <div className="group/target relative">
                  <div className="text-text-secondary mb-1 text-xs">Target</div>
                  <div className="text-primary text-lg font-bold">{targetValue}</div>
                  {targetDescription !== targetValue && (
                    <div className="absolute right-0 bottom-full z-10 mb-2 hidden group-hover/target:block">
                      <div className="bg-foreground text-background rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                        {targetDescription}
                        <div className="border-t-foreground absolute top-full right-2 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar - Always at Bottom */}
            <div className="mt-auto">
              <div className="text-text-secondary mb-2 flex justify-between text-xs">
                <span>Progress to Target</span>
                <span className="font-medium">
                  {calculateProgress(obj.baseline, obj.target).toFixed(0)}%
                </span>
              </div>
              <div className="bg-surface h-2 overflow-hidden rounded-full">
                <motion.div
                  className="bg-primary h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress(obj.baseline, obj.target)}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
