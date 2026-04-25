/**
 * Success Metrics Infographic Component
 * Modern, legible design with light neutral background and high contrast text
 * Mobile-optimized with vertical stacking and reduced clutter
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Target, Activity, BarChart3, ChevronDown } from 'lucide-react';
import type { Metric } from '../types';

interface SuccessMetricsInfographicProps {
  metrics: Metric[];
  reportingCadence?: string | Record<string, any>;
}

/**
 * Helper function to format reporting cadence into a readable string
 */
function formatReportingCadence(cadence: string | Record<string, any> | undefined): string {
  if (!cadence) return '';

  // If it's already a string, return it
  if (typeof cadence === 'string') {
    return cadence;
  }

  // If it's an object, convert it to a readable format
  if (typeof cadence === 'object' && cadence !== null) {
    const frequencies: string[] = [];

    // Check each known reporting frequency field
    // Handle both boolean values and string descriptions
    const checkField = (field: string, label: string) => {
      if (cadence[field]) {
        // If the value is a string (description), use it; otherwise use the label
        if (typeof cadence[field] === 'string' && cadence[field] !== 'true') {
          frequencies.push(cadence[field]);
        } else {
          frequencies.push(label);
        }
      }
    };

    checkField('weekly_reports', 'Weekly');
    checkField('monthly_reports', 'Monthly');
    checkField('quarterly_reviews', 'Quarterly');
    checkField('annual_evaluation', 'Annual');
    checkField('real_time_dashboards', 'Real-time');

    // If we found any frequencies, join them
    if (frequencies.length > 0) {
      return frequencies.join(', ') + ' reporting';
    }

    // Fallback: try to extract and format any keys from the object
    const keys = Object.keys(cadence).filter((k) => cadence[k] && typeof cadence[k] !== 'object');
    if (keys.length > 0) {
      const formatted = keys
        .map((k) => {
          // Convert snake_case to Title Case
          const value = cadence[k];
          // If the value is a descriptive string, use it
          if (
            typeof value === 'string' &&
            value.length > 1 &&
            value !== 'true' &&
            value !== 'false'
          ) {
            return value;
          }
          // Otherwise format the key name
          return k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        })
        .join(', ');

      return formatted || 'Regular reporting';
    }
  }

  return 'Regular reporting';
}

export function SuccessMetricsInfographic({
  metrics,
  reportingCadence,
}: SuccessMetricsInfographicProps): React.JSX.Element {
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set());
  const formattedCadence = formatReportingCadence(reportingCadence);

  const toggleDetails = (index: number) => {
    setExpandedDetails((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Enhanced Header with Reporting Cadence - Brand Styled */}
      {formattedCadence && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center"
        >
          <div className="glass-strong inline-flex items-center gap-3 rounded-xl border border-white/10 px-6 py-3">
            <div className="bg-primary/20 rounded-full p-1.5">
              <Calendar className="text-primary h-4 w-4" />
            </div>
            <span className="text-foreground font-semibold">Reporting: {formattedCadence}</span>
          </div>
        </motion.div>
      )}

      {/* Modern Metrics Grid - Brand Glass Cards */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 lg:gap-8">
        {metrics.map((metric, index) => {
          const isExpanded = expandedDetails.has(index);
          return (
            <motion.div
              key={metric.metric}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
              className="group transition-transform lg:hover:-translate-y-1 lg:hover:scale-[1.01]"
            >
              <div className="glass-card lg:hover:border-primary/30 lg:hover:shadow-primary/10 relative overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 lg:hover:shadow-xl">
                {/* Ambient gradient overlay - desktop only */}
                <div className="bg-primary/5 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 lg:group-hover:opacity-100" />

                {/* Content Container */}
                <div className="relative z-10 p-5 lg:p-8">
                  {/* Header Section */}
                  <div className="mb-5 flex items-start justify-between gap-3 lg:mb-6">
                    <div className="min-w-0 flex-1">
                      {/* KPI Badge - hide on mobile to reduce clutter */}
                      <div className="border-primary/30 bg-primary/10 text-primary mb-2 hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wider uppercase lg:mb-3 lg:inline-flex">
                        <BarChart3 className="h-3 w-3" />
                        KPI METRIC
                      </div>
                      <h3 className="text-foreground text-lg leading-tight font-bold break-words lg:text-xl">
                        {metric.metric}
                      </h3>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="bg-success/20 lg:hover:bg-success/30 text-success flex-shrink-0 rounded-full p-2 transition-colors"
                    >
                      <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
                    </motion.div>
                  </div>

                  {/* Current vs Target - Modern Comparison Design */}
                  <div className="mb-6 lg:mb-8">
                    {/* Metric Header */}
                    <div className="mb-3 flex items-center justify-between gap-2 lg:mb-4">
                      <div className="text-text-secondary text-xs font-medium tracking-wider uppercase">
                        Performance
                      </div>
                      {/* Hide redundant badge on mobile */}
                      <div className="border-primary/30 bg-primary/10 text-primary hidden rounded-full border px-2 py-1 text-xs font-semibold lg:block lg:px-3">
                        KPI TRACKING
                      </div>
                    </div>

                    {/* Integrated Current/Target Display - Vertical on mobile, horizontal on desktop */}
                    <motion.div
                      className="glass-strong rounded-2xl border border-white/10 p-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      {/* Mobile: Vertical Stack, Desktop: Horizontal Layout */}
                      <div className="relative flex flex-col lg:flex-row">
                        {/* Current Value Section */}
                        <div className="bg-surface/50 relative flex-1 rounded-t-xl border-b border-white/20 p-4 lg:rounded-l-xl lg:rounded-tr-none lg:border-r lg:border-b-0 lg:p-6">
                          <div className="text-text-secondary mb-1 text-xs font-medium tracking-wider uppercase lg:mb-2">
                            Current
                          </div>
                          <motion.div
                            className="text-foreground text-xl font-bold lg:text-2xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.4 }}
                          >
                            {metric.current_baseline}
                          </motion.div>
                          <div className="text-text-secondary mt-1 text-xs">Baseline</div>
                        </div>

                        {/* Comparison Indicator - Horizontal on mobile, vertical on desktop */}
                        <div className="border-primary/30 bg-primary/10 flex h-12 items-center justify-center border-t border-b lg:h-auto lg:w-16 lg:border-t-0 lg:border-r lg:border-b-0 lg:border-l">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: index * 0.1 + 0.35,
                              duration: 0.5,
                              ease: 'backOut',
                            }}
                            className="bg-primary rounded-full p-1.5 text-white lg:p-2"
                          >
                            <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" />
                          </motion.div>
                        </div>

                        {/* Target Value Section */}
                        <div className="border-primary/30 bg-primary/10 relative flex-1 rounded-b-xl border-t border-white/20 p-4 lg:rounded-r-xl lg:rounded-bl-none lg:border-t-0 lg:border-l lg:p-6">
                          <div className="text-primary mb-1 text-xs font-medium tracking-wider uppercase lg:mb-2">
                            Target
                          </div>
                          <motion.div
                            className="text-primary text-xl font-bold lg:text-2xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                          >
                            {metric.target}
                          </motion.div>
                          <div className="text-primary/80 mt-1 text-xs">Goal</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Progress Indicator */}
                    <motion.div
                      className="bg-surface/50 relative mt-3 h-2 overflow-hidden rounded-full lg:mt-4"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: index * 0.1 + 0.6, duration: 0.8, ease: 'easeOut' }}
                    >
                      <motion.div
                        className="from-primary/60 to-primary h-full rounded-full bg-gradient-to-r"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ delay: index * 0.1 + 0.7, duration: 1.2, ease: 'easeOut' }}
                      />
                    </motion.div>
                  </div>

                  {/* Measurement Details - Collapsible on mobile, always visible on desktop */}
                  <div className="lg:block">
                    {/* Mobile: Collapsible toggle button */}
                    <button
                      onClick={() => toggleDetails(index)}
                      className="flex w-full items-center justify-between rounded-lg bg-white/5 p-3 text-sm font-medium text-white transition-colors hover:bg-white/10 lg:hidden"
                    >
                      <span className="flex items-center gap-2">
                        <Activity className="text-primary h-4 w-4" />
                        Details
                      </span>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>

                    {/* Details content - conditional on mobile, always visible on desktop */}
                    <motion.div
                      initial={false}
                      animate={{
                        height: isExpanded ? 'auto' : 0,
                        opacity: isExpanded ? 1 : 0,
                        marginTop: isExpanded ? 12 : 0,
                      }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden lg:!mt-0 lg:!h-auto lg:!opacity-100"
                    >
                      <div className="bg-surface/30 mt-3 space-y-3 rounded-xl border border-white/10 p-3 lg:mt-0 lg:space-y-4 lg:p-4">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="bg-primary/20 text-primary rounded-lg p-1.5">
                            <Activity className="h-3 w-3 lg:h-4 lg:w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-text-secondary text-xs font-medium">
                              Measurement Method
                            </div>
                            <div className="text-foreground text-sm font-medium break-words">
                              {metric.measurement_method}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="bg-primary/20 text-primary rounded-lg p-1.5">
                            <Target className="h-3 w-3 lg:h-4 lg:w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-text-secondary text-xs font-medium">
                              Evaluation Timeline
                            </div>
                            <div className="text-foreground text-sm font-medium break-words">
                              {metric.timeline}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Brand accent line */}
                <motion.div
                  className="from-primary to-primary/60 absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.8, ease: 'easeOut' }}
                  style={{ transformOrigin: 'left' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
