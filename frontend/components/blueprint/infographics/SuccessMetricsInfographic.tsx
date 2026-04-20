/**
 * Success Metrics Infographic Component
 * Modern, legible design with light neutral background and high contrast text
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Target, Activity, BarChart3 } from 'lucide-react';
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
  const formattedCadence = formatReportingCadence(reportingCadence);

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Reporting Cadence */}
      {formattedCadence && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-6 py-3 shadow-sm">
            <div className="rounded-full bg-teal-100 p-1.5">
              <Calendar className="h-4 w-4 text-teal-600" />
            </div>
            <span className="font-semibold text-gray-900">Reporting: {formattedCadence}</span>
          </div>
        </motion.div>
      )}

      {/* Modern Metrics Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.metric}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group"
          >
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
              {/* Content Container */}
              <div className="p-8">
                {/* Header Section */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold tracking-wider text-teal-700 uppercase">
                      <BarChart3 className="h-3 w-3" />
                      KPI METRIC
                    </div>
                    <h3 className="text-xl leading-tight font-bold text-gray-900">
                      {metric.metric}
                    </h3>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="rounded-full bg-green-50 p-2 text-green-600 transition-colors group-hover:bg-green-100"
                  >
                    <TrendingUp className="h-5 w-5" />
                  </motion.div>
                </div>

                {/* Current vs Target - Modern Comparison Design */}
                <div className="mb-8">
                  {/* Metric Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-xs font-medium tracking-wider text-gray-600 uppercase">
                      Performance Comparison
                    </div>
                    <div className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      KPI TRACKING
                    </div>
                  </div>

                  {/* Integrated Current/Target Display */}
                  <motion.div
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <div className="relative flex">
                      {/* Current Value Section */}
                      <div className="relative flex-1 rounded-l-xl border-r border-gray-200 bg-white p-6">
                        <div className="mb-2 text-xs font-medium tracking-wider text-gray-600 uppercase">
                          Current
                        </div>
                        <motion.div
                          className="text-2xl font-bold text-gray-900"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                        >
                          {metric.current_baseline}
                        </motion.div>
                        <div className="mt-1 text-xs text-gray-500">Baseline performance</div>
                      </div>

                      {/* Comparison Indicator */}
                      <div className="flex w-16 items-center justify-center border-r border-l border-teal-200 bg-teal-50">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.35, duration: 0.5, ease: 'backOut' }}
                          className="rounded-full bg-teal-600 p-2 text-white"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </motion.div>
                      </div>

                      {/* Target Value Section */}
                      <div className="relative flex-1 rounded-r-xl border-l border-teal-200 bg-teal-50 p-6">
                        <div className="mb-2 text-xs font-medium tracking-wider text-teal-700 uppercase">
                          Target
                        </div>
                        <motion.div
                          className="text-2xl font-bold text-teal-700"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                        >
                          {metric.target}
                        </motion.div>
                        <div className="mt-1 text-xs text-teal-600">Goal achievement</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Progress Indicator */}
                  <motion.div
                    className="relative mt-4 h-2 overflow-hidden rounded-full bg-gray-200"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 + 0.6, duration: 0.8, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="h-full rounded-full bg-teal-600"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ delay: index * 0.1 + 0.7, duration: 1.2, ease: 'easeOut' }}
                    />
                  </motion.div>
                </div>

                {/* Measurement Details - Redesigned */}
                <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-teal-100 p-1.5 text-teal-600">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-600">Measurement Method</div>
                      <div className="text-sm font-medium text-gray-900">
                        {metric.measurement_method}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-teal-100 p-1.5 text-teal-600">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-600">Evaluation Timeline</div>
                      <div className="text-sm font-medium text-gray-900">{metric.timeline}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle accent line */}
              <motion.div
                className="absolute bottom-0 left-0 h-1 w-full bg-teal-600"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.8, ease: 'easeOut' }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
