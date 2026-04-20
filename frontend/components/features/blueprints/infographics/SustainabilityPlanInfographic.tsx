/**
 * Sustainability Plan Infographic
 * Visual representation of long-term maintenance and scaling strategy
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, RefreshCw, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface MaintenanceSchedule {
  review_frequency?: string;
  update_triggers?: string[];
}

interface SustainabilityPlanInfographicProps {
  content: string;
  maintenance_schedule?: MaintenanceSchedule;
  scaling_considerations?: string[];
}

export function SustainabilityPlanInfographic({
  content,
  maintenance_schedule,
  scaling_considerations,
}: SustainabilityPlanInfographicProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-success/10 relative overflow-hidden rounded-2xl border border-white/10 p-6"
      >
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="bg-success absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-success/20 rounded-xl p-3"
            >
              <Leaf className="text-success h-6 w-6" />
            </motion.div>
            <h3 className="text-lg font-bold text-white">Long-Term Sustainability</h3>
          </div>
          <p className="text-text-primary text-sm leading-relaxed">{content}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Maintenance Schedule */}
        {maintenance_schedule && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass space-y-4 rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 rounded-xl p-3">
                <RefreshCw className="text-primary h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Maintenance Schedule</h3>
            </div>

            {/* Review Frequency */}
            {maintenance_schedule.review_frequency && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-primary/10 flex items-center gap-3 rounded-lg p-4"
              >
                <Calendar className="text-primary h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                    Review Frequency
                  </p>
                  <p className="text-sm font-medium text-white">
                    {maintenance_schedule.review_frequency}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Update Triggers */}
            {maintenance_schedule.update_triggers &&
              maintenance_schedule.update_triggers.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <AlertCircle className="text-warning h-4 w-4" />
                    <p className="text-sm font-semibold text-white">Update Triggers</p>
                  </div>
                  <div className="space-y-2">
                    {maintenance_schedule.update_triggers.map((trigger, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
                      >
                        <div className="bg-primary mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                        <span className="text-text-primary text-sm">{trigger}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
          </motion.div>
        )}

        {/* Scaling Considerations */}
        {scaling_considerations && scaling_considerations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass space-y-4 rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 rounded-xl p-3">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Scaling Considerations</h3>
            </div>

            <div className="space-y-3">
              {scaling_considerations.map((consideration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="group hover:bg-primary/10 flex items-start gap-3 rounded-lg bg-white/5 p-4 transition-all"
                >
                  <div className="bg-primary/20 text-primary mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-text-primary text-sm leading-relaxed group-hover:text-white">
                    {consideration}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Key Metrics Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="glass rounded-xl border border-white/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-success h-2 w-2 rounded-full" />
            <span className="text-success text-xs font-semibold tracking-wider uppercase">
              Longevity
            </span>
          </div>
          <p className="text-text-primary text-sm">Designed for long-term impact and evolution</p>
        </div>

        <div className="glass rounded-xl border border-white/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-primary h-2 w-2 rounded-full" />
            <span className="text-primary text-xs font-semibold tracking-wider uppercase">
              Adaptability
            </span>
          </div>
          <p className="text-text-primary text-sm">Regular reviews ensure continued relevance</p>
        </div>

        <div className="glass rounded-xl border border-white/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-primary h-2 w-2 rounded-full" />
            <span className="text-primary text-xs font-semibold tracking-wider uppercase">
              Scalability
            </span>
          </div>
          <p className="text-text-primary text-sm">Built to grow with organizational needs</p>
        </div>
      </motion.div>
    </div>
  );
}
